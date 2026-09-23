import dotenv from "dotenv";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Profile } from "passport-google-oauth20";
import type { VerifyCallback } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/userModel.js";
import profileModel from "../models/profileModel.js";

dotenv.config();

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL = process.env.CALLBACKURL;

if (!clientID || !clientSecret || !callbackURL) {
    throw new Error("Google OAuth environment variables are missing");
}

passport.use(
    new GoogleStrategy(
        {
            clientID,
            clientSecret,
            callbackURL,
            state: true,
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
                    return done(new Error("Google account does not have an email"));
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
                return done(error as Error);
            }
        }
    )
);

// ============================================================
// GitHub OAuth 2.0 Strategy
// ============================================================

export function getGithubCallbackUrl(): string {
    // 1. Explicit GITHUB_CALLBACK_URL (e.g. from Render dashboard)
    if (process.env.GITHUB_CALLBACK_URL) {
        return process.env.GITHUB_CALLBACK_URL;
    }
    // 2. Render automatic external URL environment variable
    if (process.env.RENDER_EXTERNAL_URL) {
        return `${process.env.RENDER_EXTERNAL_URL}/api/auth/github/callback`;
    }
    // 3. Auto-derive from existing Google CALLBACKURL on production
    if (process.env.CALLBACKURL && process.env.CALLBACKURL.includes("/api/auth/google/callback")) {
        return process.env.CALLBACKURL.replace("/api/auth/google/callback", "/api/auth/github/callback");
    }
    // 4. Fallback to SERVER_URL if defined
    if (process.env.SERVER_URL) {
        return `${process.env.SERVER_URL}/api/auth/github/callback`;
    }
    // 5. Localhost development fallback
    return "http://localhost:3000/api/auth/github/callback";
}

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
                done: (err?: any, user?: any) => void
            ) => {
                try {
                    const linkUserId = req.session?.linkUserId;
                    if (!linkUserId) {
                        return done(new Error("GitHub account linking requires an authenticated session. Please log in first."));
                    }

                    const username = profile.username || `github_user_${profile.id}`;
                    const avatarUrl = profile.photos?.[0]?.value || `https://avatars.githubusercontent.com/u/${profile.id}?v=4`;
                    const profileUrl = profile.profileUrl || `https://github.com/${username}`;

                    // 1. Prevent collisions: check if another account already linked this GitHub account
                    const existingWithGithub = await User.findOne({
                        $or: [{ githubId: profile.id }, { githubUsername: username }],
                        _id: { $ne: linkUserId },
                    });

                    if (existingWithGithub) {
                        return done(new Error("This GitHub account is already linked to another PortalAcademia profile."));
                    }

                    // 2. Fetch authenticated user
                    const user = await User.findById(linkUserId);
                    if (!user) {
                        return done(new Error("Authenticated user account not found."));
                    }

                    // 3. Attach verified GitHub credentials to the user account
                    user.githubId = profile.id;
                    user.githubUsername = username;
                    user.githubAvatarUrl = avatarUrl;
                    user.githubProfileUrl = profileUrl;
                    await user.save();

                    // 4. Synchronize profileModel with verified GitHub credentials
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
                    return done(error as Error);
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