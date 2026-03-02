import express from "express"
import { protectRoute } from "../middleware/auth.js"
import {
    sendInvitation,
    listInvitations,
    acceptInvitation,
    rejectInvitation,
} from "../controllers/invitationController.js"

const invitationRouter = express.Router()

// Apply protection to all invitation routes
invitationRouter.use(protectRoute)

// ===== INVITATION ROUTES =====
/**
 * @route POST /api/invitations/send
 * @desc Send a friend invitation
 * @access Private
 */
invitationRouter.post("/send", sendInvitation)

/**
 * @route GET /api/invitations/list
 * @desc List all invitations for logged-in user
 * @access Private
 */
invitationRouter.get("/list", listInvitations)

/**
 * @route POST /api/invitations/accept
 * @desc Accept a friend invitation
 * @access Private
 */
invitationRouter.post("/accept", acceptInvitation)

/**
 * @route POST /api/invitations/reject
 * @desc Reject a friend invitation
 * @access Private
 */
invitationRouter.post("/reject", rejectInvitation)

export default invitationRouter
