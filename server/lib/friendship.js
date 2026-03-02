import Invitation from "../models/Invitation.js"
import User from "../models/User.js"

// Helper to check if two users are friends (accepted invitation)
export const areUsersFriends = async (userA, userB) => {
    try {
        // Validate input
        if (!userA || !userB) {
            console.error("areUsersFriends: Missing user IDs")
            return false
        }

        const accepted = await Invitation.findOne({
            $or: [
                { sender: userA, receiver: userB, status: "accepted" },
                { sender: userB, receiver: userA, status: "accepted" },
            ],
        })

        return !!accepted // Convert to boolean
    } catch (error) {
        console.error("Error checking friendship:", error)
        return false
    }
}

// Get all friends of a user
export const getFriends = async (userId) => {
    try {
        if (!userId) {
            throw new Error("User ID is required")
        }

        // Find all accepted invitations
        const invitations = await Invitation.find({
            $or: [
                { sender: userId, status: "accepted" },
                { receiver: userId, status: "accepted" },
            ],
        })

        // Extract friend IDs
        const friendIds = invitations.map((inv) =>
            inv.sender.toString() === userId.toString() ? inv.receiver : inv.sender,
        )

        // Get friend details
        const friends = await User.find({
            _id: { $in: friendIds },
        }).select("-password")

        return friends
    } catch (error) {
        console.error("Error getting friends:", error)
        throw error
    }
}

// Get friend count
export const getFriendCount = async (userId) => {
    try {
        const count = await Invitation.countDocuments({
            $or: [
                { sender: userId, status: "accepted" },
                { receiver: userId, status: "accepted" },
            ],
        })

        return count
    } catch (error) {
        console.error("Error getting friend count:", error)
        return 0
    }
}

// Check if invitation exists between users
export const getInvitationStatus = async (userA, userB) => {
    try {
        const invitation = await Invitation.findOne({
            $or: [
                { sender: userA, receiver: userB },
                { sender: userB, receiver: userA },
            ],
        })

        if (!invitation) {
            return { exists: false, status: null }
        }

        return {
            exists: true,
            status: invitation.status,
            sentBy: invitation.sender.toString() === userA.toString() ? userA : userB,
            invitation,
        }
    } catch (error) {
        console.error("Error checking invitation status:", error)
        return { exists: false, status: null, error: error.message }
    }
}

// Get mutual friends count
export const getMutualFriendsCount = async (userA, userB) => {
    try {
        // Get friends of user A
        const friendsA = await getFriends(userA)
        const friendIdsA = friendsA.map((f) => f._id.toString())

        // Get friends of user B
        const friendsB = await getFriends(userB)
        const friendIdsB = friendsB.map((f) => f._id.toString())

        // Find intersection
        const mutualFriends = friendIdsA.filter((id) => friendIdsB.includes(id))

        return mutualFriends.length
    } catch (error) {
        console.error("Error getting mutual friends count:", error)
        return 0
    }
}

// Get friend suggestions (users who are not friends and no pending invitations)
export const getFriendSuggestions = async (userId, limit = 10) => {
    try {
        // Get existing friend IDs
        const friends = await getFriends(userId)
        const friendIds = friends.map((f) => f._id.toString())

        // Get pending invitation IDs
        const pendingInvitations = await Invitation.find({
            $or: [{ sender: userId }, { receiver: userId }],
            status: "pending",
        })

        const pendingUserIds = pendingInvitations.map((inv) =>
            inv.sender.toString() === userId.toString() ? inv.receiver.toString() : inv.sender.toString(),
        )

        // Exclude friends, pending users, and self
        const excludeIds = [userId.toString(), ...friendIds, ...pendingUserIds]

        // Get random users as suggestions
        const suggestions = await User.aggregate([
            { $match: { _id: { $nin: excludeIds.map((id) => mongoose.Types.ObjectId(id)) } } },
            { $sample: { size: limit } },
            { $project: { password: 0 } },
        ])

        return suggestions
    } catch (error) {
        console.error("Error getting friend suggestions:", error)
        return []
    }
}
