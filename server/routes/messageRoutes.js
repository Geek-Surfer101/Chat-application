import express from "express"
import { protectRoute } from "../middleware/auth.js"
import { getMessages, getUsersForSidebar, markMessagesAsSeen, sendMessage } from "../controllers/messageController.js"

const messageRouter = express.Router()

// Apply protection to all message routes
messageRouter.use(protectRoute)

// ===== MESSAGE ROUTES =====
/**
 * @route GET /api/messages/user
 * @desc Get all users (friends) for sidebar
 * @access Private
 */
messageRouter.get("/user", getUsersForSidebar)

/**
 * @route GET /api/messages/:id
 * @desc Get all messages for selected user
 * @access Private
 */
messageRouter.get("/:id", getMessages)

/**
 * @route PUT /api/messages/mark/:id
 * @desc Mark a message as seen
 * @access Private
 */
messageRouter.put("/mark/:id", markMessagesAsSeen)

/**
 * @route POST /api/messages/send/:id
 * @desc Send a message to selected user
 * @access Private
 */
messageRouter.post("/send/:id", sendMessage)

export default messageRouter
