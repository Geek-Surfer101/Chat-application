// Profile Images
import avatar_icon from "./avatar_icon.png"
import profile_richard from "./profile_richard.png"
import profile_alison from "./profile_alison.png"
import profile_enrique from "./profile_enrique.png"
import profile_marco from "./profile_marco.png"
import profile_martin from "./profile_martin.png"

// Icons and UI Elements
import gallery_icon from "./gallery_icon.svg"
import help_icon from "./help_icon.png"
import logo_icon from "./logo_icon.svg"
import logo_big from "./logo_big.svg"
import logo from "./logo.png"
import search_icon from "./search_icon.png"
import send_button from "./send_button.svg"
import menu_icon from "./menu_icon.png"
import arrow_icon from "./arrow_icon.png"
import code from "./code.svg"

// Background Images
import bgImage from "./bgImage.svg"

// Demo Images
import pic1 from "./pic1.png"
import pic2 from "./pic2.png"
import pic3 from "./pic3.png"
import pic4 from "./pic4.png"
import img1 from "./img1.jpg"
import img2 from "./img2.jpg"

// Main assets object - all frequently used assets
const assets = {
    // Profile Images
    avatar_icon,
    profile_richard,
    profile_alison,
    profile_enrique,
    profile_marco,
    profile_martin,

    // Icons and UI
    gallery_icon,
    help_icon,
    logo_big,
    logo_icon,
    logo,
    search_icon,
    send_button,
    menu_icon,
    arrow_icon,
    code,

    // Background
    bgImage,

    // Demo Images
    pic1,
    pic2,
    pic3,
    pic4,
    img1,
    img2,
}

export default assets

// ===== DUMMY DATA FOR DEVELOPMENT =====
// These can be used for testing when backend is not available

// Dummy images array for gallery display
export const imagesDummyData = [pic1, pic2, pic3, pic4, pic1, pic2, pic3, pic4]

// Dummy users data for sidebar testing
export const userDummyData = [
    {
        _id: "680f50aaf10f3cd28382ecf2",
        email: "alison@example.com",
        fullName: "Alison Martin",
        profilePic: profile_alison,
        bio: "Hi Everyone, I'm using QuickChat. Love to connect with new people!",
        isOnline: true,
        lastSeen: new Date().toISOString(),
    },
    {
        _id: "680f50e4f10f3cd28382ecf9",
        email: "martin@example.com",
        fullName: "Martin Johnson",
        profilePic: profile_martin,
        bio: "Software developer | Tech enthusiast | Always coding",
        isOnline: false,
        lastSeen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
        _id: "680f510af10f3cd28382ed01",
        email: "enrique@example.com",
        fullName: "Enrique Martinez",
        profilePic: profile_enrique,
        bio: "Digital artist and designer. I love creating beautiful things.",
        isOnline: true,
        lastSeen: new Date().toISOString(),
    },
    {
        _id: "680f5137f10f3cd28382ed10",
        email: "marco@example.com",
        fullName: "Marco Jones",
        profilePic: profile_marco,
        bio: "Traveler | Photographer | Exploring the world one chat at a time",
        isOnline: false,
        lastSeen: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
        _id: "680f516cf10f3cd28382ed11",
        email: "richard@example.com",
        fullName: "Richard Smith",
        profilePic: profile_richard,
        bio: "Music lover | Guitarist | Always up for a good conversation",
        isOnline: true,
        lastSeen: new Date().toISOString(),
    },
]

// Dummy messages data for chat testing
export const messagesDummyData = [
    {
        _id: "680f571ff10f3cd28382f094",
        senderId: "680f50aaf10f3cd28382ecf2", // Alison
        receiverId: "680f50e4f10f3cd28382ecf9", // Martin
        text: "Hey Martin! How's your day going?",
        seen: true,
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
        _id: "680f5726f10f3cd28382f0b1",
        senderId: "680f50e4f10f3cd28382ecf9", // Martin
        receiverId: "680f50aaf10f3cd28382ecf2", // Alison
        text: "Hey Alison! Pretty good, just working on some code. You?",
        seen: true,
        createdAt: new Date(Date.now() - 3500000).toISOString(), // 58 mins ago
    },
    {
        _id: "680f5729f10f3cd28382f0b6",
        senderId: "680f50aaf10f3cd28382ecf2", // Alison
        receiverId: "680f50e4f10f3cd28382ecf9", // Martin
        text: "Same here! This chat app is coming along nicely. The real-time features are working great!",
        seen: true,
        createdAt: new Date(Date.now() - 3400000).toISOString(), // 56 mins ago
    },
    {
        _id: "680f572cf10f3cd28382f0bb",
        senderId: "680f50e4f10f3cd28382ecf9", // Martin
        receiverId: "680f50aaf10f3cd28382ecf2", // Alison
        text: "Absolutely! The socket connection is smooth. Have you tried the image sharing yet?",
        seen: true,
        createdAt: new Date(Date.now() - 3300000).toISOString(), // 55 mins ago
    },
    {
        _id: "680f573cf10f3cd28382f0c0",
        senderId: "680f50e4f10f3cd28382ecf9", // Martin
        receiverId: "680f50aaf10f3cd28382ecf2", // Alison
        image: img1,
        text: "Just shared this screenshot of the new UI!",
        seen: true,
        createdAt: new Date(Date.now() - 3200000).toISOString(), // 53 mins ago
    },
    {
        _id: "680f5745f10f3cd28382f0c5",
        senderId: "680f50aaf10f3cd28382ecf2", // Alison
        receiverId: "680f50e4f10f3cd28382ecf9", // Martin
        image: img2,
        text: "Nice! Check out this dark theme I'm working on.",
        seen: true,
        createdAt: new Date(Date.now() - 3100000).toISOString(), // 51 mins ago
    },
    {
        _id: "680f5748f10f3cd28382f0ca",
        senderId: "680f50aaf10f3cd28382ecf2", // Alison
        receiverId: "680f50e4f10f3cd28382ecf9", // Martin
        text: "Looks amazing! The gradient effects are perfect. Let's catch up later, gotta run to a meeting!",
        seen: false,
        createdAt: new Date(Date.now() - 3000000).toISOString(), // 50 mins ago
    },
]

// Helper function to get user by ID
export const getUserById = (userId) => {
    return userDummyData.find((user) => user._id === userId) || null
}

// Helper function to get messages between two users
export const getConversation = (user1Id, user2Id) => {
    return messagesDummyData
        .filter(
            (msg) =>
                (msg.senderId === user1Id && msg.receiverId === user2Id) ||
                (msg.senderId === user2Id && msg.receiverId === user1Id),
        )
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
}

// Helper function to get unread count for a user
export const getUnreadCount = (userId) => {
    return messagesDummyData.filter((msg) => msg.receiverId === userId && !msg.seen).length
}

// Helper function to get last message between users
export const getLastMessage = (user1Id, user2Id) => {
    const conversation = getConversation(user1Id, user2Id)
    return conversation.length > 0 ? conversation[conversation.length - 1] : null
}
