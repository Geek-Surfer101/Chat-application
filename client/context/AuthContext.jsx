import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import React, { createContext, useEffect, useState, useCallback, useRef } from "react";

export const AuthContext = createContext();

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
axios.defaults.baseURL = backendUrl;

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState(null);
    const [onlineUser, setOnlineUser] = useState([]);
    const [socket, setSocket] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Use ref to track if component is mounted
    const isMounted = useRef(true);

    // Connect socket function with proper cleanup
    const connectSocket = useCallback((userData) => {
        if (!userData?._id) return;

        // Disconnect existing socket via functional update to avoid dependency on socket
        setSocket((prevSocket) => {
            if (prevSocket) {
                prevSocket.removeAllListeners();
                prevSocket.disconnect();
            }
            return prevSocket;
        });

        // Create new socket connection
        const newSocket = io(backendUrl, {
            query: { userId: userData._id },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        newSocket.on("connect", () => {
            console.log("Socket connected");
        });

        newSocket.on("getOnlineUsers", (userIds) => {
            if (isMounted.current) {
                setOnlineUser(userIds || []);
            }
        });

        newSocket.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
            toast.error("Connection lost. Reconnecting...");
        });

        newSocket.on("disconnect", () => {
            console.log("Socket disconnected");
        });

        setSocket(newSocket);
    }, []);

    // Check auth status
    const checkAuth = useCallback(async () => {
        setIsLoading(true);
        try {
            // Use the correct endpoint - make sure this matches your backend
            const { data } = await axios.get("/api/auth/check", {
                headers: { Authorization: `Bearer ${token}` } // Use Bearer token format
            });

            if (data.success && isMounted.current) {
                setAuthUser(data.user);
                connectSocket(data.user);
            } else if (!data.success && isMounted.current) {
                localStorage.removeItem("token");
                setToken(null);
                delete axios.defaults.headers.common["Authorization"];
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            if (error.response?.status === 401) {
                // Token expired or invalid
                localStorage.removeItem("token");
                setToken(null);
                delete axios.defaults.headers.common["Authorization"];
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    }, [token, connectSocket]);

    // Login/Signup function
    const login = async (state, credentials) => {
        try {
            const endpoint = state === "signup" ? "/api/auth/signup" : "/api/auth/login";
            const { data } = await axios.post(endpoint, credentials);

            if (data.success) {
                setAuthUser(data.userData);
                connectSocket(data.userData);
                axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
                setToken(data.token);
                localStorage.setItem("token", data.token);
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            console.error("Login error:", error);
            toast.error(error.response?.data?.message || error.message || "Authentication failed");
            return false;
        }
    };

    // Logout function
    const logout = useCallback(async () => {
        try {
            localStorage.removeItem("token");
            setToken(null);
            setAuthUser(null);
            setOnlineUser([]);
            delete axios.defaults.headers.common["Authorization"];

            if (socket) {
                socket.removeAllListeners();
                socket.disconnect();
                setSocket(null);
            }

            toast.success("Logged out successfully");
        } catch (error) {
            console.error("Logout error:", error);
        }
    }, [socket]);

    // Update profile
    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put("/api/auth/update-profile", body);
            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile updated successfully");
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            console.error("Profile update error:", error);
            toast.error(error.response?.data?.message || error.message || "Failed to update profile");
            return false;
        }
    };

    // Initial auth check and cleanup
    useEffect(() => {
        isMounted.current = true;

        if (token) {
            axios.defaults.headers.common["token"] = token;
            checkAuth();
        } else {
            setIsLoading(false);
        }

        // Cleanup on unmount
        return () => {
            isMounted.current = false;
            setSocket((prevSocket) => {
                if (prevSocket) {
                    prevSocket.removeAllListeners();
                    prevSocket.disconnect();
                }
                return null;
            });
        };
    }, []); // Run only on mount

    const value = {
        axios,
        authUser,
        onlineUser,
        socket,
        login,
        logout,
        updateProfile,
        isLoading,
        isAuthenticated: !!authUser,
        token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};