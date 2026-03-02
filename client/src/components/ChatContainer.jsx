import React, { useContext, useEffect, useState, useRef, useCallback } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext.jsx";
import toast from "react-hot-toast";

const ChatContainer = () => {
    const {
        messages,
        selectedUser,
        setSelectedUser,
        sendMessage,
        getMessages,
        isMessagesLoading,
    } = useContext(ChatContext);
    const { authUser, onlineUser } = useContext(AuthContext);

    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const scrollEnd = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Handle sending a message
    const handleSendMessage = async (e) => {
        e?.preventDefault();

        if (input.trim() === "" && !isSending) return null;

        setIsSending(true);
        const messageText = input.trim();
        setInput(""); // Clear input immediately for better UX

        const success = await sendMessage({ text: messageText });

        if (!success) {
            setInput(messageText); // Restore if failed
        }

        setIsSending(false);
    };

    // Handle sending an image
    const handleSendImage = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file (JPEG, PNG, GIF)");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            toast.error("Image too large. Maximum size is 5MB");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setIsSending(true);
        toast.loading("Uploading image...", { id: "imageUpload" });

        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const success = await sendMessage({ image: reader.result });
                if (success) {
                    toast.success("Image sent!", { id: "imageUpload" });
                } else {
                    toast.error("Failed to send image", { id: "imageUpload" });
                }
                setIsSending(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("Error sending image:", error);
            toast.error("Failed to send image", { id: "imageUpload" });
            setIsSending(false);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // Handle typing indicator
    const handleTyping = () => {
        if (!isTyping) {
            setIsTyping(true);
            // Emit typing event via socket if needed
        }

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
        }, 1000);
    };

    // Handle key press (Enter to send)
    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Format message time
    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } else {
            return date.toLocaleDateString([], { month: "short", day: "numeric" }) +
                " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
    };

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollEnd.current && messages.length > 0) {
            scrollEnd.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    }, [messages]);

    // Load messages when selected user changes
    useEffect(() => {
        if (selectedUser) {
            getMessages(selectedUser._id);
        }

        // Cleanup typing timeout on unmount or user change
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [selectedUser, getMessages]);

    // If no user selected, show welcome screen
    if (!selectedUser) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-500 bg-white/5 max-md:hidden">
                <img
                    src={assets.logo_icon}
                    alt="QuickChat Logo"
                    className="max-w-20 opacity-50"
                />
                <p className="text-lg font-medium text-white/70">
                    Select a friend to start chatting
                </p>
                <p className="text-sm text-white/50">
                    Chat anytime, anywhere.
                </p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col relative backdrop-blur-lg bg-[#1a1a1e]/30">
            {/* Header */}
            <div className="flex items-center gap-3 py-3 px-4 border-b border-stone-500/30 bg-[#1e1e24]/50">
                <img
                    src={selectedUser.profilePic || assets.avatar_icon}
                    alt={selectedUser.fullName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-violet-500/30"
                />
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <p className="text-lg text-white font-medium">
                            {selectedUser.fullName}
                        </p>
                        {onlineUser.includes(selectedUser._id) ? (
                            <span className="flex items-center gap-1 text-xs text-green-400">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Online
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                                Offline
                            </span>
                        )}
                    </div>
                    {isTyping && (
                        <p className="text-xs text-violet-400 animate-pulse">
                            typing...
                        </p>
                    )}
                </div>
                <button
                    onClick={() => setSelectedUser(null)}
                    className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors"
                    aria-label="Close chat"
                >
                    <img src={assets.arrow_icon} className="w-5 h-5" alt="Back" />
                </button>
                <img
                    src={assets.help_icon}
                    alt="Help"
                    className="max-md:hidden w-5 h-5 opacity-50 hover:opacity-100 cursor-help transition-opacity"
                    title="QuickChat - Real-time messaging"
                />
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                {isMessagesLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <p className="text-center text-white/50">
                            No messages yet. Start a conversation!
                        </p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isSender = msg.senderId?.toString() === authUser._id?.toString();
                        const showAvatar = index === 0 ||
                            messages[index - 1]?.senderId?.toString() !== msg.senderId?.toString();

                        return (
                            <div
                                key={msg._id || index}
                                className={`flex items-end gap-2 ${isSender ? "justify-end" : "justify-start"
                                    }`}
                            >
                                {/* Avatar for receiver */}
                                {!isSender && showAvatar && (
                                    <div className="flex-shrink-0">
                                        <img
                                            src={selectedUser?.profilePic || assets.avatar_icon}
                                            alt={selectedUser?.fullName}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    </div>
                                )}

                                {/* Spacer for alignment when no avatar */}
                                {!isSender && !showAvatar && <div className="w-8"></div>}

                                {/* Message bubble */}
                                <div className={`flex flex-col max-w-[70%] ${isSender ? 'items-end' : 'items-start'}`}>
                                    {msg.image ? (
                                        <div className="relative group">
                                            <img
                                                src={msg.image}
                                                alt="Shared image"
                                                className="max-w-[250px] max-h-[300px] rounded-lg border border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => window.open(msg.image, '_blank')}
                                            />
                                            <span className="text-[10px] text-gray-400 mt-1 block">
                                                {formatMessageTime(msg.createdAt)}
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            <div
                                                className={`px-4 py-2 rounded-2xl break-words ${isSender
                                                        ? "bg-violet-600 text-white rounded-br-none"
                                                        : "bg-[#2b2b36] text-white rounded-bl-none"
                                                    }`}
                                            >
                                                <p className="text-sm">{msg.text}</p>
                                            </div>
                                            <span className="text-[10px] text-gray-400 mt-1 px-1">
                                                {formatMessageTime(msg.createdAt)}
                                                {isSender && (
                                                    <span className="ml-2">
                                                        {msg.seen ? (
                                                            <span className="text-blue-400" title="Seen">✓✓</span>
                                                        ) : (
                                                            <span className="text-gray-500" title="Sent">✓</span>
                                                        )}
                                                    </span>
                                                )}
                                            </span>
                                        </>
                                    )}
                                </div>

                                {/* Avatar for sender */}
                                {isSender && showAvatar && (
                                    <div className="flex-shrink-0">
                                        <img
                                            src={authUser?.profilePic || assets.avatar_icon}
                                            alt={authUser?.fullName}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
                <div ref={scrollEnd} />
            </div>

            {/* Message Input Area */}
            <div className="p-4 bg-[#1e1e24]/80 border-t border-stone-500/30">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <div className="flex-1 flex items-center bg-[#2b2b36] rounded-full px-4 py-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                handleTyping();
                            }}
                            onKeyDown={handleKeyPress}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-sm"
                            disabled={isSending}
                            maxLength={1000}
                        />

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            id="image-upload"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleSendImage}
                            className="hidden"
                            disabled={isSending}
                        />

                        {/* Image upload button */}
                        <label
                            htmlFor="image-upload"
                            className={`cursor-pointer p-2 rounded-full hover:bg-white/10 transition-colors ${isSending ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            onClick={(e) => {
                                if (isSending) {
                                    e.preventDefault();
                                    toast.error("Please wait for current message to send");
                                }
                            }}
                        >
                            <img
                                src={assets.gallery_icon}
                                alt="Upload image"
                                className="w-5 h-5"
                            />
                        </label>
                    </div>

                    {/* Send button */}
                    <button
                        type="submit"
                        disabled={isSending || !input.trim()}
                        className={`p-3 rounded-full transition-all ${isSending || !input.trim()
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-violet-600 hover:bg-violet-700 hover:scale-105 active:scale-95'
                            }`}
                        aria-label="Send message"
                    >
                        {isSending ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <img
                                src={assets.send_button}
                                alt="Send"
                                className="w-5 h-5"
                            />
                        )}
                    </button>
                </form>

                {/* Character counter */}
                {input.length > 800 && (
                    <div className="text-right mt-1">
                        <span className={`text-xs ${input.length > 950 ? 'text-red-500' : 'text-yellow-500'
                            }`}>
                            {input.length}/1000
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatContainer;