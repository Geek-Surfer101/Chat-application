import mongoose from "mongoose"
import User from "./models/User.js"
import Invitation from "./models/Invitation.js"
import Message from "./models/Message.js"
import "dotenv/config"
import chalk from "chalk" // Optional: for colored output

// Color logging functions (if chalk is installed)
const log = {
    info: (msg) => console.log(chalk ? chalk.blue("ℹ️ " + msg) : "ℹ️ " + msg),
    success: (msg) => console.log(chalk ? chalk.green("✅ " + msg) : "✅ " + msg),
    warning: (msg) => console.log(chalk ? chalk.yellow("⚠️ " + msg) : "⚠️ " + msg),
    error: (msg) => console.log(chalk ? chalk.red("❌ " + msg) : "❌ " + msg),
    data: (msg) => console.log(chalk ? chalk.cyan("📊 " + msg) : "📊 " + msg),
    highlight: (msg) => console.log(chalk ? chalk.magenta("🔍 " + msg) : "🔍 " + msg),
}

const debug = async () => {
    try {
        log.info("Starting database debug session...")

        // Connect to MongoDB
        const dbUri = `${process.env.MONGODB_URI}/chat-app`
        log.info(`Connecting to: ${dbUri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")}`) // Hide credentials

        await mongoose.connect(dbUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        })

        log.success("Connected to MongoDB database 'chat-app'")
        console.log() // Empty line for spacing

        // ===== USER STATISTICS =====
        log.highlight("USER STATISTICS")
        console.log("─".repeat(50))

        const users = await User.find({})
        log.data(`Total Users: ${users.length}`)

        if (users.length > 0) {
            // Count active/inactive users
            const activeUsers = users.filter((u) => u.isActive !== false).length
            const usersWithBio = users.filter((u) => u.bio && u.bio.length > 0).length
            const usersWithProfilePic = users.filter((u) => u.profilePic && u.profilePic !== "").length

            log.data(`Active Users: ${activeUsers}`)
            log.data(`Users with Bio: ${usersWithBio}`)
            log.data(`Users with Profile Picture: ${usersWithProfilePic}`)

            // List all users
            console.log("\n📋 User List:")
            users.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.fullName} (${user.email})`)
                console.log(`      ID: ${user._id}`)
                console.log(`      Bio: ${user.bio?.substring(0, 50)}${user.bio?.length > 50 ? "..." : ""}`)
                console.log(`      Created: ${user.createdAt?.toLocaleString()}`)
                console.log(`      Updated: ${user.updatedAt?.toLocaleString()}`)
                console.log(`      Status: ${user.isActive !== false ? "✅ Active" : "❌ Inactive"}`)
                console.log()
            })
        }

        console.log() // Empty line

        // ===== INVITATION STATISTICS =====
        log.highlight("INVITATION STATISTICS")
        console.log("─".repeat(50))

        const invitations = await Invitation.find({})
            .populate("sender", "fullName email")
            .populate("receiver", "fullName email")

        log.data(`Total Invitations: ${invitations.length}`)

        if (invitations.length > 0) {
            // Count by status
            const pending = invitations.filter((inv) => inv.status === "pending").length
            const accepted = invitations.filter((inv) => inv.status === "accepted").length
            const rejected = invitations.filter((inv) => inv.status === "rejected").length

            log.data(`Pending: ${pending}`)
            log.data(`Accepted: ${accepted}`)
            log.data(`Rejected: ${rejected}`)

            // List all invitations
            console.log("\n📋 Invitation List:")
            invitations.forEach((inv, index) => {
                const statusColor = inv.status === "accepted" ? "✅" : inv.status === "pending" ? "⏳" : "❌"

                console.log(
                    `   ${index + 1}. ${statusColor} ${inv.sender?.fullName || "Unknown"} → ${inv.receiver?.fullName || "Unknown"}`,
                )
                console.log(`      Status: ${inv.status}`)
                console.log(`      Sent: ${inv.createdAt?.toLocaleString()}`)
                if (inv.respondedAt) {
                    console.log(`      Responded: ${inv.respondedAt?.toLocaleString()}`)
                }
                console.log()
            })

            // Friendship analysis
            console.log("\n🤝 FRIENDSHIPS (Derived from accepted invitations):")

            // Get all unique user pairs that are friends
            const friendships = new Set()
            invitations
                .filter((inv) => inv.status === "accepted")
                .forEach((inv) => {
                    const pair = [inv.sender?._id?.toString(), inv.receiver?._id?.toString()]
                        .filter(Boolean)
                        .sort()
                        .join("-")
                    friendships.add(pair)
                })

            log.data(`Total Friendships: ${friendships.size}`)

            // Show friends for each user
            console.log("\n👥 Friends per User:")
            for (const user of users) {
                const userFriends = invitations.filter(
                    (inv) =>
                        inv.status === "accepted" &&
                        (inv.sender?._id?.toString() === user._id.toString() ||
                            inv.receiver?._id?.toString() === user._id.toString()),
                )

                console.log(`   ${user.fullName}: ${userFriends.length} friend${userFriends.length !== 1 ? "s" : ""}`)
                if (userFriends.length > 0) {
                    const friendNames = userFriends
                        .map((inv) => {
                            const friendId =
                                inv.sender?._id?.toString() === user._id.toString()
                                    ? inv.receiver?.fullName
                                    : inv.sender?.fullName
                            return friendId
                        })
                        .filter(Boolean)
                    console.log(`      → ${friendNames.join(", ")}`)
                }
            }
        }

        console.log()

        // ===== MESSAGE STATISTICS =====
        log.highlight("MESSAGE STATISTICS")
        console.log("─".repeat(50))

        const messages = await Message.find({}).populate("senderId", "fullName").populate("receiverId", "fullName")

        log.data(`Total Messages: ${messages.length}`)

        if (messages.length > 0) {
            // Count by type
            const textMessages = messages.filter((m) => m.text && !m.image).length
            const imageMessages = messages.filter((m) => m.image).length
            const seenMessages = messages.filter((m) => m.seen).length
            const unseenMessages = messages.filter((m) => !m.seen && !m.isDeleted).length

            log.data(`Text Messages: ${textMessages}`)
            log.data(`Image Messages: ${imageMessages}`)
            log.data(`Seen Messages: ${seenMessages}`)
            log.data(`Unseen Messages: ${unseenMessages}`)

            // Messages per conversation
            console.log("\n💬 Messages per Conversation:")

            const conversations = new Map()
            messages.forEach((msg) => {
                if (msg.senderId && msg.receiverId) {
                    const pair = [msg.senderId._id.toString(), msg.receiverId._id.toString()].sort().join("-")
                    conversations.set(pair, (conversations.get(pair) || 0) + 1)
                }
            })

            conversations.forEach((count, pair) => {
                const [id1, id2] = pair.split("-")
                const user1 = users.find((u) => u._id.toString() === id1)?.fullName || id1
                const user2 = users.find((u) => u._id.toString() === id2)?.fullName || id2
                console.log(`   ${user1} ↔ ${user2}: ${count} messages`)
            })

            // Most recent messages
            console.log("\n🕒 Most Recent Messages (Last 5):")
            const recentMessages = [...messages]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5)

            recentMessages.forEach((msg, index) => {
                const type = msg.image ? "📷 Image" : "💬 Text"
                const sender = msg.senderId?.fullName || "Unknown"
                const receiver = msg.receiverId?.fullName || "Unknown"
                console.log(`   ${index + 1}. ${type} | ${sender} → ${receiver}`)
                if (msg.text) {
                    console.log(`      "${msg.text.substring(0, 50)}${msg.text.length > 50 ? "..." : ""}"`)
                }
                console.log(`      ${new Date(msg.createdAt).toLocaleString()}`)
                console.log(`      Seen: ${msg.seen ? "✅" : "❌"}`)
                console.log()
            })
        }

        console.log()

        // ===== DATABASE HEALTH =====
        log.highlight("DATABASE HEALTH")
        console.log("─".repeat(50))

        // Check indexes
        log.info("Checking database indexes...")

        const userIndexes = await User.collection.indexes()
        log.data(`User collection indexes: ${userIndexes.length}`)

        const messageIndexes = await Message.collection.indexes()
        log.data(`Message collection indexes: ${messageIndexes.length}`)

        const invitationIndexes = await Invitation.collection.indexes()
        log.data(`Invitation collection indexes: ${invitationIndexes.length}`)

        // Check for orphaned records
        log.info("\nChecking for orphaned records...")

        // Find messages with missing sender/receiver
        const orphanedMessages = messages.filter((m) => !m.senderId || !m.receiverId)
        if (orphanedMessages.length > 0) {
            log.warning(`Found ${orphanedMessages.length} messages with missing sender/receiver`)
        } else {
            log.success("No orphaned messages found")
        }

        // Find invitations with missing sender/receiver
        const orphanedInvitations = invitations.filter((inv) => !inv.sender || !inv.receiver)
        if (orphanedInvitations.length > 0) {
            log.warning(`Found ${orphanedInvitations.length} invitations with missing sender/receiver`)
        } else {
            log.success("No orphaned invitations found")
        }

        // ===== SUMMARY =====
        console.log("\n" + "=".repeat(60))
        log.success("DATABASE DEBUG SUMMARY")
        console.log("=".repeat(60))

        console.log(`
📊 Users:        ${users.length}
📊 Invitations:  ${invitations.length}
   ├─ Pending:   ${invitations.filter((i) => i.status === "pending").length}
   ├─ Accepted:  ${invitations.filter((i) => i.status === "accepted").length}
   └─ Rejected:  ${invitations.filter((i) => i.status === "rejected").length}
📊 Messages:     ${messages.length}
   ├─ Text:      ${messages.filter((m) => m.text && !m.image).length}
   ├─ Images:    ${messages.filter((m) => m.image).length}
   └─ Unseen:    ${messages.filter((m) => !m.seen && !m.isDeleted).length}
        `)

        // Disconnect
        await mongoose.disconnect()
        log.success("Database connection closed")
    } catch (error) {
        log.error(`Debug failed: ${error.message}`)
        console.error(error)

        // Try to disconnect even if error occurred
        try {
            await mongoose.disconnect()
            log.info("Database connection closed")
        } catch (e) {
            // Ignore disconnect errors
        }
    }
}

// Run the debug function
debug()
