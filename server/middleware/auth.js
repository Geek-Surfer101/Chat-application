// middleware to protect routes

import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req, res, next) => {
    try {
        let token = req.headers.token;

        if (!token && req.headers.authorization) {
            token = req.headers.authorization.split(" ")[1];
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.json({
                success: false,
                message: "User not found",
            });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error(error.message);

        res.json({
            success: false,
            message: error.message,
        });
    }
}