import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

export default function Login() {
    const { login, googleLogin } = useContext(UserContext);
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Client');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [showResetForm, setShowResetForm] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password, role);
            setIsLoggedIn(true);
            
        } catch (error) {
            setIsLoggedIn(false);
            toast.error("Invalid credentials. Please try again.");
        }
    };
    
    

const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
        setResetMessage("Please enter your email.");
        return;
    }

    try {
        const response = await fetch("https://spacesfront.onrender.com/request_password_reset", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: resetEmail }),
        });

        const data = await response.json();
        if (response.ok) {
            toast.success("Password reset link sent. Check your email.");
            navigate("/reset-password", { state: { email: resetEmail } });
        } else {
            toast.error(data.error || "Failed to send reset link.");
        }
    } catch (error) {
        toast.error("An error occurred. Please try again.");
    }
};


    function google_login(token) {
        const user_details = jwtDecode(token);
        googleLogin(user_details.email);
    }

    return (
        <div className="login-container">
            <div className="form-box">
                <h2>Welcome back!</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                    />
                    <br /><br />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                    />
                    <br /><br />

                    <p className="forgot-password" onClick={() => setShowResetForm(true)} style={{ cursor: "pointer", color: "black", textDecoration: "underline" }}>
                        Forgot password?
                    </p>

                    <div className="google-login-btn">
                        <GoogleLogin
                            onSuccess={credentialResponse => {
                                google_login(credentialResponse.credential);
                            }}
                            onError={() => {
                                console.log('Login Failed');
                            }}
                        />
                    </div>

                    <br />
                    <button type="submit">LOGIN</button>
                    <br /><br />
                    <p>
                        Don't have an account?
                        <Link to="/Register"><strong> Register</strong></Link>
                    </p>
                </form>

                {isLoggedIn && <p>You are logged in as {role}!</p>}
            </div>

            {showResetForm && (
                <div className="reset-password-modal">
                    <div className="reset-password-content">
                        <span className="close" onClick={() => setShowResetForm(false)}>&times;</span>
                        <h4>Reset Password</h4>
                        <input
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                        <button type="button" onClick={handlePasswordReset}>
                            Send Reset Link
                        </button>
                        {resetMessage && <p className="reset-message">{resetMessage}</p>}
                    </div>
                </div>
            )}

            <ToastContainer />
        </div>
    );
}