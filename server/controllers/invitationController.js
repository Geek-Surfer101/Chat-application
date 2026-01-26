import Invitation from "../models/Invitation.js";
import User from "../models/User.js";

// Send an invitation
export const sendInvitation = async (req, res) => {
  try {
    const { receiverEmail } = req.body;
    const senderId = req.user._id;
    const receiver = await User.findOne({ email: receiverEmail });
    if (!receiver) {
      return res.status(404).json({ success: false, message: "Receiver not found" });
    }
    if (receiver._id.equals(senderId)) {
      return res.status(400).json({ success: false, message: "Cannot invite yourself" });
    }
    // Prevent duplicate invitations
    const existing = await Invitation.findOne({ sender: senderId, receiver: receiver._id });
    if (existing) {
      return res.status(400).json({ success: false, message: "Invitation already sent" });
    }
    await Invitation.create({ sender: senderId, receiver: receiver._id });
    res.json({ success: true, message: "Invitation sent" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    invitation.status = "accepted";
    await invitation.save();
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
    invitation.status = "rejected";
    await invitation.save();
    res.json({ success: true, message: "Invitation rejected" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
