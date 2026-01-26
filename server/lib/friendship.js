import Invitation from "../models/Invitation.js";

// Helper to check if two users are friends (accepted invitation)
export const areUsersFriends = async (userA, userB) => {
  const accepted = await Invitation.findOne({
    $or: [
      { sender: userA, receiver: userB, status: "accepted" },
      { sender: userB, receiver: userA, status: "accepted" }
    ]
  });
  return !!accepted;
};
