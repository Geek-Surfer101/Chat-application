import Message from "../models/Message.js"
import User from "../models/User.js"
import Invitation from "../models/Invitation.js"
import cloudinary from "../lib/cloudinary.js"
import { io, getSocketId } from "../server.js"
import { areUsersFriends } from "../lib/friendship.js"

// Get all users (friends) for sidebar
export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id

        // Find all accepted invitations where current user is sender OR receiver
        const invitations = await Invitation.find({
            $or: [
                { sender: userId, status: "accepted" },
                { receiver: userId, status: "accepted" },
            ],
        }).select("sender receiver")

        // Extract the other user's ID from each invitation
        const friendUserIds = invitations.map((inv) =>
            inv.sender.toString() === userId.toString() ? inv.receiver : inv.sender,
        )

        // If no friends, return empty array
        if (friendUserIds.length === 0) {
            return res.status(200).json({
                success: true,
                users: [],
                unseenMessages: {},
            })
        }

        // Fetch only these friend users
        const friends = await User.find({
            _id: { $in: friendUserIds },
        }).select("-password")

        // Count unseen messages for each friend
        const unseenMessages = {}
        await Promise.all(
            friends.map(async (friend) => {
                const count = await Message.countDocuments({
                    senderId: friend._id,
                    receiverId: userId,
                    seen: false,
                })
                if (count > 0) {
                    unseenMessages[friend._id.toString()] = count
                }
            }),
        )

        return res.status(200).json({
            success: true,
            users: friends,
            unseenMessages,
        })
    } catch (error) {
        console.error("Error in getUsersForSidebar:", error)
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        })
    }
}

// Get all messages for selected user
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params
        const myId = req.user._id

        // Validate selected user ID
        if (!selectedUserId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            })
        }

        // Check if users are friends
        const areFriends = await areUsersFriends(myId, selectedUserId)
        if (!areFriends) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to view these messages",
            })
        }

        // Get messages between the two users
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ],
        }).sort({ createdAt: 1 }) // Sort by date ascending

        // Mark all unseen messages as seen
        await Message.updateMany(
            {
                senderId: selectedUserId,
                receiverId: myId,
                seen: false,
            },
            {
                seen: true,
            },
        )

        return res.status(200).json({
            success: true,
            messages,
        })
    } catch (error) {
        console.error("Error in getMessages:", error)
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch messages",
        })
    }
}

// Mark messages as seen using message id
export const markMessagesAsSeen = async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.user._id

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Message ID is required",
            })
        }

        const message = await Message.findById(id)

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found",
            })
        }

        // Only the receiver can mark a message as seen
        if (message.receiverId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to mark this message as seen",
            })
        }

        // Only update if not already seen
        if (!message.seen) {
            message.seen = true
            await message.save()

            // Notify sender that message was seen
            const senderSocketId = getSocketId(message.senderId)
            if (senderSocketId) {
                io.to(senderSocketId).emit("messageSeen", {
                    messageId: message._id,
                    seenBy: userId,
                })
            }
        }

        return res.status(200).json({
            success: true,
            message: "Message marked as seen",
        })
    } catch (error) {
        console.error("Error in markMessagesAsSeen:", error)
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to mark message as seen",
        })
    }
}

// Send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body
        const receiverId = req.params.id
        const senderId = req.user._id

        // Validate receiver ID
        if (!receiverId) {
            return res.status(400).json({
                success: false,
                message: "Receiver ID is required",
            })
        }

        // Validate message content
        if (!text && !image) {
            return res.status(400).json({
                success: false,
                message: "Message cannot be empty",
            })
        }

        // Check text length
        if (text && text.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Message too long (max 1000 characters)",
            })
        }

        // Check if users are friends
        const areFriends = await areUsersFriends(senderId, receiverId)
        if (!areFriends) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to send messages to this user",
            })
        }

        let imageUrl
        if (image) {
            try {
                // Upload image to cloudinary
                const upload = await cloudinary.uploader.upload(image, {
                    folder: "chat-app",
                    resource_type: "image",
                })
                imageUrl = upload.secure_url
            } catch (uploadError) {
                console.error("Cloudinary upload error:", uploadError)
                return res.status(400).json({
                    success: false,
                    message: "Failed to upload image",
                })
            }
        }

        // Create new message
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text: text || "",
            image: imageUrl,
        })

        // Populate sender info for real-time notification
        await newMessage.populate("senderId", "fullName email profilePic")

        // Emit the new message to receiver's socket
        const receiverSocketId = getSocketId(receiverId)
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }

        // Also emit to sender's other devices (if any)
        const senderSocketId = getSocketId(senderId)
        if (senderSocketId && senderSocketId !== receiverSocketId) {
            io.to(senderSocketId).emit("newMessage", newMessage)
        }

        return res.status(201).json({
            success: true,
            newMessage,
        })
    } catch (error) {
        console.error("Error in sendMessage:", error)
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to send message",
        })
    }
}
