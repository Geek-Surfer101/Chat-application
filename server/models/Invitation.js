import mongoose from "mongoose"

const invitationSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Sender is required"],
            index: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Receiver is required"],
            index: true,
        },
        status: {
            type: String,
            enum: {
                values: ["pending", "accepted", "rejected"],
                message: "{VALUE} is not a valid status",
            },
            default: "pending",
            index: true,
        },
        message: {
            type: String,
            trim: true,
            maxlength: [200, "Invitation message cannot exceed 200 characters"],
        },
        respondedAt: {
            type: Date,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
)

// Compound unique index to prevent duplicate invitations
invitationSchema.index(
    { sender: 1, receiver: 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $ne: "rejected" } },
    },
)

// Index for faster queries
invitationSchema.index({ sender: 1, status: 1 })
invitationSchema.index({ receiver: 1, status: 1 })
invitationSchema.index({ createdAt: -1 })

// Virtual for sender details
invitationSchema.virtual("senderDetails", {
    ref: "User",
    localField: "sender",
    foreignField: "_id",
    justOne: true,
})

// Virtual for receiver details
invitationSchema.virtual("receiverDetails", {
    ref: "User",
    localField: "receiver",
    foreignField: "_id",
    justOne: true,
})

// Pre-save middleware
invitationSchema.pre("save", function (next) {
    // Set respondedAt if status is changed from pending
    if (this.isModified("status") && this.status !== "pending" && !this.respondedAt) {
        this.respondedAt = new Date()
    }

    // Set readAt if isRead becomes true
    if (this.isModified("isRead") && this.isRead && !this.readAt) {
        this.readAt = new Date()
    }

    next()
})

// Static method to get pending invitations for a user
invitationSchema.statics.getPendingForUser = function (userId) {
    return this.find({
        receiver: userId,
        status: "pending",
    })
        .populate("sender", "fullName email profilePic")
        .sort({ createdAt: -1 })
}

// Static method to get sent invitations by a user
invitationSchema.statics.getSentByUser = function (userId) {
    return this.find({
        sender: userId,
        status: "pending",
    })
        .populate("receiver", "fullName email profilePic")
        .sort({ createdAt: -1 })
}

// Static method to check if users are friends
invitationSchema.statics.areFriends = function (userId1, userId2) {
    return this.exists({
        $or: [
            { sender: userId1, receiver: userId2, status: "accepted" },
            { sender: userId2, receiver: userId1, status: "accepted" },
        ],
    })
}

// Static method to get all friends of a user
invitationSchema.statics.getFriends = function (userId) {
    return this.find({
        $or: [
            { sender: userId, status: "accepted" },
            { receiver: userId, status: "accepted" },
        ],
    })
        .populate("sender", "fullName email profilePic")
        .populate("receiver", "fullName email profilePic")
}

// Static method to get friend count
invitationSchema.statics.getFriendCount = function (userId) {
    return this.countDocuments({
        $or: [
            { sender: userId, status: "accepted" },
            { receiver: userId, status: "accepted" },
        ],
    })
}

// Static method to get invitation between two users
invitationSchema.statics.getInvitation = function (userId1, userId2) {
    return this.findOne({
        $or: [
            { sender: userId1, receiver: userId2 },
            { sender: userId2, receiver: userId1 },
        ],
    })
}

// Method to accept invitation
invitationSchema.methods.accept = async function () {
    this.status = "accepted"
    this.respondedAt = new Date()
    return this.save()
}

// Method to reject invitation
invitationSchema.methods.reject = async function () {
    this.status = "rejected"
    this.respondedAt = new Date()
    return this.save()
}

// Method to mark as read
invitationSchema.methods.markAsRead = async function () {
    if (!this.isRead) {
        this.isRead = true
        this.readAt = new Date()
        return this.save()
    }
    return this
}

const Invitation = mongoose.model("Invitation", invitationSchema)

export default Invitation
