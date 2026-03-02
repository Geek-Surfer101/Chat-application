import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext";
import { apiFetch } from "../src/lib/api";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isMessagesLoading, setIsMessagesLoading] = useState(false);

    const { socket, authUser } = useContext(AuthContext);
    const isMounted = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Fetch all users (friends) for the sidebar
    const getUsers = useCallback(async () => {
        if (!authUser) return;

        setIsLoading(true);
        try {
            const data = await apiFetch("/messages/user");

            if (data.success && isMounted.current) {
                // Ensure users is always an array
                const validUsers = Array.isArray(data.users) ? data.users : [];
                setUsers(validUsers);
                setUnseenMessages(data.unseenMessages || {});

                // If selected user is no longer in friend list, clear selected chat
                if (selectedUser && !validUsers.some((user) => user._id === selectedUser._id)) {
                    setSelectedUser(null);
                    setMessages([]);
                }
            } else if (!data.success && isMounted.current) {
                toast.error(data.message || "Failed to load users");
                setUsers([]);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            if (isMounted.current) {
                toast.error(error.message || "Failed to load users");
                setUsers([]);
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    }, [authUser, selectedUser]);

    // Fetch messages for the selected user
    const getMessages = useCallback(async (userId) => {
        if (!userId) return;

        setIsMessagesLoading(true);
        try {
            const data = await apiFetch(`/messages/${userId}`);

            if (data.success && isMounted.current) {
                setMessages(data.messages || []);

                // Mark all messages as seen when opening chat
                const unseenMessageIds = data.messages
                    .filter(msg => !msg.seen && msg.senderId === userId)
                    .map(msg => msg._id);

                // Mark messages as seen in background
                if (unseenMessageIds.length > 0) {
                    Promise.all(unseenMessageIds.map(id =>
                        apiFetch(`/messages/mark/${id}`, { method: "PUT" }).catch(() => { })
                    )).then(() => {
                        // Update unseen messages count
                        setUnseenMessages(prev => ({
                            ...prev,
                            [userId]: 0
                        }));
                    });
                }
            } else if (!data.success && isMounted.current) {
                toast.error(data.message || "Failed to load messages");
                setMessages([]);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
            if (isMounted.current) {
                toast.error(error.message || "Failed to load messages");
                setMessages([]);
            }
        } finally {
            if (isMounted.current) {
                setIsMessagesLoading(false);
            }
        }
    }, []);

    // Send a message to the selected user
    const sendMessage = async (messageData) => {
        if (!selectedUser?._id) {
            toast.error("No user selected");
            return false;
        }

        // Validate message content
        if (!messageData.text && !messageData.image) {
            toast.error("Message cannot be empty");
            return false;
        }

        if (messageData.text && messageData.text.length > 1000) {
            toast.error("Message too long (max 1000 characters)");
            return false;
        }

        try {
            const data = await apiFetch(`/messages/send/${selectedUser._id}`, {
                method: "POST",
                body: JSON.stringify(messageData),
            });

            if (data.success && isMounted.current) {
                // Add new message to state
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { ...data.newMessage, senderId: authUser._id }
                ]);

                // Update user list to show last message (optional)
                setUsers(prevUsers =>
                    prevUsers.map(user =>
                        user._id === selectedUser._id
                            ? { ...user, lastMessage: data.newMessage.text || "Image" }
                            : user
                    )
                );

                return true;
            } else {
                toast.error(data.message || "Failed to send message");
                return false;
            }
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error(error.message || "Failed to send message");
            return false;
        }
    };

    // Mark message as seen
    const markMessageAsSeen = useCallback(async (messageId) => {
        try {
            await apiFetch(`/messages/mark/${messageId}`, {
                method: "PUT",
            });
        } catch (error) {
            console.error("Error marking message as seen:", error);
        }
    }, []);

    // Subscribe to new messages via socket
    const subscribeToMessages = useCallback(() => {
        if (!socket) return;

        socket.on("newMessage", (newMessage) => {
            if (!isMounted.current) return;

            // If message is for currently selected user
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                // Mark as seen immediately
                newMessage.seen = true;
                setMessages((prevMessages) => [...prevMessages, newMessage]);
                markMessageAsSeen(newMessage._id);

                // Update unseen messages count
                setUnseenMessages((prev) => ({
                    ...prev,
                    [selectedUser._id]: 0
                }));
            }
            // If message is from someone else, increment unseen count
            else if (newMessage.senderId !== authUser?._id) {
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages,
                    [newMessage.senderId]: (prevUnseenMessages[newMessage.senderId] || 0) + 1,
                }));

                // Optional: Show toast notification for new message
                const sender = users.find(u => u._id === newMessage.senderId);
                if (sender) {
                    toast.success(`New message from ${sender.fullName}`, {
                        duration: 3000,
                        icon: '💬'
                    });
                }
            }
        });

        // Listen for message seen updates
        socket.on("messageSeen", ({ messageId, senderId }) => {
            if (!isMounted.current) return;

            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg._id === messageId ? { ...msg, seen: true } : msg
                )
            );
        });

        return () => {
            socket.off("newMessage");
            socket.off("messageSeen");
        };
    }, [socket, selectedUser, authUser, users, markMessageAsSeen]);

    // Subscribe to socket events
    useEffect(() => {
        const unsubscribe = subscribeToMessages();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [subscribeToMessages]);

    // Refresh users when authUser changes
    useEffect(() => {
        if (authUser) {
            getUsers();
        }
    }, [authUser, getUsers]);

    // Load messages when selected user changes
    useEffect(() => {
        if (selectedUser) {
            getMessages(selectedUser._id);
        } else {
            setMessages([]);
        }
    }, [selectedUser, getMessages]);

    // Reset all chat state when user logs out
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
        isLoading,
        isMessagesLoading,
        getUsers,
        getMessages,
        sendMessage,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
        markMessageAsSeen,
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};