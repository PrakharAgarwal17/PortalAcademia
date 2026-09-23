import dotenv from "dotenv";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Profile } from "passport-google-oauth20";
import type { VerifyCallback } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import profileModel from "../models/profileModel.js";

dotenv.config();

// ============================================================
// Dynamic Callback URL Resolvers
// ============================================================

export function getGoogleCallbackUrl(): string {
    if (process.env.CALLBACKURL && !process.env.CALLBACKURL.includes("localhost") && process.env.CALLBACKURL.startsWith("http")) {
        return process.env.CALLBACKURL;
    }
    if (process.env.RENDER_EXTERNAL_URL) {
        return `${process.env.RENDER_EXTERNAL_URL}/api/auth/google/callback`;
    }
    if (process.env.SERVER_URL) {
        return `${process.env.SERVER_URL}/api/auth/google/callback`;
    }
    if (process.env.CALLBACKURL) {
        return process.env.CALLBACKURL;
    }
    return "http://localhost:3000/api/auth/google/callback";
}

export function getGithubCallbackUrl(): string {
    if (process.env.GITHUB_CALLBACK_URL && !process.env.GITHUB_CALLBACK_URL.includes("localhost") && process.env.GITHUB_CALLBACK_URL.startsWith("http")) {
        return process.env.GITHUB_CALLBACK_URL;
    }
    if (process.env.RENDER_EXTERNAL_URL) {
        return `${process.env.RENDER_EXTERNAL_URL}/api/auth/github/callback`;
    }
    if (process.env.CALLBACKURL && process.env.CALLBACKURL.includes("/api/auth/google/callback")) {
        return process.env.CALLBACKURL.replace("/api/auth/google/callback", "/api/auth/github/callback");
    }
    if (process.env.SERVER_URL) {
        return `${process.env.SERVER_URL}/api/auth/github/callback`;
    }
    if (process.env.GITHUB_CALLBACK_URL) {
        return process.env.GITHUB_CALLBACK_URL;
    }
    return "http://localhost:3000/api/auth/github/callback";
}

// ============================================================
// Google OAuth 2.0 Strategy
// ============================================================

const googleClientID = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackURL = getGoogleCallbackUrl();

if (!googleClientID || !googleClientSecret) {
    console.warn("[Passport] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured. Google OAuth disabled.");
} else {
    passport.use(
        new GoogleStrategy(
            {
                clientID: googleClientID,
                clientSecret: googleClientSecret,
                callbackURL: googleCallbackURL,
                // Note: state is passed as a signed token in passport.authenticate({ state: ... }),
                // so state: true (which requires server-side session memory) is omitted for cross-host reliability.
            },
            async (
                accessToken: string,
                refreshToken: string,
                profile: Profile,
                done: VerifyCallback
            ) => {
                try {
                    const email = profile.emails?.[0]?.value;

                    if (!email) {
                        return done(null, false, { message: "Google account does not have an email" });
                    }

                    let user = await User.findOne({ email });

                    if (!user) {
                        user = await User.create({
                            email,
                            provider: "google",
                            providerID: profile.id,
                            isVerified: true,
                            isOnboarded: false,
                        });
                    } else {
                        let needsSave = false;
                        if (!user.providerID) {
                            user.provider = "google";
                            user.providerID = profile.id;
                            user.isVerified = true;
                            needsSave = true;
                        }
                        if (needsSave) {
                            await user.save();
                        }
                    }

                    // If a profile exists in the DB, ensure user.isOnboarded is synced to true
                    const existingProfile = await profileModel.findOne({ userId: user._id });
                    if (existingProfile && !user.isOnboarded) {
                        user.isOnboarded = true;
                        await user.save();
                    }

                    return done(null, user);
                } catch (error) {
                    console.error("[Passport GoogleStrategy Error]:", error);
                    return done(error as Error);
                }
            }
        )
    );
}

// ============================================================
// GitHub OAuth 2.0 Strategy (Developer Verification Only)
// ============================================================

const githubClientID = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const githubCallbackURL = getGithubCallbackUrl();

