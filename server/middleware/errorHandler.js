// Central error handling middleware
export const errorHandler = (err, req, res, next) => {
    console.error("Error:", err)

    // Default error
    let error = { ...err }
    error.message = err.message
    error.statusCode = err.statusCode || 500

    // Mongoose bad ObjectId
    if (err.name === "CastError") {
        const message = "Resource not found"
        error = { message, statusCode: 404 }
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0]
        const message = `Duplicate value entered for ${field} field`
        error = { message, statusCode: 400 }
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
        const message = Object.values(err.errors)
            .map((val) => val.message)
            .join(", ")
        error = { message, statusCode: 400 }
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
        const message = "Invalid token"
        error = { message, statusCode: 401 }
    }

    if (err.name === "TokenExpiredError") {
        const message = "Token expired"
        error = { message, statusCode: 401 }
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Server Error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    })
}

// 404 handler
export const notFound = (req, res, next) => {
    const error = new Error(`Not found - ${req.originalUrl}`)
    error.statusCode = 404
    next(error)
}
