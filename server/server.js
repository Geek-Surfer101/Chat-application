import express from "express"
import "dotenv/config"
import cors from "cors"
import http from "http"
import { connectDB } from "./lib/db.js"
import apiRoutes from "./routes/index.js"
import { Server } from "socket.io"
import { errorHandler, notFound } from "./middleware/errorHandler.js"

// Create Express app and HTTP server
const app = express()
const server = http.createServer(app)

// ===== SOCKET.IO SETUP =====
export const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL
            ? process.env.CLIENT_URL.split(",")
            : ["http://localhost:5173", "http://localhost:3000"],
        credentials: true,
        methods: ["GET", "POST"],
    },
    // Connection settings
    pingTimeout: 60000,
    pingInterval: 25000,
})

// Store online users
export const userSocketMap = new Map() // {userId: socketId}

// Helper function to get socket ID by user ID
export function getSocketId(userId) {
    return userSocketMap.get(userId?.toString())
}

// Socket.io connection handler
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId

    if (userId) {
        userSocketMap.set(userId, socket.id)
        console.log(`✅ User ${userId} connected. Socket ID: ${socket.id}`)
    }

    // Emit online users to all connected clients
    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()))

    // Handle user disconnection
    socket.on("disconnect", () => {
        if (userId) {
            userSocketMap.delete(userId)
            console.log(`❌ User ${userId} disconnected`)
        }
        io.emit("getOnlineUsers", Array.from(userSocketMap.keys()))
    })

    // Handle typing events
    socket.on("typing", ({ receiverId, isTyping }) => {
        const receiverSocketId = getSocketId(receiverId)
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("userTyping", {
                userId,
                isTyping,
            })
        }
    })

    // Handle message seen acknowledgment
    socket.on("messageSeen", ({ messageId, senderId }) => {
        const senderSocketId = getSocketId(senderId)
        if (senderSocketId) {
            io.to(senderSocketId).emit("messageSeenAck", {
                messageId,
                seenBy: userId,
            })
        }
    })

    // Handle errors
    socket.on("error", (error) => {
        console.error("Socket error:", error)
    })
})

// ===== MIDDLEWARE =====
// Body parser with increased limit for images
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// CORS configuration
app.use(
    cors({
        origin: process.env.CLIENT_URL
            ? process.env.CLIENT_URL.split(",")
            : ["http://localhost:5173", "http://localhost:3000"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "token"],
    }),
)

// Request logging middleware (development only)
if (process.env.NODE_ENV === "development") {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.url}`)
        next()
    })
}

// ===== ROUTES =====
// Health check
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "QuickChat API Server",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        socketConnections: userSocketMap.size,
    })
})

// API Routes
app.use("/api", apiRoutes)

// ===== ERROR HANDLING =====
// 404 handler for undefined routes
app.use(notFound)

// Global error handler
app.use(errorHandler)

// ===== DATABASE CONNECTION =====
try {
    await connectDB()
    console.log("✅ Database connected successfully")
} catch (error) {
    console.error("❌ Database connection failed:", error.message)
    process.exit(1)
}

// ===== SERVER START =====
const PORT = process.env.PORT || 5000

// Only start server if not in serverless environment (Vercel)
if (process.env.NODE_ENV !== "production") {
    server.listen(PORT, () => {
        console.log("\n🚀 ===== SERVER STARTED ===== ")
        console.log(`📡 Port: ${PORT}`)
        console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`)
        console.log(`🔌 WebSocket: Active`)
        console.log(`📁 Upload limit: 10mb`)
        console.log(`🔄 CORS enabled for: ${process.env.CLIENT_URL || "http://localhost:5173"}`)
        console.log("============================\n")
    })
}

// ===== GRACEFUL SHUTDOWN =====
process.on("SIGINT", async () => {
    console.log("\n⚠️ Received SIGINT. Shutting down gracefully...")

    // Close socket connections
    io.close(() => {
        console.log("🔌 Socket connections closed")
    })

    // Close server
    server.close(() => {
        console.log("📡 Server closed")
        process.exit(0)
    })
})

process.on("SIGTERM", async () => {
    console.log("\n⚠️ Received SIGTERM. Shutting down gracefully...")

    io.close(() => {
        console.log("🔌 Socket connections closed")
    })

    server.close(() => {
        console.log("📡 Server closed")
        process.exit(0)
    })
})

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error)
    // Gracefully shutdown
    server.close(() => {
        process.exit(1)
    })
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason)
})

// Export for Vercel serverless
export default server