if (githubClientID && githubClientSecret) {
    passport.use(
        new GitHubStrategy(
            {
                clientID: githubClientID,
                clientSecret: githubClientSecret,
                callbackURL: githubCallbackURL,
                scope: ["user:email", "read:user"],
                passReqToCallback: true,
            },
            async (
                req: any,
                accessToken: string,
                refreshToken: string,
                profile: any,
                done: (err?: any, user?: any, info?: any) => void
            ) => {
                try {
                    // 1. Resolve authenticated user ID from cryptographically signed state token first
                    let linkUserId: string | null = null;
                    const stateParam = (req.query?.state || req.body?.state) as string | undefined;

                    if (stateParam) {
                        try {
                            const accessSecret = process.env.SECRET_ACCESS_TOKEN || process.env.JWT_PASS_KEY;
                            if (accessSecret) {
                                const decoded = jwt.verify(stateParam, accessSecret) as any;
                                if (decoded?.userId) {
                                    linkUserId = String(decoded.userId);
                                }
                            }
                        } catch (stateErr) {
                            console.warn("[Passport GitHubStrategy] State token validation warning:", stateErr);
                        }
                    }

                    // 2. Fallback to session linkUserId if state token was absent
                    if (!linkUserId && req.session?.linkUserId) {
                        linkUserId = String(req.session.linkUserId);
                    }

                    // 3. Fallback to auth cookies
                    if (!linkUserId) {
                        const accessTokenCookie = req.cookies?.accesstoken;
                        const accessSecret = process.env.SECRET_ACCESS_TOKEN || process.env.JWT_PASS_KEY;
                        if (accessTokenCookie && accessSecret) {
                            try {
                                const decoded = jwt.verify(accessTokenCookie, accessSecret) as any;
                                linkUserId = decoded.id || decoded.userId || null;
                            } catch { }
                        }
                    }

                    if (!linkUserId) {
                        console.warn("[Passport GitHubStrategy] Unauthenticated linking attempt - linkUserId could not be identified.");
                        return done(null, false, { message: "github_connect_requires_login" });
                    }

                    const username = profile.username || `github_user_${profile.id}`;
                    const avatarUrl = profile.photos?.[0]?.value || `https://avatars.githubusercontent.com/u/${profile.id}?v=4`;
                    const profileUrl = profile.profileUrl || `https://github.com/${username}`;

                    // 4. Prevent collisions: check if another account already linked this GitHub account
                    const existingWithGithub = await User.findOne({
                        $or: [{ githubId: profile.id }, { githubUsername: username }],
                        _id: { $ne: linkUserId },
                    });

                    if (existingWithGithub) {
                        console.warn(`[Passport GitHubStrategy] GitHub ID ${profile.id} is already linked to another profile.`);
                        return done(null, false, { message: "github_already_linked" });
                    }

                    // 5. Fetch authenticated user
                    const user = await User.findById(linkUserId);
                    if (!user) {
                        console.warn(`[Passport GitHubStrategy] User not found for ID: ${linkUserId}`);
                        return done(null, false, { message: "user_not_found" });
                    }

                    // 6. Attach verified GitHub credentials to the user account
                    user.githubId = profile.id;
                    user.githubUsername = username;
                    user.githubAvatarUrl = avatarUrl;
                    user.githubProfileUrl = profileUrl;
                    await user.save();

                    // 7. Synchronize profileModel with verified GitHub credentials
                    const existingProfile = await profileModel.findOne({ userId: user._id });
                    if (existingProfile) {
                        existingProfile.github = profileUrl;
                        existingProfile.githubUsername = username;
                        existingProfile.githubAvatarUrl = avatarUrl;
                        await existingProfile.save();
                    }

                    return done(null, user);
                } catch (error) {
                    console.error("[Passport GitHubStrategy Error]:", error);
                    return done(null, false, { message: "github_linking_error" });
                }
            }
        )
    );
} else {
    console.warn(
        "[Passport] GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET not configured. GitHub OAuth route disabled until environment secrets are set."
    );
}

passport.serializeUser((user, done) => {
    done(null, (user as typeof User.prototype).id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);

        if (!user) {
            return done(null, false);
        }

        return done(null, user);
    } catch (error) {
        return done(error as Error);
    }
});

export default passport;