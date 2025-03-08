import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ResetPasswordForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || "";

    const [resetToken, setResetToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!resetToken) {
            toast.error("Reset token is required!");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:5000/reset_password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Password reset successfully!");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                toast.error(data.error || "Failed to reset password.");
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-900 p-6">
            <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg p-8 text-white border border-gray-700">
                <h2 className="text-3xl font-bold text-center mb-6">Reset Password</h2>

                <form onSubmit={handleResetPassword} className="space-y-4">
                    {/* Reset Token Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Reset Token</label>
                        <input
                            type="text"
                            value={resetToken}
                            onChange={(e) => setResetToken(e.target.value)}
                            placeholder="Enter Reset Token"
                            required
                            className="w-full mt-1 p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                        />
                    </div>

                    {/* New Password Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New Password"
                            required
                            className="w-full mt-1 p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                        />
                    </div>

                    {/* Confirm Password Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm New Password"
                            required
                            className="w-full mt-1 p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-indigo-500 hover:bg-indigo-600 transition-all duration-300 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-xl focus:ring-2 focus:ring-indigo-400"
                    >
                        Reset Password
                    </button>
                </form>

                <ToastContainer />
            </div>
        </div>
    );
}