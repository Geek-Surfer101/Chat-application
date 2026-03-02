// Environment configuration utility
const env = {
    // API Configuration
    backendUrl: import.meta.env.VITE_BACKEND_URL || "http://localhost:5000",
    apiUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    socketUrl: import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",

    // Development Settings
    enableLogging: import.meta.env.VITE_ENABLE_LOGGING === "true",

    // Feature Flags
    features: {
        imageUpload: import.meta.env.VITE_ENABLE_IMAGE_UPLOAD !== "false",
        typingIndicator: import.meta.env.VITE_ENABLE_TYPING_INDICATOR !== "false",
        readReceipts: import.meta.env.VITE_ENABLE_READ_RECEIPTS !== "false",
        friendRequests: import.meta.env.VITE_ENABLE_FRIEND_REQUESTS !== "false",
    },

    // App Configuration
    appName: import.meta.env.VITE_APP_NAME || "QuickChat",
    defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE || "en",

    // Performance Settings
    limits: {
        maxImageSize: parseInt(import.meta.env.VITE_MAX_IMAGE_SIZE || "5") * 1024 * 1024, // Convert to bytes
        maxMessageLength: parseInt(import.meta.env.VITE_MAX_MESSAGE_LENGTH || "1000"),
    },

    // Timeout Settings
    timeouts: {
        api: parseInt(import.meta.env.VITE_API_TIMEOUT || "10000"),
        socketReconnectionAttempts: parseInt(import.meta.env.VITE_SOCKET_RECONNECTION_ATTEMPTS || "5"),
        socketReconnectionDelay: parseInt(import.meta.env.VITE_SOCKET_RECONNECTION_DELAY || "1000"),
    },

    // Environment
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    mode: import.meta.env.MODE,
}

// Logger utility that respects environment
export const logger = {
    log: (...args) => {
        if (env.enableLogging && env.isDevelopment) {
            console.log(...args)
        }
    },
    error: (...args) => {
        if (env.enableLogging && env.isDevelopment) {
            console.error(...args)
        }
    },
    warn: (...args) => {
        if (env.enableLogging && env.isDevelopment) {
            console.warn(...args)
        }
    },
    info: (...args) => {
        if (env.enableLogging && env.isDevelopment) {
            console.info(...args)
        }
    },
}

export default env
