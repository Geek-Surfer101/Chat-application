import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext.jsx";
import AddFriendModal from "./AddFriendModal";
import { UserPlus, Search, LogOut, Settings, Menu, X } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";
import toast from "react-hot-toast";

const Sidebar = () => {
    const {
        getUsers,
        users,
        selectedUser,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
        isLoading,
    } = useContext(ChatContext);

    const { logout, onlineUser, authUser } = useContext(AuthContext);

    const [input, setInput] = useState("");
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showSearch, setShowSearch] = useState(false);

    const navigate = useNavigate();
    const debouncedInput = useDebounce(input, 300);

    // Filter users based on search input
    const filteredUsers = useMemo(() => {
        if (!debouncedInput.trim()) return users;

        const searchTerm = debouncedInput.toLowerCase().trim();
        return users.filter((user) =>
            user.fullName?.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm)
        );
    }, [users, debouncedInput]);

    // Calculate total unseen messages
    const totalUnseen = useMemo(() => {
        return Object.values(unseenMessages).reduce((acc, count) => acc + count, 0);
    }, [unseenMessages]);

    // Fetch users on component mount and when authUser changes
    useEffect(() => {
        if (authUser) {
            getUsers();
        }
    }, [authUser, getUsers]);

    // Handle friend added
    const handleFriendAdded = useCallback(() => {
        getUsers();
        setShowAddFriend(false);
        toast.success("Friend list updated!");
    }, [getUsers]);

    // Handle logout
    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Failed to logout");
        } finally {
            setIsLoggingOut(false);
        }
    };

    // Handle user selection
    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setUnseenMessages((prev) => ({
            ...prev,
            [user._id]: 0,
        }));
        setShowMobileMenu(false);
        setShowSearch(false);
    };

    // Get online status text
    const getOnlineStatus = (userId) => {
        return onlineUser?.includes(userId) ? "online" : "offline";
    };

    // Get last message preview
    const getLastMessagePreview = (user) => {
        // You can implement this if you store last message in user object
        return user.lastMessage ?
            (user.lastMessage.length > 20 ? user.lastMessage.substring(0, 20) + '...' : user.lastMessage)
            : null;
    };

    return (
        <>
            {/* Mobile Menu Toggle */}
            <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#282142] rounded-lg text-white"
                aria-label="Toggle menu"
            >
                {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar */}
            <div
                className={`
                    bg-[#1a1a1e]/95 backdrop-blur-xl h-full p-5 rounded-r-xl overflow-y-auto text-white
                    transition-all duration-300 ease-in-out
                    ${selectedUser && !showMobileMenu ? 'max-md:hidden' : ''}
                    ${showMobileMenu ? 'fixed inset-y-0 left-0 z-40 w-4/5 max-w-xs' : 'relative'}
                    md:relative md:w-auto md:translate-x-0
                `}
            >
                {showAddFriend && (
                    <AddFriendModal
                        onClose={() => setShowAddFriend(false)}
                        onFriendAdded={handleFriendAdded}
                    />
                )}

                {/* Header */}
                <div className="pb-5">
                    <div className="flex justify-between items-center mb-5">
                        <img
                            src={assets.logo}
                            alt="QuickChat Logo"
                            className="max-w-32 md:max-w-40"
                        />

                        {/* Desktop Menu */}
                        <div className="hidden md:relative md:group">
                            <button
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                aria-label="Menu"
                            >
                                <Menu size={20} />
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-[#282142] rounded-lg border border-gray-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <button
                                    onClick={() => navigate("/profile")}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                                >
                                    <Settings size={16} />
                                    Edit Profile
                                </button>
                                <hr className="my-2 border-gray-700" />
                                <button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isLoggingOut ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                                            Logging out...
                                        </>
                                    ) : (
                                        <>
                                            <LogOut size={16} />
                                            Logout
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Mobile Close Button */}
                        {showMobileMenu && (
                            <button
                                onClick={() => setShowMobileMenu(false)}
                                className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                                aria-label="Close menu"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    {/* Search and Add Friend */}
                    <div className="flex gap-2 mt-5">
                        <div className="relative flex-1">
                            <div className="bg-[#282142] rounded-full flex items-center gap-2 py-2 px-4">
                                <Search size={16} className="text-gray-400" />
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onFocus={() => setShowSearch(true)}
                                    onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                                    placeholder="Search friends..."
                                    className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-gray-500"
                                    aria-label="Search users"
                                />
                                {input && (
                                    <button
                                        onClick={() => setInput("")}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Search Results Count */}
                            {showSearch && debouncedInput && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#282142] rounded-lg py-2 px-4 text-xs text-gray-400 border border-gray-700">
                                    Found {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setShowAddFriend(true)}
                            className="bg-violet-600 hover:bg-violet-700 transition-all hover:scale-105 active:scale-95 w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                            title="Add Friend"
                            aria-label="Add friend"
                        >
                            <UserPlus size={18} />
                        </button>
                    </div>

                    {/* Unseen Messages Badge (Mobile) */}
                    {totalUnseen > 0 && (
                        <div className="md:hidden mt-2 text-xs text-violet-400 flex items-center gap-1">
                            <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
                            {totalUnseen} new message{totalUnseen > 1 ? 's' : ''}
                        </div>
                    )}
                </div>

                {/* User List */}
                <div className="flex flex-col gap-1">
                    {isLoading ? (
                        // Loading skeleton
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                                <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                                    <div className="h-3 bg-gray-700 rounded w-16"></div>
                                </div>
                            </div>
                        ))
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {users.length === 0 ? (
                                <>
                                    <p className="mb-2">No friends yet</p>
                                    <button
                                        onClick={() => setShowAddFriend(true)}
                                        className="text-violet-400 hover:text-violet-300 text-sm flex items-center gap-1 mx-auto"
                                    >
                                        <UserPlus size={14} />
                                        Add your first friend
                                    </button>
                                </>
                            ) : (
                                <p>No users match your search</p>
                            )}
                        </div>
                    ) : (
                        filteredUsers.map((user) => {
                            const isSelected = selectedUser?._id === user._id;
                            const userOnline = onlineUser?.includes(user._id);
                            const unseenCount = unseenMessages[user._id] || 0;
                            const lastMessage = getLastMessagePreview(user);

                            return (
                                <button
                                    key={user._id}
                                    onClick={() => handleUserSelect(user)}
                                    className={`
                                        relative flex items-center gap-3 p-3 rounded-xl transition-all
                                        ${isSelected
                                            ? 'bg-violet-600/20 border-l-4 border-violet-500'
                                            : 'hover:bg-white/5'
                                        }
                                    `}
                                    aria-label={`Chat with ${user.fullName}`}
                                >
                                    {/* Avatar with online indicator */}
                                    <div className="relative flex-shrink-0">
                                        <img
                                            src={user?.profilePic || assets.avatar_icon}
                                            alt={user.fullName}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        {userOnline && (
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a1e]"></span>
                                        )}
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium truncate">
                                                {user.fullName}
                                            </p>
                                            {unseenCount > 0 && (
                                                <span className="text-xs bg-violet-600 text-white px-2 py-0.5 rounded-full ml-2">
                                                    {unseenCount}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-xs">
                                            <span className={`${userOnline ? 'text-green-400' : 'text-gray-500'}`}>
                                                {userOnline ? '● Online' : '○ Offline'}
                                            </span>
                                            {lastMessage && (
                                                <>
                                                    <span className="text-gray-600">•</span>
                                                    <span className="text-gray-400 truncate">
                                                        {lastMessage}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Unseen indicator dot (when no count) */}
                                    {unseenCount === 0 && userOnline && (
                                        <span className="absolute top-3 right-3 w-2 h-2 bg-green-500 rounded-full md:hidden"></span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>

                {/* User Profile Summary (Bottom) */}
                {authUser && (
                    <div className="mt-6 pt-4 border-t border-gray-700/50">
                        <div className="flex items-center gap-3">
                            <img
                                src={authUser.profilePic || assets.avatar_icon}
                                alt={authUser.fullName}
                                className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{authUser.fullName}</p>
                                <p className="text-xs text-gray-500 truncate">{authUser.email}</p>
                            </div>
                            <button
                                onClick={() => navigate("/profile")}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="Edit Profile"
                            >
                                <Settings size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Menu Overlay */}
            {showMobileMenu && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setShowMobileMenu(false)}
                />
            )}
        </>
    );
};

export default Sidebar;