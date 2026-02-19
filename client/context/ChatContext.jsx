import React, { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext";
import { apiFetch } from "../src/lib/api";

// Create and export the ChatContext
export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const { socket, authUser } = useContext(AuthContext);

    // Fetch all users (friends) for the sidebar
    const getUsers = async () => {
        try {
            const data = await apiFetch("/messages/user");

            if (data.success) {
                // Ensure users is always an array
                const validUsers = Array.isArray(data.users) ? data.users : [];
                setUsers(validUsers);
                setUnseenMessages(data.unseenMessages || {});

                // If selected user is no longer in friend list, clear selected chat.
                if (
                    selectedUser &&
                    !validUsers.some((user) => user._id === selectedUser._id)
                ) {
                    setSelectedUser(null);
                    setMessages([]);
                }
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Fetch messages for the selected user
    const getMessages = async (userId) => {
        try {
            const data = await apiFetch(`/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Send a message to the selected user
    const sendMessage = async (messageData) => {
        try {
            const data = await apiFetch(`/messages/send/${selectedUser._id}`, {
                method: "POST",
                body: JSON.stringify(messageData),
            });
            if (data.success) {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    data.newMessage,
                ]);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Subscribe to new messages via socket
    const subscribeToMessages = () => {
        if (!socket) return;
        socket.on("newMessage", (newMessage) => {
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                newMessage.seen = true;
                setMessages((prevMessages) => [...prevMessages, newMessage]);
                apiFetch(`/messages/mark/${newMessage._id}`, {
                    method: "PUT",
                }).catch(() => {});
            } else {
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages,
                    [newMessage.senderId]: prevUnseenMessages[
                        newMessage.senderId
                    ]
                        ? prevUnseenMessages[newMessage.senderId] + 1
                        : 1,
                }));
            }
        });
    };

    // Unsubscribe from socket events
    const unsubscribeFromMessages = () => {
        if (socket) socket.off("newMessage");
    };

    useEffect(() => {
        subscribeToMessages();
        return () => {
            unsubscribeFromMessages();
        };
        // eslint-disable-next-line
    }, [socket, selectedUser]);

    // Reset all chat state when user logs out or switches accounts.
    useEffect(() => {
        if (!authUser) {
            setMessages([]);
            setUsers([]);
            setSelectedUser(null);
            setUnseenMessages({});
        }
    }, [authUser]);

    const value = {
        messages,
        users,
        selectedUser,
        getUsers,
        getMessages,
        sendMessage,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
    };

    return (
        <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
    );
}; 
