import { validateEmail, validatePassword } from "../lib/utils.js"

// Validate signup input
export const validateSignup = (req, res, next) => {
    const { fullName, email, password, bio } = req.body
    const errors = []

    // Check required fields
    if (!fullName || fullName.trim().length < 2) {
        errors.push("Full name must be at least 2 characters long")
    }

    if (!email || !validateEmail(email)) {
        errors.push("Please provide a valid email address")
    }

    if (!password) {
        errors.push("Password is required")
    } else {
        const passwordValidation = validatePassword(password)
        if (!passwordValidation.isValid) {
            errors.push(passwordValidation.message)
        }
    }

    if (bio && bio.length > 500) {
        errors.push("Bio must not exceed 500 characters")
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors,
        })
    }

    // Sanitize inputs
    req.body.fullName = fullName.trim()
    req.body.email = email.toLowerCase().trim()
    if (bio) req.body.bio = bio.trim()

    next()
}

// Validate login input
export const validateLogin = (req, res, next) => {
    const { email, password } = req.body
    const errors = []

    if (!email || !validateEmail(email)) {
        errors.push("Please provide a valid email address")
    }

    if (!password) {
        errors.push("Password is required")
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors,
        })
    }

    req.body.email = email.toLowerCase().trim()
    next()
}

// Validate profile update
export const validateProfileUpdate = (req, res, next) => {
    const { fullName, bio } = req.body
    const errors = []

    if (fullName && fullName.trim().length < 2) {
        errors.push("Full name must be at least 2 characters long")
    }

    if (bio && bio.length > 500) {
        errors.push("Bio must not exceed 500 characters")
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors,
        })
    }

    // Sanitize inputs
    if (fullName) req.body.fullName = fullName.trim()
    if (bio) req.body.bio = bio.trim()

    next()
}
