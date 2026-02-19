import Invitation from "../models/Invitation.js";
import User from "../models/User.js";
import { getSocketId, io } from "../server.js";

// Send an invitation
export const sendInvitation = async (req, res) => {
  try {
    const { receiverEmail } = req.body;
    const senderId = req.user._id;
    const receiver = await User.findOne({ email: receiverEmail });

    if (!receiver) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (receiver._id.equals(senderId)) {
      return res.status(400).json({ success: false, message: "Cannot invite yourself" });
    }

    // Check for ANY existing invitation between these two users (sent or received)
    const existing = await Invitation.findOne({
      $or: [
        { sender: senderId, receiver: receiver._id },
        { sender: receiver._id, receiver: senderId }
      ]
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ success: false, message: "You are already friends!" });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({ success: false, message: "Invitation received or already sent." });
      }

      // If previously rejected, re-use the same document as a fresh pending request.
      existing.sender = senderId;
      existing.receiver = receiver._id;
      existing.status = "pending";
      existing.updatedAt = new Date();
      await existing.save();

      const receiverSocketId = getSocketId(receiver._id);
      if (receiverSocketId) {
        const enrichedInvitation = await Invitation.findById(existing._id).populate("sender", "fullName email");
        io.to(receiverSocketId).emit("newInvitation", enrichedInvitation);
      }

      return res.json({ success: true, message: "Invitation sent" });
    }

    const newInvitation = await Invitation.create({ sender: senderId, receiver: receiver._id });

    // Real-time notification
    const receiverSocketId = getSocketId(receiver._id);
    if (receiverSocketId) {
      const enrichedInvitation = await Invitation.findById(newInvitation._id).populate("sender", "fullName email");
      io.to(receiverSocketId).emit("newInvitation", enrichedInvitation);
    }

    res.json({ success: true, message: "Invitation sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Error" });
  }
};

// List invitations for the logged-in user
export const listInvitations = async (req, res) => {
  try {
    const userId = req.user._id;
    const received = await Invitation.find({ receiver: userId, status: "pending" }).populate("sender", "fullName email");
    const sent = await Invitation.find({ sender: userId, status: "pending" }).populate("receiver", "fullName email");
    res.json({ success: true, received, sent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Accept an invitation
export const acceptInvitation = async (req, res) => {
  try {
    const { invitationId } = req.body;
    const userId = req.user._id;
    const invitation = await Invitation.findOne({ _id: invitationId, receiver: userId });

    if (!invitation) {
      return res.status(404).json({ success: false, message: "Invitation not found" });
    }
    if (invitation.status !== "pending") {
      return res.status(400).json({ success: false, message: "Invitation is no longer pending" });
    }

    invitation.status = "accepted";
    invitation.updatedAt = new Date();
    await invitation.save();

    // Real-time notification to the SENDER that their invite was accepted
    const senderSocketId = getSocketId(invitation.sender);
    if (senderSocketId) {
      io.to(senderSocketId).emit("invitationAccepted", {
        invitationId,
        accepterId: userId
      });
    }

    res.json({ success: true, message: "Invitation accepted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reject an invitation
export const rejectInvitation = async (req, res) => {
  try {
    const { invitationId } = req.body;
    const userId = req.user._id;
    const invitation = await Invitation.findOne({ _id: invitationId, receiver: userId });

    if (!invitation) {
      return res.status(404).json({ success: false, message: "Invitation not found" });
    }
    if (invitation.status !== "pending") {
      return res.status(400).json({ success: false, message: "Invitation is no longer pending" });
    }

    invitation.status = "rejected";
    invitation.updatedAt = new Date();
    await invitation.save();

    res.json({ success: true, message: "Invitation rejected" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
