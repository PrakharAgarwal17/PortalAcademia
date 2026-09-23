import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 20, // 20 attempts per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { 
        success: false, 
        message: "Too many authentication requests from this IP. Please try again in 15 minutes." 
    },
});

export const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 20, // 20 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { 
        success: false, 
        message: "AI query rate limit exceeded. Please wait a moment before trying again." 
    },
});

export const applicationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 30, // 30 applications per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: { 
        success: false, 
        message: "Application submission limit exceeded. Please try again later." 
    },
});

export const uploadLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    limit: 15, // 15 uploads per 10 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { 
        success: false, 
        message: "Document upload limit reached. Please wait a few minutes before trying again." 
    },
});
