import jwt from "jsonwebtoken"
import { config } from "dotenv"

// Load environment variables
config()

// Generate JWT token for a user
export const generateToken = (userId) => {
    try {
        if (!userId) {
            throw new Error("User ID is required to generate token")
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables")
        }

        const token = jwt.sign(
            { userId },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }, // Token expires in 7 days
        )

        return token
    } catch (error) {
        console.error("Error generating token:", error)
        throw error
    }
}

// Verify JWT token
export const verifyToken = (token) => {
    try {
        if (!token) {
            throw new Error("Token is required")
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables")
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        return {
            valid: true,
            decoded,
            userId: decoded.userId,
        }
    } catch (error) {
        return {
            valid: false,
            error: error.message,
        }
    }
}

// Format user data (remove sensitive info)
export const formatUser = (user) => {
    if (!user) return null

    const { password, ...safeUser } = user.toObject ? user.toObject() : user
    return safeUser
}

// Generate random string (for various purposes)
export const generateRandomString = (length = 10) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

// Format timestamp to relative time (e.g., "2 hours ago")
export const formatRelativeTime = (timestamp) => {
    const now = new Date()
    const date = new Date(timestamp)
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) {
        return "just now"
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
        return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
        return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
        return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`
    }

    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) {
        return `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"} ago`
    }

    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) {
        return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`
    }

    const diffInYears = Math.floor(diffInDays / 365)
    return `${diffInYears} ${diffInYears === 1 ? "year" : "years"} ago`
}

// Validate email format
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

// Validate password strength
export const validatePassword = (password) => {
    return {
        isValid: password.length >= 6,
        message: password.length >= 6 ? "Valid password" : "Password must be at least 6 characters long",
    }
}

// Sanitize input (basic XSS prevention)
export const sanitizeInput = (input) => {
    if (typeof input !== "string") return input

    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}

// Pagination helper
export const getPagination = (page = 1, limit = 20) => {
    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)))
    const skip = (pageNum - 1) * limitNum

    return {
        page: pageNum,
        limit: limitNum,
        skip,
    }
}

// Create API response
export const createResponse = (success, message, data = null, statusCode = 200) => {
    return {
        success,
        message,
        data,
        statusCode,
        timestamp: new Date().toISOString(),
    }
}

// Handle async errors
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}

// Get client IP address
export const getClientIp = (req) => {
    return req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress || "unknown"
}

// Sleep/delay function
export const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

// Retry function with exponential backoff
export const retry = async (fn, maxRetries = 3, baseDelay = 1000) => {
    let lastError

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error
            const delay = baseDelay * Math.pow(2, i)
            await sleep(delay)
        }
    }

    throw lastError
}

// Chunk array into smaller arrays
export const chunkArray = (array, size) => {
    if (!Array.isArray(array) || size < 1) return []

    const chunks = []
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
    }
    return chunks
}

// Check if object is empty
export const isEmpty = (obj) => {
    return obj === null || obj === undefined || (typeof obj === "object" && Object.keys(obj).length === 0)
}
