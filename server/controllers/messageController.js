// get all users except the logged in user

import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";
import { areUsersFriends } from "../lib/friendship.js";

// get all users except the logged in user
import Invitation from "../models/Invitation.js";

// get all users except the logged in user
export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Find all accepted invitations where the current user is sender OR receiver
        const invitations = await Invitation.find({
            $or: [
                { sender: userId, status: "accepted" },
                { receiver: userId, status: "accepted" }
            ]
        }).select("sender receiver");

        // Extract the *other* user's ID from each invitation
        const friendUserIds = invitations.map(inv =>
            inv.sender.toString() === userId.toString() ? inv.receiver : inv.sender
        );

        // Optimization: If no friends, return early
        if (friendUserIds.length === 0) {
            return res.json({ success: true, users: [], unseenMessages: {} });
        }

        // 2. Fetch only these friend users
        const friends = await User.find({ _id: { $in: friendUserIds } }).select("-password");

        // 3. Count unseen messages for these friends
        const unseenMessages = {};

        await Promise.all(friends.map(async (friend) => {
            const count = await Message.countDocuments({
                senderId: friend._id,
                receiverId: userId,
                seen: false
            });
            if (count > 0) {
                unseenMessages[friend._id] = count;
            }
        }));

        res.json({
            success: true,
            users: friends,
            unseenMessages: unseenMessages,
        });
    } catch (error) {
        console.error("Error in getUsersForSidebar: ", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// get all messaages for selected user
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;
        // Only allow if users are friends
        if (!(await areUsersFriends(myId, selectedUserId))) {
            return res.status(403).json({ success: false, message: "You are not allowed to view these messages." });
        }
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ],
        });
        await Message.updateMany(
            {
                senderId: selectedUserId,
                receiverId: myId,
            },
            {
                seen: true,
            }
        );
        res.json({
            success: true,
            messages: messages,
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message,
        });
    }
};

// api to mark messages as seen using message id

export const markMessagesAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const message = await Message.findById(id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found",
            });
        }

        // Only the receiver can mark a message as seen
        if (message.receiverId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not allowed",
            });
        }

        message.seen = true;
        await message.save();
        res.json({
            success: true,
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message,
        });
    }
};

// send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;
        // Only allow if users are friends
        if (!(await areUsersFriends(senderId, receiverId))) {
            return res.status(403).json({ success: false, message: "You are not allowed to send messages to this user." });
        }
        let imageUrl;
        if (image) {
            const upload = await cloudinary.uploader.upload(image);
            imageUrl = upload.secure_url;
        }
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });
        // Emit the new message to the recievers socket
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        res.json({
            success: true,
            newMessage,
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message,
        });
    }
};
