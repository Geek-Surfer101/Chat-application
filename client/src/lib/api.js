// Simple API utility using fetch with improved error handling
const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api"

// Token refresh state
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token)
        }
    })
    failedQueue = []
}

export async function apiFetch(path, options = {}) {
    const token = localStorage.getItem("token")

    // Handle retry logic
    const executeFetch = async (retryCount = 0) => {
        const headers = {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}), // Changed from 'token' to 'Authorization' header
            ...options.headers,
        }

        // Remove Content-Type for FormData
        if (options.body instanceof FormData) {
            delete headers["Content-Type"]
        }

        // Ensure path starts with slash
        const url = `${API_BASE}${path.startsWith("/") ? path : "/" + path}`

        try {
            const res = await fetch(url, {
                ...options,
                headers,
                credentials: "include",
                // Add timeout
                signal: options.signal || AbortSignal.timeout?.(10000), // 10 second timeout
            })

            let data
            const contentType = res.headers.get("content-type")

            if (contentType && contentType.includes("application/json")) {
                data = await res.json()
            } else {
                data = { success: false, message: "Invalid response from server" }
            }

            // Handle 401 Unauthorized - token expired
            if (res.status === 401) {
                if (!isRefreshing) {
                    isRefreshing = true

                    try {
                        // Attempt to refresh token
                        const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
                            method: "POST",
                            credentials: "include",
                            headers: {
                                "Content-Type": "application/json",
                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                            },
                        })

                        if (refreshResponse.ok) {
                            const refreshData = await refreshResponse.json()
                            const newToken = refreshData.token

                            localStorage.setItem("token", newToken)
                            processQueue(null, newToken)

                            // Retry original request with new token
                            return apiFetch(path, {
                                ...options,
                                headers: {
                                    ...options.headers,
                                    Authorization: `Bearer ${newToken}`,
                                },
                            })
                        } else {
                            // Refresh failed, logout user
                            processQueue(new Error("Refresh failed"), null)
                            localStorage.removeItem("token")
                            window.location.href = "/login"
                            throw new Error("Session expired. Please login again.")
                        }
                    } catch (refreshError) {
                        processQueue(refreshError, null)
                        throw refreshError
                    } finally {
                        isRefreshing = false
                    }
                } else {
                    // Wait for token refresh
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject })
                    })
                        .then((newToken) => {
                            return apiFetch(path, {
                                ...options,
                                headers: {
                                    ...options.headers,
                                    Authorization: `Bearer ${newToken}`,
                                },
                            })
                        })
                        .catch((err) => {
                            throw err
                        })
                }
            }

            if (!res.ok) {
                throw new Error(data.message || `HTTP error! status: ${res.status}`)
            }

            return data
        } catch (error) {
            // Handle network errors with retry logic
            if (
                error.name === "AbortError" ||
                error.message.includes("network") ||
                error.message.includes("Failed to fetch")
            ) {
                if (retryCount < 3) {
                    console.log(`Retrying request... Attempt ${retryCount + 1}`)
                    // Exponential backoff
                    await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
                    return executeFetch(retryCount + 1)
                }
            }

            console.error("API Fetch Error:", error)
            throw new Error(error.message || "Network error. Please check your connection.")
        }
    }

    return executeFetch()
}

// Helper for file uploads (FormData) with progress tracking
export async function apiUpload(path, formData, options = {}, onProgress) {
    const token = localStorage.getItem("token")

    const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    }

    const url = `${API_BASE}${path.startsWith("/") ? path : "/" + path}`

    try {
        // Create XMLHttpRequest for progress tracking
        if (onProgress) {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest()

                xhr.open(options.method || "POST", url)

                // Set headers
                Object.keys(headers).forEach((key) => {
                    xhr.setRequestHeader(key, headers[key])
                })

                xhr.withCredentials = true

                // Track upload progress
                xhr.upload.addEventListener("progress", (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100
                        onProgress(percentComplete)
                    }
                })

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const data = JSON.parse(xhr.responseText)
                            resolve(data)
                        } catch (e) {
                            resolve({ success: true, message: "Upload successful" })
                        }
                    } else {
                        try {
                            const data = JSON.parse(xhr.responseText)
                            reject(new Error(data.message || `Upload failed with status ${xhr.status}`))
                        } catch (e) {
                            reject(new Error(`Upload failed with status ${xhr.status}`))
                        }
                    }
                }

                xhr.onerror = () => {
                    reject(new Error("Network error during upload"))
                }

                xhr.send(formData)
            })
        }

        // Use fetch for simpler uploads without progress
        const res = await fetch(url, {
            ...options,
            method: options.method || "POST",
            body: formData,
            headers,
            credentials: "include",
        })

        const data = await res.json()

        if (!res.ok) {
            throw new Error(data.message || `HTTP error! status: ${res.status}`)
        }

        return data
    } catch (error) {
        console.error("API Upload Error:", error)
        throw new Error(error.message || "Upload failed. Please try again.")
    }
}

// Helper for GET requests
export async function apiGet(path, options = {}) {
    return apiFetch(path, { ...options, method: "GET" })
}

// Helper for POST requests
export async function apiPost(path, body, options = {}) {
    return apiFetch(path, {
        ...options,
        method: "POST",
        body: JSON.stringify(body),
    })
}

// Helper for PUT requests
export async function apiPut(path, body, options = {}) {
    return apiFetch(path, {
        ...options,
        method: "PUT",
        body: JSON.stringify(body),
    })
}

// Helper for DELETE requests
export async function apiDelete(path, options = {}) {
    return apiFetch(path, { ...options, method: "DELETE" })
}

// Helper to check if token is expired
export function isTokenExpired(token) {
    if (!token) return true

    try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        return payload.exp * 1000 < Date.now()
    } catch (e) {
        return true
    }
}

// Helper to get token payload
export function getTokenPayload(token) {
    if (!token) return null

    try {
        return JSON.parse(atob(token.split(".")[1]))
    } catch (e) {
        return null
    }
}
