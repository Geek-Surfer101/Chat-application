// API Error types for consistent handling
export const API_ERRORS = {
    NETWORK: "NETWORK_ERROR",
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    NOT_FOUND: "NOT_FOUND",
    VALIDATION: "VALIDATION_ERROR",
    SERVER: "SERVER_ERROR",
    TIMEOUT: "TIMEOUT",
    UNKNOWN: "UNKNOWN_ERROR",
}

export class APIError extends Error {
    constructor(message, type = API_ERRORS.UNKNOWN, status = 500, data = null) {
        super(message)
        this.name = "APIError"
        this.type = type
        this.status = status
        this.data = data
    }
}

export function handleAPIError(error) {
    if (error.name === "AbortError" || error.message.includes("timeout")) {
        return new APIError("Request timeout. Please try again.", API_ERRORS.TIMEOUT, 408)
    }

    if (error.message.includes("network") || error.message.includes("Failed to fetch")) {
        return new APIError("Network error. Please check your connection.", API_ERRORS.NETWORK, 0)
    }

    if (error.status === 401) {
        return new APIError("Session expired. Please login again.", API_ERRORS.UNAUTHORIZED, 401)
    }

    if (error.status === 403) {
        return new APIError("You don't have permission to perform this action.", API_ERRORS.FORBIDDEN, 403)
    }

    if (error.status === 404) {
        return new APIError("Resource not found.", API_ERRORS.NOT_FOUND, 404)
    }

    if (error.status >= 500) {
        return new APIError("Server error. Please try again later.", API_ERRORS.SERVER, error.status)
    }

    return new APIError(error.message, API_ERRORS.UNKNOWN, error.status || 500)
}
