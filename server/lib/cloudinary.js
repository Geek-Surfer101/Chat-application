import { v2 as cloudinary } from "cloudinary"
import { config } from "dotenv"

// Load environment variables
config()

// Validate required environment variables
const requiredEnvVars = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName])

if (missingEnvVars.length > 0) {
    console.error("❌ Missing Cloudinary environment variables:", missingEnvVars.join(", "))
    // Don't throw in production, just log
    if (process.env.NODE_ENV === "development") {
        throw new Error(`Missing Cloudinary configuration: ${missingEnvVars.join(", ")}`)
    }
}

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, // Force HTTPS
})

// Test the connection (optional, but helpful for debugging)
export const testCloudinaryConnection = async () => {
    try {
        const result = await cloudinary.api.ping()
        console.log("✅ Cloudinary connection successful:", result)
        return true
    } catch (error) {
        console.error("❌ Cloudinary connection failed:", error.message)
        return false
    }
}

// Utility function to upload image with error handling
export const uploadImage = async (image, folder = "chat-app") => {
    try {
        const options = {
            folder,
            resource_type: "auto",
            allowed_formats: ["jpg", "png", "gif", "webp", "jpeg"],
            transformation: [
                { width: 1000, crop: "limit" }, // Limit max width
                { quality: "auto:good" }, // Automatic quality optimization
            ],
        }

        const result = await cloudinary.uploader.upload(image, options)
        return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
        }
    } catch (error) {
        console.error("Cloudinary upload error:", error)
        return {
            success: false,
            error: error.message,
        }
    }
}

// Utility function to delete image
export const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId)
        return {
            success: result.result === "ok",
            result,
        }
    } catch (error) {
        console.error("Cloudinary delete error:", error)
        return {
            success: false,
            error: error.message,
        }
    }
}

// Utility function to get image URL with transformations
export const getOptimizedUrl = (publicId, options = {}) => {
    const { width, height, crop = "fill", quality = "auto" } = options

    return cloudinary.url(publicId, {
        secure: true,
        width,
        height,
        crop,
        quality,
        fetch_format: "auto",
    })
}

export default cloudinary
