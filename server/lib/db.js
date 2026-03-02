import mongoose from "mongoose"
import { config } from "dotenv"

// Load environment variables
config()

// MongoDB connection options
const options = {
    autoIndex: true, // Build indexes
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4, // Use IPv4, skip trying IPv6
    retryWrites: true,
    retryReads: true,
}

// Cache the database connection
let cachedConnection = null

export const connectDB = async () => {
    // If already connected, return cached connection
    if (cachedConnection && mongoose.connection.readyState === 1) {
        console.log("📊 Using existing MongoDB connection")
        return cachedConnection
    }

    // Check for MongoDB URI
    if (!process.env.MONGODB_URI) {
        throw new Error("❌ MONGODB_URI is not defined in environment variables")
    }

    try {
        // Construct full URI with database name
        const dbUri = `${process.env.MONGODB_URI}/chat-app`

        console.log("📊 Connecting to MongoDB...")

        // Connect to MongoDB
        const connection = await mongoose.connect(dbUri, options)

        // Cache the connection
        cachedConnection = connection

        console.log("✅ MongoDB connected successfully")

        // Handle connection events
        mongoose.connection.on("error", (error) => {
            console.error("❌ MongoDB connection error:", error)
        })

        mongoose.connection.on("disconnected", () => {
            console.log("📊 MongoDB disconnected")
            cachedConnection = null
        })

        mongoose.connection.on("reconnected", () => {
            console.log("📊 MongoDB reconnected")
        })

        // Graceful shutdown
        process.on("SIGINT", async () => {
            await mongoose.connection.close()
            console.log("📊 MongoDB connection closed through app termination")
            process.exit(0)
        })

        return connection
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message)

        // Retry logic
        console.log("📊 Retrying connection in 5 seconds...")
        setTimeout(() => {
            connectDB()
        }, 5000)

        throw error
    }
}

// Utility function to check database health
export const checkDBHealth = async () => {
    try {
        const state = mongoose.connection.readyState
        const states = {
            0: "disconnected",
            1: "connected",
            2: "connecting",
            3: "disconnecting",
        }

        return {
            status: states[state] || "unknown",
            connected: state === 1,
            readyState: state,
        }
    } catch (error) {
        return {
            status: "error",
            connected: false,
            error: error.message,
        }
    }
}

// Utility function to disconnect database
export const disconnectDB = async () => {
    try {
        await mongoose.connection.close()
        cachedConnection = null
        console.log("📊 MongoDB disconnected")
        return true
    } catch (error) {
        console.error("❌ Error disconnecting MongoDB:", error)
        return false
    }
}

export default connectDB
