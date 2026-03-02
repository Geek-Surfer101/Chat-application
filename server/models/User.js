import mongoose from "mongoose"

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email address"],
        },
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
            minlength: [2, "Full name must be at least 2 characters long"],
            maxlength: [50, "Full name cannot exceed 50 characters"],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters long"],
            select: false, // Don't return password by default in queries
        },
        profilePic: {
            type: String,
            default: "",
            validate: {
                validator: function (v) {
                    // Allow empty string or valid URL
                    return v === "" || /^https?:\/\/.+/.test(v)
                },
                message: "Profile picture must be a valid URL",
            },
        },
        bio: {
            type: String,
            default: "Hey there! I'm using QuickChat",
            maxlength: [500, "Bio cannot exceed 500 characters"],
            trim: true,
        },
        isOnline: {
            type: Boolean,
            default: false,
        },
        lastSeen: {
            type: Date,
            default: Date.now,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
)

// Virtual for friend count (populated dynamically)
userSchema.virtual("friendCount", {
    ref: "Invitation",
    localField: "_id",
    foreignField: "sender",
    count: true,
    match: { status: "accepted" },
})

// Virtual for received invitations count
userSchema.virtual("pendingInvitationsCount", {
    ref: "Invitation",
    localField: "_id",
    foreignField: "receiver",
    count: true,
    match: { status: "pending" },
})

// Index for faster queries
userSchema.index({ email: 1 })
userSchema.index({ fullName: "text" }) // For search functionality

// Pre-save middleware to ensure email is lowercase
userSchema.pre("save", function (next) {
    if (this.email) {
        this.email = this.email.toLowerCase()
    }
    next()
})

// Method to return user without sensitive data
userSchema.methods.toSafeObject = function () {
    const userObject = this.toObject()
    delete userObject.password
    delete userObject.__v
    return userObject
}

// Static method to find by email (case insensitive)
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() })
}

const User = mongoose.model("User", userSchema)

export default User
