import express from "express"
import { signup, login, updateProfile, checkAuth } from "../controllers/userController.js"
import { protectRoute } from "../middleware/auth.js"
import { validateSignup, validateLogin, validateProfileUpdate } from "../middleware/validation.js"

const userRouter = express.Router()

// ===== PUBLIC ROUTES =====
/**
 * @route POST /api/auth/signup
 * @desc Register a new user
 * @access Public
 */
userRouter.post("/signup", validateSignup, signup)

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
userRouter.post("/login", validateLogin, login)

// ===== PROTECTED ROUTES =====
/**
 * @route GET /api/auth/check
 * @desc Check if user is authenticated
 * @access Private
 */
userRouter.get("/check", protectRoute, checkAuth)

/**
 * @route PUT /api/auth/update-profile
 * @desc Update user profile
 * @access Private
 */
userRouter.put("/update-profile", protectRoute, validateProfileUpdate, updateProfile)

export default userRouter
