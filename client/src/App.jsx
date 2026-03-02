import React, { useContext, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import { Toaster } from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";

// Loading component
const LoadingSpinner = () => (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1e] to-[#2d2d35] flex items-center justify-center">
        <div className="text-center">
            <div className="relative">
                <div className="w-20 h-20 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full animate-pulse"></div>
                </div>
            </div>
            <p className="mt-6 text-gray-400 text-lg animate-pulse">Loading QuickChat...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait while we set up your experience</p>
        </div>
    </div>
);

// Page transition animations
const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    in: {
        opacity: 1,
        y: 0,
    },
    out: {
        opacity: 0,
        y: -20,
    },
};

const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.3,
};

const App = () => {
    const { authUser, isLoading } = useContext(AuthContext);
    const location = useLocation();
    const [showContent, setShowContent] = useState(false);

    // Handle loading state
    useEffect(() => {
        if (!isLoading) {
            // Small delay to ensure smooth transition
            const timer = setTimeout(() => setShowContent(true), 100);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    // Don't render anything while checking auth
    if (isLoading || !showContent) {
        return <LoadingSpinner />;
    }

    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Background Pattern */}
            <div className="fixed inset-0 bg-gradient-to-br from-[#1a1a1e] to-[#2d2d35]">
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            {/* Animated gradient orbs */}
            <div className="fixed top-20 left-20 w-96 h-96 bg-violet-600/20 rounded-full filter blur-3xl animate-pulse-slow"></div>
            <div className="fixed bottom-20 right-20 w-96 h-96 bg-purple-600/20 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>

            {/* Toast Notifications */}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#1e1e24',
                        color: '#fff',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '0.75rem',
                        padding: '1rem',
                    },
                    success: {
                        iconTheme: {
                            primary: '#8b5cf6',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />

            {/* Routes with Animation */}
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route
                        path="/"
                        element={
                            <motion.div
                                initial="initial"
                                animate="in"
                                exit="out"
                                variants={pageVariants}
                                transition={pageTransition}
                            >
                                {authUser ? <HomePage /> : <Navigate to="/login" replace />}
                            </motion.div>
                        }
                    />

                    <Route
                        path="/login"
                        element={
                            <motion.div
                                initial="initial"
                                animate="in"
                                exit="out"
                                variants={pageVariants}
                                transition={pageTransition}
                            >
                                {!authUser ? <LoginPage /> : <Navigate to="/" replace />}
                            </motion.div>
                        }
                    />

                    <Route
                        path="/profile"
                        element={
                            <motion.div
                                initial="initial"
                                animate="in"
                                exit="out"
                                variants={pageVariants}
                                transition={pageTransition}
                            >
                                {authUser ? <ProfilePage /> : <Navigate to="/login" replace />}
                            </motion.div>
                        }
                    />

                    {/* 404 Route */}
                    <Route
                        path="*"
                        element={
                            <motion.div
                                initial="initial"
                                animate="in"
                                exit="out"
                                variants={pageVariants}
                                transition={pageTransition}
                                className="min-h-screen flex items-center justify-center"
                            >
                                <div className="text-center p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-700/50 max-w-md mx-4">
                                    <h1 className="text-6xl font-bold text-white mb-4">404</h1>
                                    <h2 className="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
                                    <p className="text-gray-400 mb-6">
                                        The page you're looking for doesn't exist or has been moved.
                                    </p>
                                    <button
                                        onClick={() => window.location.href = '/'}
                                        className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-medium hover:from-violet-700 hover:to-purple-700 transition-all transform hover:scale-105"
                                    >
                                        Go Back Home
                                    </button>
                                </div>
                            </motion.div>
                        }
                    />
                </Routes>
            </AnimatePresence>
        </div>
    );
};

export default App;