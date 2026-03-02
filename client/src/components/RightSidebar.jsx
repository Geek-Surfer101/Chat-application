import React, { useContext, useState, useEffect, useMemo, useCallback } from "react";
import assets from "../assets/assets";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import { Download, Image as ImageIcon, X, ExternalLink } from "lucide-react";

const RightSidebar = () => {
    const { selectedUser, messages } = useContext(ChatContext);
    const { logout, onlineUser, authUser } = useContext(AuthContext);
    const [msgImages, setMsgImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Get all images from messages
    useEffect(() => {
        if (messages && messages.length > 0) {
            const images = messages
                .filter(msg => msg.image)
                .map(msg => ({
                    url: msg.image,
                    timestamp: msg.createdAt,
                    sender: msg.senderId === authUser?._id ? 'You' : selectedUser?.fullName
                }));
            setMsgImages(images);
        } else {
            setMsgImages([]);
        }
    }, [messages, authUser, selectedUser]);

    // Format date for display
    const formatDate = useCallback((timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }, []);

    // Handle logout with loading state
    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    // Download image
    const downloadImage = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || 'image.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Download failed:", error);
        }
    };

    // If no user selected, don't render
    if (!selectedUser) return null;

    const isOnline = onlineUser.includes(selectedUser._id);
    const mediaCount = msgImages.length;

    return (
        <>
            <div className="bg-[#1a1a1e]/80 text-white w-full relative overflow-y-auto flex flex-col h-full border-l border-stone-500/30">
                {/* Profile Section */}
                <div className="pt-8 px-6 flex flex-col items-center gap-3">
                    <div className="relative">
                        <img
                            src={selectedUser.profilePic || assets.avatar_icon}
                            alt={selectedUser.fullName}
                            className="w-24 h-24 rounded-full object-cover border-3 border-violet-500/30"
                        />
                        {isOnline && (
                            <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1a1a1e] animate-pulse"></span>
                        )}
                    </div>

                    <div className="text-center">
                        <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
                            {selectedUser.fullName}
                            {isOnline ? (
                                <span className="text-xs text-green-400 font-normal">● Online</span>
                            ) : (
                                <span className="text-xs text-gray-400 font-normal">● Offline</span>
                            )}
                        </h2>
                        {selectedUser.email && (
                            <p className="text-sm text-gray-400 mt-1">{selectedUser.email}</p>
                        )}
                    </div>

                    {selectedUser.bio && (
                        <p className="text-sm text-gray-300 text-center px-4 py-2 bg-white/5 rounded-lg">
                            {selectedUser.bio}
                        </p>
                    )}
                </div>

                <hr className="border-stone-500/30 my-4" />

                {/* Media Section */}
                <div className="px-6 flex-1">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <ImageIcon size={16} />
                            Shared Media
                            {mediaCount > 0 && (
                                <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">
                                    {mediaCount}
                                </span>
                            )}
                        </h3>
                        {mediaCount > 0 && (
                            <button
                                onClick={() => setShowMediaModal(true)}
                                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                            >
                                View All
                            </button>
                        )}
                    </div>

                    {mediaCount === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-500 bg-white/5 rounded-lg">
                            <ImageIcon size={32} className="opacity-30 mb-2" />
                            <p className="text-sm">No media shared yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            {msgImages.slice(0, 6).map((img, index) => (
                                <div
                                    key={index}
                                    onClick={() => {
                                        setSelectedImage(img);
                                        setShowMediaModal(true);
                                    }}
                                    className="relative group cursor-pointer aspect-square rounded-lg overflow-hidden bg-white/5"
                                >
                                    <img
                                        src={img.url}
                                        alt={`Shared by ${img.sender}`}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <ExternalLink size={20} className="text-white" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Logout Button */}
                <div className="p-6 mt-auto">
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg py-3 px-4 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoggingOut ? (
                            <>
                                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                                Logging out...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Logout
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Media Modal */}
            {showMediaModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => {
                        setShowMediaModal(false);
                        setSelectedImage(null);
                    }}
                >
                    <div
                        className="bg-[#1e1e24] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                <ImageIcon size={20} className="text-violet-400" />
                                Shared Media
                                <span className="text-sm text-gray-400 font-normal">
                                    ({mediaCount} items)
                                </span>
                            </h3>
                            <button
                                onClick={() => {
                                    setShowMediaModal(false);
                                    setSelectedImage(null);
                                }}
                                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
                            {selectedImage ? (
                                <div className="relative">
                                    <img
                                        src={selectedImage.url}
                                        alt="Shared media"
                                        className="max-w-full max-h-[60vh] mx-auto rounded-lg"
                                    />
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <button
                                            onClick={() => downloadImage(selectedImage.url, `image-${Date.now()}.jpg`)}
                                            className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                                            title="Download"
                                        >
                                            <Download size={20} />
                                        </button>
                                        <button
                                            onClick={() => setSelectedImage(null)}
                                            className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                                            title="Back to grid"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-400">
                                        Shared by {selectedImage.sender} • {new Date(selectedImage.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {msgImages.map((img, index) => (
                                        <div
                                            key={index}
                                            onClick={() => setSelectedImage(img)}
                                            className="group cursor-pointer aspect-square rounded-lg overflow-hidden bg-white/5 hover:ring-2 hover:ring-violet-500 transition-all"
                                        >
                                            <img
                                                src={img.url}
                                                alt={`Shared media ${index + 1}`}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                loading="lazy"
                                            />
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <p className="text-xs text-white truncate">{img.sender}</p>
                                                <p className="text-[10px] text-gray-300">{formatDate(img.timestamp)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RightSidebar;