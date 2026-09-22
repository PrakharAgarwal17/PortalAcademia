import dotenv from "dotenv";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Profile } from "passport-google-oauth20";
import type { VerifyCallback } from "passport-google-oauth20";
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