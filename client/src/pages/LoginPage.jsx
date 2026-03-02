import React, { useContext, useState, useEffect } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import { Mail, Lock, User, FileText, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
    const [currState, setCurrentState] = useState("Sign Up");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [bio, setBio] = useState("");
    const [isDataSubmitted, setIsDataSubmitted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    const { login, isAuthenticated } = useContext(AuthContext);
    const navigate = useNavigate();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated, navigate]);

    // Validation functions
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password) => {
        return password.length >= 6;
    };

    const validateFullName = (name) => {
        return name.trim().length >= 2;
    };

    const validateForm = () => {
        const newErrors = {};

        if (currState === "Sign Up") {
            if (!validateFullName(fullName)) {
                newErrors.fullName = "Name must be at least 2 characters";
            }
            if (!validateEmail(email)) {
                newErrors.email = "Please enter a valid email address";
            }
            if (!validatePassword(password)) {
                newErrors.password = "Password must be at least 6 characters";
            }
            if (password !== confirmPassword) {
                newErrors.confirmPassword = "Passwords do not match";
            }
            if (!agreeTerms) {
                newErrors.terms = "You must agree to the terms";
            }
            if (isDataSubmitted && !bio.trim()) {
                newErrors.bio = "Please provide a short bio";
            }
        } else {
            if (!validateEmail(email)) {
                newErrors.email = "Please enter a valid email address";
            }
            if (!password) {
                newErrors.password = "Password is required";
            }
        }

        return newErrors;
    };

    // Handle input blur for validation
    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const formErrors = validateForm();
        setErrors(prev => ({ ...prev, [field]: formErrors[field] }));
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();

        // Validate form
        const formErrors = validateForm();
        setErrors(formErrors);

        if (Object.keys(formErrors).length > 0) {
            return;
        }

        if (currState === 'Sign Up' && !isDataSubmitted) {
            setIsDataSubmitted(true);
            return;
        }

        setIsLoading(true);

        const success = await login(currState === "Sign Up" ? "signup" : "login", {
            fullName,
            email,
            password,
            bio,
        });

        setIsLoading(false);

        if (success) {
            // Reset form
            setFullName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setBio("");
            setIsDataSubmitted(false);
            setAgreeTerms(false);
            setErrors({});
            setTouched({});
        }
    };

    const toggleState = () => {
        setCurrentState(prev => prev === "Sign Up" ? "Login" : "Sign Up");
        setIsDataSubmitted(false);
        setErrors({});
        setTouched({});
        setFullName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setBio("");
        setAgreeTerms(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a1a1e] to-[#2d2d35] flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
            </div>

            {/* Main Container */}
            <div className="relative w-full max-w-6xl flex items-center gap-8 flex-col lg:flex-row">
                {/* Left Side - Branding */}
                <div className="flex-1 text-center lg:text-left">
                    <div className="mb-8 animate-float">
                        <img
                            src={assets.logo_big}
                            alt="QuickChat Logo"
                            className="w-48 mx-auto lg:mx-0 mb-6 filter drop-shadow-2xl"
                        />
                        <h1 className="text-4xl font-bold text-white mb-4">
                            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-600">QuickChat</span>
                        </h1>
                        <p className="text-gray-400 text-lg max-w-md mx-auto lg:mx-0">
                            Connect with friends in real-time. Share moments, messages, and memories.
                        </p>
                    </div>

                    {/* Feature List */}
                    <div className="hidden lg:block mt-12 space-y-4">
                        {[
                            "Real-time messaging",
                            "End-to-end encrypted",
                            "Share images & media",
                            "Friend invitations",
                            "Online status indicators"
                        ].map((feature, index) => (
                            <div key={index} className="flex items-center gap-3 text-gray-300">
                                <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                                <span>{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="flex-1 w-full max-w-md">
                    <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white mb-2">
                                {currState === "Sign Up" ? "Create Account" : "Welcome Back"}
                            </h2>
                            <p className="text-gray-400">
                                {currState === "Sign Up"
                                    ? "Sign up to start chatting with friends"
                                    : "Login to continue your conversations"}
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={onSubmitHandler} className="space-y-4">
                            {/* Full Name - Step 1 Sign Up */}
                            {currState === "Sign Up" && !isDataSubmitted && (
                                <div>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            onBlur={() => handleBlur('fullName')}
                                            placeholder="Full Name"
                                            className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${touched.fullName && errors.fullName
                                                    ? 'border-red-500'
                                                    : 'border-gray-700'
                                                } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors`}
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {touched.fullName && errors.fullName && (
                                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            {errors.fullName}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Email - Always visible */}
                            <div>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onBlur={() => handleBlur('email')}
                                        placeholder="Email Address"
                                        className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${touched.email && errors.email
                                                ? 'border-red-500'
                                                : 'border-gray-700'
                                            } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors`}
                                        disabled={isLoading}
                                    />
                                </div>
                                {touched.email && errors.email && (
                                    <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onBlur={() => handleBlur('password')}
                                        placeholder="Password"
                                        className={`w-full pl-10 pr-10 py-3 bg-white/5 border ${touched.password && errors.password
                                                ? 'border-red-500'
                                                : 'border-gray-700'
                                            } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors`}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {touched.password && errors.password && (
                                    <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password - Sign Up only */}
                            {currState === "Sign Up" && !isDataSubmitted && (
                                <div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            onBlur={() => handleBlur('confirmPassword')}
                                            placeholder="Confirm Password"
                                            className={`w-full pl-10 pr-10 py-3 bg-white/5 border ${touched.confirmPassword && errors.confirmPassword
                                                    ? 'border-red-500'
                                                    : 'border-gray-700'
                                                } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors`}
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {touched.confirmPassword && errors.confirmPassword && (
                                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            {errors.confirmPassword}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Bio - Step 2 Sign Up */}
                            {currState === "Sign Up" && isDataSubmitted && (
                                <div>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                                        <textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            onBlur={() => handleBlur('bio')}
                                            rows={4}
                                            placeholder="Tell us a little about yourself..."
                                            className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${touched.bio && errors.bio
                                                    ? 'border-red-500'
                                                    : 'border-gray-700'
                                                } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors resize-none`}
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {touched.bio && errors.bio && (
                                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            {errors.bio}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Terms Checkbox - Sign Up only */}
                            {currState === "Sign Up" && !isDataSubmitted && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        checked={agreeTerms}
                                        onChange={(e) => setAgreeTerms(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-700 bg-white/5 text-violet-600 focus:ring-violet-500 focus:ring-offset-0"
                                    />
                                    <label htmlFor="terms" className="text-sm text-gray-400">
                                        I agree to the{" "}
                                        <button type="button" className="text-violet-400 hover:text-violet-300">
                                            Terms of Service
                                        </button>{" "}
                                        and{" "}
                                        <button type="button" className="text-violet-400 hover:text-violet-300">
                                            Privacy Policy
                                        </button>
                                    </label>
                                </div>
                            )}
                            {touched.terms && errors.terms && (
                                <p className="text-xs text-red-400 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    {errors.terms}
                                </p>
                            )}

                            {/* Navigation between steps */}
                            {currState === "Sign Up" && isDataSubmitted && (
                                <button
                                    type="button"
                                    onClick={() => setIsDataSubmitted(false)}
                                    className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1"
                                >
                                    ← Back to personal info
                                </button>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {currState === "Sign Up" ? "Creating Account..." : "Logging in..."}
                                    </>
                                ) : (
                                    currState === "Sign Up"
                                        ? (isDataSubmitted ? "Complete Sign Up" : "Continue")
                                        : "Login Now"
                                )}
                            </button>

                            {/* Toggle between Login and Sign Up */}
                            <div className="text-center text-sm text-gray-400">
                                {currState === "Sign Up" ? (
                                    <p>
                                        Already have an account?{" "}
                                        <button
                                            type="button"
                                            onClick={toggleState}
                                            className="text-violet-400 hover:text-violet-300 font-medium"
                                        >
                                            Login here
                                        </button>
                                    </p>
                                ) : (
                                    <p>
                                        Don't have an account?{" "}
                                        <button
                                            type="button"
                                            onClick={toggleState}
                                            className="text-violet-400 hover:text-violet-300 font-medium"
                                        >
                                            Sign up
                                        </button>
                                    </p>
                                )}
                            </div>
                        </form>

                        {/* Demo Credentials */}
                        {currState === "Login" && (
                            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-gray-700/50">
                                <p className="text-xs text-gray-400 mb-2">Demo Credentials:</p>
                                <div className="space-y-1 text-xs text-gray-500">
                                    <p>Email: demo@quickchat.com</p>
                                    <p>Password: demo123</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;