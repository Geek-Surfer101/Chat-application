import express from "express"
import userRouter from "./userRoutes.js"
import messageRouter from "./messageRoutes.js"
import invitationRouter from "./invitationRoutes.js"

const router = express.Router()

// ===== API ROUTES =====
router.use("/auth", userRouter)
router.use("/messages", messageRouter)
router.use("/invitations", invitationRouter)

// ===== HEALTH CHECK =====
/**
 * @route GET /api/status
 * @desc Check API status
 * @access Public
 */
router.get("/status", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
    })
})

// ===== API DOCUMENTATION (Optional) =====
/**
 * @route GET /api
 * @desc API documentation
 * @access Public
 */
router.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "QuickChat API",
        version: "1.0.0",
        endpoints: {
            auth: {
                signup: "POST /api/auth/signup",
                login: "POST /api/auth/login",
                check: "GET /api/auth/check",
                updateProfile: "PUT /api/auth/update-profile",
            },
            messages: {
                getUsers: "GET /api/messages/user",
                getMessages: "GET /api/messages/:id",
                sendMessage: "POST /api/messages/send/:id",
                markAsSeen: "PUT /api/messages/mark/:id",
            },
            invitations: {
                send: "POST /api/invitations/send",
                list: "GET /api/invitations/list",
                accept: "POST /api/invitations/accept",
                reject: "POST /api/invitations/reject",
            },
            health: {
                status: "GET /api/status",
            },
        },
        documentation: "For more details, contact the API administrator",
    })
})

export default router
