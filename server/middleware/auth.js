import jwt from "jsonwebtoken"
import User from "../models/User.js"

// Middleware to protect routes - verify JWT token
export const protectRoute = async (req, res, next) => {
    try {
        // Get token from headers (support both 'token' and 'Authorization' header)
        let token = req.headers.token || req.headers.authorization

        // If using Authorization header with Bearer scheme
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1]
        }

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized - No token provided",
            })
        }

        // Verify JWT_SECRET exists
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not defined in environment variables")
            return res.status(500).json({
                success: false,
                message: "Server configuration error",
            })
        }

        // Verify token
        let decoded
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET)
        } catch (jwtError) {
            // Handle specific JWT errors
            if (jwtError.name === "TokenExpiredError") {
                return res.status(401).json({
                    success: false,
                    message: "Session expired - Please login again",
                    code: "TOKEN_EXPIRED",
                })
            }
            if (jwtError.name === "JsonWebTokenError") {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token - Please login again",
                    code: "INVALID_TOKEN",
                })
            }
            throw jwtError
        }

        // Check if decoded has userId
        if (!decoded || !decoded.userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid token format",
            })
        }

        // Find user by id (exclude password)
        const user = await User.findById(decoded.userId).select("-password")

        // Check if user exists
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found - Account may have been deleted",
            })
        }

        // Attach user to request object
        req.user = user

        // Proceed to next middleware/route handler
        next()
    } catch (error) {
        console.error("Auth middleware error:", error)

        // Handle unexpected errors
        return res.status(500).json({
            success: false,
            message: "Authentication failed - Please try again",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        })
    }
}

// Optional: Middleware to check if user is authenticated (doesn't block, just sets user if token valid)
export const optionalAuth = async (req, res, next) => {
    try {
        let token = req.headers.token || req.headers.authorization

        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1]
        }

        if (token && process.env.JWT_SECRET) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET)
                if (decoded && decoded.userId) {
                    const user = await User.findById(decoded.userId).select("-password")
                    if (user) {
                        req.user = user
                    }
                }
            } catch (jwtError) {
                // Silently fail - user remains unauthenticated
                console.log("Optional auth: Token invalid or expired")
            }
        }

        next()
    } catch (error) {
        // Don't block the request, just log error
        console.error("Optional auth error:", error)
        next()
    }
}

// Middleware to check if user is admin (extends protectRoute)
export const adminOnly = async (req, res, next) => {
    try {
        // First run protectRoute to ensure user is authenticated
        await protectRoute(req, res, (err) => {
            if (err) return next(err)
        })

        // Check if user exists and is admin (you can add an isAdmin field to User model)
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Access denied - Admin privileges required",
            })
        }

        next()
    } catch (error) {
        console.error("Admin check error:", error)
        return res.status(500).json({
            success: false,
            message: "Authorization failed",
        })
    }
}

// Middleware to check if user owns the resource or is admin
export const isOwnerOrAdmin = (resourceUserId) => {
    return async (req, res, next) => {
        try {
            // First ensure user is authenticated
            await protectRoute(req, res, (err) => {
                if (err) return next(err)
            })

            const userId = req.user._id.toString()
            const resourceId = resourceUserId.toString()

            // Check if user is owner or admin
            if (userId !== resourceId && !req.user.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied - You don't have permission to modify this resource",
                })
            }

            next()
        } catch (error) {
            console.error("Owner check error:", error)
            return res.status(500).json({
                success: false,
                message: "Authorization failed",
            })
        }
    }
}

// Rate limiting middleware for auth routes (simple in-memory version)
const loginAttempts = new Map()

export const rateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress
        const now = Date.now()

        // Clean up old entries
        if (loginAttempts.has(ip)) {
            const attempts = loginAttempts.get(ip)
            const recentAttempts = attempts.filter((timestamp) => now - timestamp < windowMs)

            if (recentAttempts.length >= maxAttempts) {
                return res.status(429).json({
                    success: false,
                    message: "Too many login attempts. Please try again later.",
                })
            }

            loginAttempts.set(ip, recentAttempts)
        }

        next()
    }
}

// Record failed login attempt
export const recordFailedAttempt = (req) => {
    const ip = req.ip || req.connection.remoteAddress
    const attempts = loginAttempts.get(ip) || []
    attempts.push(Date.now())
    loginAttempts.set(ip, attempts)
}

// Clear rate limit for IP (useful after successful login)
export const clearRateLimit = (req) => {
    const ip = req.ip || req.connection.remoteAddress
    loginAttempts.delete(ip)
}
