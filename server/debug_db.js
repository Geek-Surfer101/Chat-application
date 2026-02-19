import mongoose from "mongoose";
import User from "./models/User.js";
import Invitation from "./models/Invitation.js";
import "dotenv/config";

const debug = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/chat-app`);
        console.log("Connected to DB (chat-app)");

        const users = await User.find({});
        console.log(`Total Users: ${users.length}`);

        const invitations = await Invitation.find({});
        console.log(`Total Invitations: ${invitations.length}`);

        console.log("\n--- INVITATIONS ---");
        invitations.forEach(inv => {
            console.log(`Sender: ${inv.sender}, Receiver: ${inv.receiver}, Status: ${inv.status}`);
        });

        console.log("\n--- FRIENDSHIPS (Derived) ---");
        for (const user of users) {
            const friends = await Invitation.find({
                $or: [
                    { sender: user._id, status: "accepted" },
                    { receiver: user._id, status: "accepted" }
                ]
            });
            console.log(`User ${user.fullName} (${user._id}) has ${friends.length} friends.`);
            if (friends.length > 0) {
                console.log(`  Friends: ${friends.map(f => f._id)}`);
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
};

debug();
