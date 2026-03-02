import mongoose from "mongoose"

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Sender ID is required"],
            index: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Receiver ID is required"],
            index: true,
        },
        text: {
            type: String,
            trim: true,
            maxlength: [1000, "Message cannot exceed 1000 characters"],
            validate: {
                validator: function (v) {
                    // Text is optional if image is present
                    return !!this.image || (v && v.length > 0)
                },
                message: "Message text is required when no image is sent",
            },
        },
        image: {
            type: String,
            validate: {
                validator: function (v) {
                    // Allow null/undefined or valid URL
                    return !v || /^https?:\/\/.+/.test(v)
                },
                message: "Image must be a valid URL",
            },
        },
        seen: {
            type: Boolean,
            default: false,
            index: true,
        },
        seenAt: {
            type: Date,
        },
        delivered: {
            type: Boolean,
            default: false,
        },
        deliveredAt: {
            type: Date,
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
        deletedFor: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        messageType: {
            type: String,
            enum: ["text", "image", "file"],
            default: "text",
        },
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
)

// Compound index for conversation queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 })
messageSchema.index({ senderId: 1, createdAt: -1 })
messageSchema.index({ receiverId: 1, createdAt: -1 })
messageSchema.index({ seen: 1, createdAt: -1 })

// Virtual for sender details
messageSchema.virtual("sender", {
    ref: "User",
    localField: "senderId",
    foreignField: "_id",
    justOne: true,
})

// Virtual for receiver details
messageSchema.virtual("receiver", {
    ref: "User",
    localField: "receiverId",
    foreignField: "_id",
    justOne: true,
})

// Pre-save middleware to set message type
messageSchema.pre("save", function (next) {
    if (this.image && !this.text) {
        this.messageType = "image"
    } else if (this.image && this.text) {
        this.messageType = "text"
    }

    // Set seenAt if seen is true
    if (this.seen && !this.seenAt) {
        this.seenAt = new Date()
    }

    // Set deliveredAt if delivered is true
    if (this.delivered && !this.deliveredAt) {
        this.deliveredAt = new Date()
    }

    next()
})

// Static method to get conversation between two users
messageSchema.statics.getConversation = function (userId1, userId2, limit = 50, before = null) {
    const query = {
        $or: [
            { senderId: userId1, receiverId: userId2 },
            { senderId: userId2, receiverId: userId1 },
        ],
        isDeleted: false,
        deletedFor: { $nin: [userId1, userId2] },
    }

    if (before) {
        query.createdAt = { $lt: before }
    }

    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("senderId", "fullName profilePic")
        .populate("receiverId", "fullName profilePic")
}

// Static method to mark messages as seen
messageSchema.statics.markAsSeen = function (senderId, receiverId) {
    return this.updateMany(
        {
            senderId,
            receiverId,
            seen: false,
        },
        {
            seen: true,
            seenAt: new Date(),
        },
    )
}

// Static method to get unread count
messageSchema.statics.getUnreadCount = function (userId) {
    return this.countDocuments({
        receiverId: userId,
        seen: false,
        isDeleted: false,
    })
}

const Message = mongoose.model("Message", messageSchema)

export default Message
