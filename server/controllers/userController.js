import { generateToken } from "../lib/utils.js"
import User from "../models/User.js"
import bcrypt from "bcryptjs"
import cloudinary from "../lib/cloudinary.js"

// Signup a new user
export const signup = async (req, res) => {
    const { fullName, email, password, bio } = req.body

    try {
        // Validate required fields
        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Full name, email and password are required",
            })
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address",
            })
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            })
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Account already exists with this email",
            })
        }

        // Hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Create new user
        const newUser = await User.create({
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            bio: bio || "Hey there! I'm using QuickChat",
        })

        // Generate token
        const token = generateToken(newUser._id)

        // Get user without password
        const safeUser = await User.findById(newUser._id).select("-password")

        return res.status(201).json({
            success: true,
            userData: safeUser,
            token,
            message: "Account created successfully",
        })
    } catch (error) {
        console.error("Error in signup:", error)
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create account. Please try again.",
        })
    }
}

// Login a user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            })
        }

        // Find user by email
        const userData = await User.findOne({ email: email.toLowerCase().trim() })
        if (!userData) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            })
        }

        // Verify password
        const isPasswordCorrect = await bcrypt.compare(password, userData.password)
        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            })
        }

        // Generate token
        const token = generateToken(userData._id)

        // Get user without password
        const safeUser = await User.findById(userData._id).select("-password")

        return res.status(200).json({
            success: true,
            userData: safeUser,
            token,
            message: "Login successful",
        })
    } catch (error) {
        console.error("Error in login:", error)
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to login. Please try again.",
        })
    }
}

// Check if user is authenticated
export const checkAuth = async (req, res) => {
    try {
        // User is already attached to req by protectRoute middleware
        return res.status(200).json({
            success: true,
            user: req.user,
        })
    } catch (error) {
        console.error("Error in checkAuth:", error)
        return res.status(500).json({
            success: false,
            message: error.message || "Authentication check failed",
        })
    }
}

// Update user profile details
export const updateProfile = async (req, res) => {
    try {
        const { profilePic, fullName, bio } = req.body
        const userId = req.user._id

        // Validate input
        if (!fullName && !bio && !profilePic) {
            return res.status(400).json({
                success: false,
                message: "At least one field is required to update",
            })
        }

        // Validate full name if provided
        if (fullName && fullName.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "Name must be at least 2 characters long",
            })
        }

        // Validate bio if provided
        if (bio && bio.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: "Bio must be at least 10 characters long",
            })
        }

        let updatedUser

        if (profilePic) {
            try {
                // Upload new profile picture to cloudinary
                const upload = await cloudinary.uploader.upload(profilePic, {
                    folder: "chat-app/profiles",
                    resource_type: "image",
                })

                updatedUser = await User.findByIdAndUpdate(
                    userId,
                    {
                        profilePic: upload.secure_url,
                        bio: bio?.trim(),
                        fullName: fullName?.trim(),
                    },
                    { new: true },
                ).select("-password")
            } catch (uploadError) {
                console.error("Cloudinary upload error:", uploadError)
                return res.status(400).json({
                    success: false,
                    message: "Failed to upload profile picture",
                })
            }
        } else {
            // Update without profile picture
            updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    bio: bio?.trim(),
                    fullName: fullName?.trim(),
                },
                { new: true },
            ).select("-password")
        }

        return res.status(200).json({
            success: true,
            user: updatedUser,
            message: "Profile updated successfully",
        })
    } catch (error) {
        console.error("Error in updateProfile:", error)
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update profile",
        })
    }
}
