import jwt from "jsonwebtoken";
function getAccessSecret() {
    return process.env.SECRET_ACCESS_TOKEN || process.env.JWT_PASS_KEY || "access_token_secret_key";
}
function getRefreshSecret() {
    return process.env.SECRET_REFRESH_TOKEN || process.env.JWT_REFRESH_KEY || process.env.JWT_PASS_KEY || "refresh_token_secret_key";
}
export default function isloggedIn(req, res, next) {
    try {
        const accessToken = req.cookies?.accesstoken;
        const refreshToken = req.cookies?.refreshtoken;
        if (accessToken) {
            try {
                const check = jwt.verify(accessToken, getAccessSecret());
                const userId = check.id || check.userId;
                if (userId) {
                    req.userId = userId;
                    return next();
                }
            }
            catch (tokenErr) {
                // accesstoken expired or invalid, fall through to refreshtoken
            }
        }
        if (refreshToken) {
            try {
                const check = jwt.verify(refreshToken, getRefreshSecret());
                const userId = check.id || check.userId;
                if (userId) {
                    req.userId = userId;
                    // Re-issue new accesstoken
                    const isProd = process.env.NODE_ENV === "production";
                    const newAccessToken = jwt.sign({ id: userId }, getAccessSecret(), {
                        expiresIn: "15m",
                    });
                    res.cookie("accesstoken", newAccessToken, {
                        httpOnly: true,
                        secure: isProd,
                        sameSite: isProd ? "none" : "lax",
                        path: "/",
                        maxAge: 15 * 60 * 1000,
                    });
                    return next();
                }
            }
            catch (refreshErr) {
                // refreshToken invalid
            }
        }
        return res.status(401).json({ message: "Unauthorized User" });
    }
    catch (err) {
        console.log(err);
        return res.status(401).json({ message: "Invalid or Expired Token" });
    }
}
//# sourceMappingURL=isloggedIn.js.map