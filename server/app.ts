import "dotenv/config";
import express from 'express'
import helmet from 'helmet'

// Mandatory fail-fast environment validation
const REQUIRED_SECRETS = ["SECRET_ACCESS_TOKEN", "SECRET_REFRESH_TOKEN", "SESSION_SECRET"];
for (const secret of REQUIRED_SECRETS) {
    if (!process.env[secret] || process.env[secret]?.trim() === "") {
        console.error(`FATAL: Mandatory environment variable [${secret}] is missing. Server startup aborted.`);
        process.exit(1);
    }
}

import connectDB from './config/connectDB.js'
import "./config/redisClient.js"
import { isRedisAvailable } from "./config/redisClient.js"
import mongoose from "mongoose"
import authRoute from "./routes/authRoute.js"
import profileRoute from "./routes/profileRoute.js"
import onboardingRoute from "./routes/onboardingRoute.js"
import uploadRoute from "./routes/uploadRoute.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import "./config/Passport.js"
import session from "express-session";
import passport from "passport"

import opportunityRoute from "./routes/opportunityRoute.js"
import applicationRoute from "./routes/applicationRoute.js"
import assessmentRoute from "./routes/assessmentRoute.js"
import verificationRoute from "./routes/verificationRoute.js"
import analyticsRoute from "./routes/analyticsRoute.js"
import aiRoute from "./routes/aiRoute.js"
import paymentRoute from "./routes/paymentRoute.js"
import openSourceRoute from "./routes/openSourceRoute.js"
import notificationRoute from "./routes/notificationRoute.js"
import mentorshipRoute from "./routes/mentorshipRoute.js"
import communityRoute from "./routes/communityRoute.js"
import http from "http"
import { Server as SocketIOServer } from "socket.io"
import jwt from "jsonwebtoken"
import type { JwtPayload } from "jsonwebtoken"
import { registerMentorshipSocket } from "./sockets/mentorshipSocket.js"
import { registerCommunitySocket } from "./sockets/communitySocket.js"

const app=express()
// Connect to PortalAcademia Database
connectDB()

// Trust reverse proxy in production (Render, Railway, Heroku, etc.)
// Without this, express won't see HTTPS and will refuse to set Secure cookies
app.set("trust proxy", 1);

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://portal-academia-phi.vercel.app",
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.replace(/\/+$/, "")] : []),
];

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
}));

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalized = origin.replace(/\/+$/, "");
        if (allowedOrigins.includes(normalized) || normalized.endsWith(".vercel.app")) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked for unauthorized origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
}))

const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.RENDER === "true" ||
    Boolean(process.env.FRONTEND_URL?.startsWith("https://"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "portalacademia_oauth_session_secret_fallback_2026",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,                           // HTTPS only in production/proxies
      sameSite: isProduction ? "none" : "lax",        // cross-site cookies for deployed env
      maxAge: 10 * 60 * 1000,                         // 10 minutes (just for OAuth handshake)
    },
  })
);

app.use(passport.initialize())
app.use(passport.session())

app.use(cookieParser())
app.use(express.json({
    verify: (req: any, _res, buf) => {
        req.rawBody = buf;
    }
}))
app.use(express.urlencoded({extended:true}))

app.get('/',(req,res)=>{
    res.send("Working website")
})

app.get('/api/health', (req, res) => {
    const mongoStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    const redisStatus = isRedisAvailable() ? "connected" : "in-memory-fallback";
    res.status(200).json({
        status: "healthy",
        uptime: process.uptime(),
        database: {
            mongodb: mongoStatus,
            redis: redisStatus,
        },
        timestamp: new Date().toISOString(),
    });
})
app.use("/api/auth",authRoute)
app.use("/api/profile",profileRoute)
app.use("/api/onboarding",onboardingRoute)
app.use("/api/upload",uploadRoute)
app.use("/api/opportunities",opportunityRoute)
app.use("/api/applications",applicationRoute)
app.use("/api/assessments",assessmentRoute)
app.use("/api/verification",verificationRoute)
app.use("/api/analytics",analyticsRoute)
app.use("/api/ai",aiRoute)
app.use("/api/payment",paymentRoute)
app.use("/api/opensource",openSourceRoute)
app.use("/api/notifications",notificationRoute)
app.use("/api/mentorship", mentorshipRoute)
app.use("/api/community", communityRoute)

function parseCookies(cookieHeader?: string): Record<string, string> {
    const list: Record<string, string> = {};
    if (!cookieHeader) return list;
    cookieHeader.split(";").forEach((cookie) => {
        const parts = cookie.split("=");
        if (parts.length >= 2 && parts[0]) {
            const name = parts[0].trim();
            const value = decodeURIComponent(parts.slice(1).join("=").trim());
            list[name] = value;
        }
    });
    return list;
}

const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const normalized = origin.replace(/\/+$/, "");
            if (allowedOrigins.includes(normalized) || normalized.endsWith(".vercel.app")) {
                return callback(null, true);
            }
            return callback(null, true);
        },
        credentials: true,
        methods: ["GET", "POST"],
    },
});

// Socket.IO authentication middleware via handshake cookies and auth tokens strictly
io.use((socket, next) => {
    try {
        const cookieHeader = socket.handshake.headers.cookie;
        const cookies = parseCookies(cookieHeader);
        const authToken = socket.handshake.auth?.token as string | undefined;
        const token = cookies.accesstoken || cookies.refreshtoken || authToken;

        if (!token) {
            return next(new Error("Unauthorized: Authentication token is required for real-time socket connections."));
        }

        const accessSecret = process.env.SECRET_ACCESS_TOKEN || process.env.JWT_PASS_KEY!;
        try {
            const decoded = jwt.verify(token, accessSecret) as JwtPayload;
            socket.data.userId = decoded.id || decoded.userId;
            return next();
        } catch {
            try {
                const refreshSecret = process.env.SECRET_REFRESH_TOKEN || process.env.JWT_REFRESH_KEY || process.env.JWT_PASS_KEY!;
                const decoded = jwt.verify(cookies.refreshtoken || token, refreshSecret) as JwtPayload;
                socket.data.userId = decoded.id || decoded.userId;
                return next();
            } catch {
                return next(new Error("Unauthorized: Invalid or expired session credentials."));
            }
        }
    } catch {
        return next(new Error("Unauthorized: Socket authentication failed."));
    }
});

io.on("connection", (socket) => {
    registerMentorshipSocket(io, socket);
    registerCommunitySocket(io, socket);
});

// Global production-safe error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled Server Error:", err);
    if (res.headersSent) return;
    const isProd = process.env.NODE_ENV === "production";
    res.status(err.status || 500).json({
        success: false,
        message: isProd ? "Internal Server Error" : (err.message || "Something went wrong"),
        ...(isProd ? {} : { stack: err.stack }),
    });
});

httpServer.listen(3000, () => {
    console.log("PortalAcademia server & Socket.IO running on port 3000");
});