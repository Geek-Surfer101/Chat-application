import Invitation from "../models/Invitation.js"
import User from "../models/User.js"
import { getSocketId, io } from "../server.js"

// Send an invitation
export const sendInvitation = async (req, res) => {
    try {
        const { receiverEmail } = req.body
        const senderId = req.user._id

        // Validate input
        if (!receiverEmail) {
            return res.status(400).json({
                success: false,
                message: "Receiver email is required",
            })
        }

        // Find receiver by email
        const receiver = await User.findOne({ email: receiverEmail })
        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: "User not found with this email",
            })
        }

        // Check if trying to send to self
        if (receiver._id.equals(senderId)) {
            return res.status(400).json({
                success: false,
                message: "You cannot send invitation to yourself",
            })
        }

        // Check for existing invitation
        const existing = await Invitation.findOne({
            $or: [
                { sender: senderId, receiver: receiver._id },
                { sender: receiver._id, receiver: senderId },
            ],
        })

        if (existing) {
            switch (existing.status) {
                case "accepted":
                    return res.status(400).json({
                        success: false,
                        message: "You are already friends!",
                    })
                case "pending":
                    return res.status(400).json({
                        success: false,
                        message: "An invitation already exists between you",
                    })
                case "rejected":
                    // Update rejected invitation to pending
                    existing.sender = senderId
                    existing.receiver = receiver._id
                    existing.status = "pending"
                    existing.updatedAt = new Date()
                    await existing.save()

                    // Send real-time notification
                    const receiverSocketId = getSocketId(receiver._id)
                    if (receiverSocketId) {
                        const enrichedInvitation = await Invitation.findById(existing._id).populate(
                            "sender",
                            "fullName email profilePic",
                        )
                        io.to(receiverSocketId).emit("newInvitation", enrichedInvitation)
                    }

                    return res.status(200).json({
                        success: true,
                        message: "Invitation sent successfully",
                    })
                default:
                    return res.status(400).json({
                        success: false,
                        message: "Unable to process invitation",
                    })
            }
        }

        // Create new invitation
        const newInvitation = await Invitation.create({
            sender: senderId,
            receiver: receiver._id,
        })

        // Send real-time notification
        const receiverSocketId = getSocketId(receiver._id)
        if (receiverSocketId) {
            const enrichedInvitation = await Invitation.findById(newInvitation._id).populate(
                "sender",
                "fullName email profilePic",
            )
            io.to(receiverSocketId).emit("newInvitation", enrichedInvitation)
        }

        return res.status(201).json({
            success: true,
            message: "Invitation sent successfully",
        })
    } catch (error) {
        console.error("Error in sendInvitation:", error)
        return res.status(500).json({
            success: false,
            message: "Internal server error. Please try again later.",
        })
    }
}

// List invitations for the logged-in user
export const listInvitations = async (req, res) => {
    try {
        const userId = req.user._id

        // Get received pending invitations
        const received = await Invitation.find({
            receiver: userId,
            status: "pending",
        }).populate("sender", "fullName email profilePic")

        // Get sent pending invitations
        const sent = await Invitation.find({
            sender: userId,
            status: "pending",
        }).populate("receiver", "fullName email profilePic")

        return res.status(200).json({
            success: true,
            received,
            sent,
        })
    } catch (error) {
        console.error("Error in listInvitations:", error)
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch invitations",
        })
    }
}

// Accept an invitation
export const acceptInvitation = async (req, res) => {
    try {
        const { invitationId } = req.body
        const userId = req.user._id

        // Validate input
        if (!invitationId) {
            return res.status(400).json({
                success: false,
                message: "Invitation ID is required",
            })
        }

        // Find invitation
        const invitation = await Invitation.findOne({
            _id: invitationId,
            receiver: userId,
        }).populate("sender", "fullName email profilePic")

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found",
            })
        }

        if (invitation.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `This invitation is already ${invitation.status}`,
            })
        }

        // Update invitation status
        invitation.status = "accepted"
        invitation.updatedAt = new Date()
        await invitation.save()

        // Send real-time notification to the sender
        const senderSocketId = getSocketId(invitation.sender._id)
        if (senderSocketId) {
            io.to(senderSocketId).emit("invitationAccepted", {
                invitationId,
                accepterId: userId,
                accepterName: req.user.fullName,
                accepterEmail: req.user.email,
            })
        }

        return res.status(200).json({
            success: true,
            message: "Friend request accepted successfully",
            invitation,
        })
    } catch (error) {
        console.error("Error in acceptInvitation:", error)
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to accept invitation",
        })
    }
}

// Reject an invitation
export const rejectInvitation = async (req, res) => {
    try {
        const { invitationId } = req.body
        const userId = req.user._id

        // Validate input
        if (!invitationId) {
            return res.status(400).json({
                success: false,
                message: "Invitation ID is required",
            })
        }

        // Find invitation
        const invitation = await Invitation.findOne({
            _id: invitationId,
            receiver: userId,
        })

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found",
            })
        }

        if (invitation.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `This invitation is already ${invitation.status}`,
            })
        }

        // Update invitation status
        invitation.status = "rejected"
        invitation.updatedAt = new Date()
        await invitation.save()

        return res.status(200).json({
            success: true,
            message: "Friend request rejected successfully",
        })
    } catch (error) {
        console.error("Error in rejectInvitation:", error)
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to reject invitation",
        })
    }
}
