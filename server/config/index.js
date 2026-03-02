import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") })

// Configuration object with validation
const config = {
    server: {
        port: parseInt(process.env.PORT || "5000", 10),
        env: process.env.NODE_ENV || "development",
        isDevelopment: process.env.NODE_ENV === "development",
        isProduction: process.env.NODE_ENV === "production",
    },

    database: {
        uri: process.env.MONGODB_URI,
        options: {
            dbName: "chat-app",
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        },
    },

    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },

    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    },

    cors: {
        allowedOrigins: process.env.CLIENT_URL
            ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
            : ["http://localhost:5173", "http://localhost:3000"],
    },

    logging: {
        level: process.env.LOG_LEVEL || "info",
    },
}

// Validate required configuration
const validateConfig = () => {
    const required = ["database.uri", "jwt.secret", "cloudinary.cloudName", "cloudinary.apiKey", "cloudinary.apiSecret"]

    const missing = []

    required.forEach((path) => {
        const keys = path.split(".")
        let value = config
        for (const key of keys) {
            value = value?.[key]
        }
        if (!value) {
            missing.push(path)
        }
    })

    if (missing.length > 0) {
        console.warn("⚠️ Missing configuration:", missing.join(", "))
        console.warn("Some features may not work correctly.")
    }
}

validateConfig()

export default config
