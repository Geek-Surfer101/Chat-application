import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import React, { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState(null);
    const [onlineUser, setOnlineUser] = useState([]);
    const [socket, setSocket] = useState(null);

    //check if the user is authenticated and if so, set the user data and connect the socket
    const checkAuth = async () => {
        try {
            const { data } = await axios.get("/api/auth/check");
            if (data.success) {
                setAuthUser(data.user);
                connectSocket(data.user);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    //login function to handle user authentication and socket connection
    const login = async (state, credentials) => {
        try {
            const { data } = await axios.post(
                `/api/auth/${state}`,
                credentials
            );
            if (data.success) {
                setAuthUser(data.userData);
                connectSocket(data.userData);
                axios.defaults.headers.common["token"] = data.token;
                setToken(data.token);
                localStorage.setItem("token", data.token);
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // logout function to handle user logout and disconnect the socket
    const logout = async () => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUser([]);
        delete axios.defaults.headers.common["token"];
        toast.success("Logged out successfully");
        if (socket) socket.disconnect();
        setSocket(null);
    };

    // update profile function to handle user profile updates
    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put("/api/auth/update-profile", body);
            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile updated successfully");
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // connect socket function to handle socket connection and online users updates
    const connectSocket = (userData) => {
        if (!userData) return;
        if (socket) {
            socket.disconnect();
        }
        const newSocket = io(backendUrl, { query: { userId: userData._id } });
        newSocket.connect();
        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUser(userIds);
        });
    };

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["token"] = token;
        }
        checkAuth();
        // Cleanup socket on unmount
        return () => {
            if (socket) socket.disconnect();
        };
        // eslint-disable-next-line
    }, [token]);

    const value = {
        axios,
        authUser,
        onlineUser,
        socket,
        login,
        logout,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
