import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import { Camera, Save, ArrowLeft, User, FileText, Mail, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const ProfilePage = () => {
    const { authUser, updateProfile } = useContext(AuthContext);
    const [selectedImg, setSelectedImg] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [saveSuccess, setSaveSuccess] = useState(false);

    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Initialize form with user data
    useEffect(() => {
        if (authUser) {
            setName(authUser.fullName || "");
            setBio(authUser.bio || "");
            setEmail(authUser.email || "");
            if (authUser.profilePic) {
                setPreviewUrl(authUser.profilePic);
            }
        }
    }, [authUser]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authUser && !isLoading) {
            navigate("/login");
        }
    }, [authUser, isLoading, navigate]);

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    // Validation functions
    const validateName = (name) => {
        return name.trim().length >= 2;
    };

    const validateBio = (bio) => {
        return bio.trim().length >= 10;
    };

    const validateForm = () => {
        const newErrors = {};

        if (!validateName(name)) {
            newErrors.name = "Name must be at least 2 characters";
        }
        if (!validateBio(bio)) {
            newErrors.bio = "Bio must be at least 10 characters";
        }

        return newErrors;
    };

    // Handle input blur
    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const formErrors = validateForm();
        setErrors(prev => ({ ...prev, [field]: formErrors[field] }));
    };

    // Handle image selection
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Please select a valid image file");
            return;
        }

        // Validate file size (max 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            toast.error("Image too large. Maximum size is 2MB");
            return;
        }

        setSelectedImg(file);

        // Create preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    // Remove selected image
    const handleRemoveImage = () => {
        setSelectedImg(null);
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(authUser?.profilePic || null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        const formErrors = validateForm();
        setErrors(formErrors);
        setTouched({ name: true, bio: true });

        if (Object.keys(formErrors).length > 0) {
            toast.error("Please fix the errors before saving");
            return;
        }

        setIsSaving(true);
        setSaveSuccess(false);

        try {
            if (!selectedImg) {
                // Update without image
                const success = await updateProfile({
                    fullName: name,
                    bio,
                });

                if (success) {
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 3000);
                    toast.success("Profile updated successfully!");
                }
                return;
            }

            // Read and upload image
            const reader = new FileReader();
            reader.onload = async () => {
                const base64Image = reader.result;
                const success = await updateProfile({
                    profilePic: base64Image,
                    fullName: name,
                    bio,
                });

                if (success) {
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 3000);
                    toast.success("Profile updated successfully!");
                    setSelectedImg(null);
                }
            };
            reader.readAsDataURL(selectedImg);
        } catch (error) {
            console.error("Profile update error:", error);
            toast.error("Failed to update profile. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        if (authUser) {
            setName(authUser.fullName || "");
            setBio(authUser.bio || "");
            setEmail(authUser.email || "");
            setPreviewUrl(authUser.profilePic || null);
            setSelectedImg(null);
            setErrors({});
            setTouched({});
        }
        navigate("/");
    };

    if (!authUser) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#1a1a1e] to-[#2d2d35] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-400">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a1a1e] to-[#2d2d35] py-8 px-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            {/* Success Banner */}
            {saveSuccess && (
                <div className="fixed top-4 right-4 bg-green-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-slideInRight flex items-center gap-2">
                    <CheckCircle size={18} />
                    <span>Profile saved successfully!</span>
                </div>
            )}

            <div className="relative max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Chat</span>
                    </button>
                    <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
                    <div className="w-20"></div> {/* Spacer */}
                </div>

                {/* Main Content */}
                <div className="bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                        {/* Left Side - Avatar Section */}
                        <div className="md:w-1/3 p-8 bg-gradient-to-b from-violet-600/20 to-purple-600/20 border-b md:border-b-0 md:border-r border-gray-700/50">
                            <div className="text-center">
                                <h3 className="text-lg font-medium text-white mb-4">Profile Picture</h3>

                                {/* Avatar Container */}
                                <div className="relative inline-block group">
                                    <div className="w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-violet-500/30 group-hover:border-violet-500 transition-colors">
                                        <img
                                            src={previewUrl || assets.avatar_icon}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Overlay with camera icon */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-40 h-40 rounded-full bg-black/50 flex items-center justify-center cursor-pointer"
                                            onClick={() => fileInputRef.current?.click()}>
                                            <Camera size={32} className="text-white" />
                                        </div>
                                    </div>

                                    {/* Remove image button */}
                                    {previewUrl && previewUrl !== authUser?.profilePic && (
                                        <button
                                            onClick={handleRemoveImage}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                            title="Remove image"
                                        >
                                            <AlertCircle size={16} />
                                        </button>
                                    )}
                                </div>

                                {/* Hidden file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />

                                {/* Upload buttons */}
                                <div className="mt-4 space-y-2">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full py-2 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                                    >
                                        <Camera size={16} />
                                        Change Photo
                                    </button>
                                    {previewUrl && previewUrl !== authUser?.profilePic && (
                                        <button
                                            onClick={handleRemoveImage}
                                            className="w-full py-2 px-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition-colors text-sm"
                                        >
                                            Cancel Upload
                                        </button>
                                    )}
                                </div>

                                {/* Image requirements */}
                                <div className="mt-4 text-xs text-gray-500">
                                    <p>• Max file size: 2MB</p>
                                    <p>• Supported: JPG, PNG, GIF</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Form Section */}
                        <div className="md:w-2/3 p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Email (Read-only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type="email"
                                            value={email}
                                            disabled
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Email cannot be changed
                                    </p>
                                </div>

                                {/* Full Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            onBlur={() => handleBlur('name')}
                                            className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${touched.name && errors.name
                                                    ? 'border-red-500'
                                                    : 'border-gray-700'
                                                } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors`}
                                            placeholder="Enter your full name"
                                            disabled={isSaving}
                                        />
                                    </div>
                                    {touched.name && errors.name && (
                                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Bio */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Bio
                                    </label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 text-gray-500" size={18} />
                                        <textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            onBlur={() => handleBlur('bio')}
                                            rows={4}
                                            className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${touched.bio && errors.bio
                                                    ? 'border-red-500'
                                                    : 'border-gray-700'
                                                } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors resize-none`}
                                            placeholder="Tell others about yourself..."
                                            disabled={isSaving}
                                        />
                                    </div>
                                    {touched.bio && errors.bio ? (
                                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            {errors.bio}
                                        </p>
                                    ) : (
                                        <p className="mt-1 text-xs text-gray-500">
                                            {bio.length}/500 characters
                                        </p>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                Save Changes
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors border border-gray-700 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Account Info Card */}
                <div className="mt-6 bg-white/5 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-lg">
                            <p className="text-sm text-gray-400">Member Since</p>
                            <p className="text-white font-medium">
                                {authUser?.createdAt
                                    ? new Date(authUser.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })
                                    : 'N/A'
                                }
                            </p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg">
                            <p className="text-sm text-gray-400">Last Updated</p>
                            <p className="text-white font-medium">
                                {authUser?.updatedAt
                                    ? new Date(authUser.updatedAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })
                                    : 'N/A'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;