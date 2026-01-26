// get all users except the logged in user

import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";
import { areUsersFriends } from "../lib/friendship.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const allUsers = await User.find({ _id: { $ne: userId } }).select("-password");
        // Only show users who are friends (accepted invitation)
        const friends = [];
        const unseenMessages = {};
        for (const user of allUsers) {
            if (await areUsersFriends(userId, user._id)) {
                friends.push(user);
                const messages = await Message.find({
                    senderId: user._id,
                    receiverId: userId,
                    seen: false,
                });
                if (messages.length > 0) {
                    unseenMessages[user._id] = messages.length;
                }
            }
        }
        res.json({
            success: true,
            users: friends,
            unseenMessages: unseenMessages,
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message,
        });
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
        await Message.findByIdAndUpdate(id, { seen: true });
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
