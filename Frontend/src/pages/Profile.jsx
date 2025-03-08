import { useContext, useState, useEffect } from "react";
import { UserContext } from "../context/UserContext";
import { toast } from "react-toastify";
import "../App.css";

const Profile = () => {
    const { current_user, updateProfile, logout } = useContext(UserContext);
    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
        image: "default.jpg",
    });

    useEffect(() => {
        if (current_user) {
            setProfileData({
                name: current_user.name,
                email: current_user.email,
                image: current_user.image || "default.jpg",
            });
        }
    }, [current_user]);

    const handleChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
    
        toast.loading("Uploading image...");
    
        const formData = new FormData();
        formData.append("file", file); // Ensure the field name matches what the server expects
    
        const token = sessionStorage.getItem("token") || localStorage.getItem("jwt_token");
    
        try {
            const response = await fetch("http://127.0.0.1:5000/upload-image", {
                method: "POST",
                headers: {
                    // Do NOT set "Content-Type" manually for FormData
                    "Authorization": `Bearer ${token}`,
                },
                body: formData, // FormData will set the correct Content-Type automatically
            });
    
            const data = await response.json();
    
            if (response.ok) {
                setProfileData({ ...profileData, image: data.image_url });
                toast.dismiss();
                toast.success("Image uploaded successfully!");
            } else {
                throw new Error(data.error || "Upload failed");
            }
        } catch (error) {
            toast.dismiss();
            toast.error("Image upload failed: " + error.message);
        }
    };

    // Function to handle image removal
    const handleRemoveImage = async () => {
        const defaultImage = "default.jpg";

        try {
            await updateProfile(current_user.id, { ...profileData, image: defaultImage });
            setProfileData({ ...profileData, image: defaultImage });
            toast.success("Profile image removed!");
        } catch (error) {
            toast.error("Failed to remove image.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!profileData.name || !profileData.email) {
            toast.error("Name and email are required!");
            return;
        }
        await updateProfile(current_user.id, profileData);
    };

    return (
        <div className="profile-container" style={{maxWidth: "600px",
            margin: "auto",
            padding: "20px",
            backgroundColor: "#F1EDE5",
            borderStyle: "solid",
            borderColor: "#103436",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
            borderRadius: "10px",
            paddingTop: "40px",
            paddingBottom: "40px",
            paddingRight: "40px",
            paddingLeft: "40px",
            marginBottom: "40px",
            borderBottom: "10px solid #104436",
            borderRight: "9px solid #104436",}}>
            <div className="form-group">
                    
                    {profileData.image && (
                        <div style={{ textAlign: "center", marginBottom: "10px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <img 
                            src={profileData.image} 
                            alt="Profile" 
                            className="profile-image"
                            style={{ marginBottom: "10px" }} // Added margin for spacing
                        />
                        {profileData.image !== "default.jpg" && (
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                style={{
                                    backgroundColor: "#d9534f",
                                    color: "white",
                                    border: "none",
                                    padding: "10px 15px",
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontFamily: "Inria Serif",
                                    transition: "background-color 0.3s ease",
                                }}
                                onMouseOver={(e) => (e.target.style.backgroundColor = "#c9302c")}
                                onMouseOut={(e) => (e.target.style.backgroundColor = "#d9534f")}
                            >
                                Remove Image
                            </button>
                        )}
                    </div>

                    )}

                    {/* Hide file input if image is uploaded */}
                    {profileData.image === "default.jpg" && (
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{
                                width: "100%",
                                padding: "10px",
                                border: "none",
                                fontFamily: "Inria Serif",
                            }}
                        />
                    )}
                </div>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label style={{
                        display: "block",
                        marginBottom: "10px",
                        color: "black",
                        fontFamily: 'Inria Serif',
                        fontWeight: "500",
                    }}>Name</label>
                    <input
                        type="text"
                        name="name"
                        placeholder="Name"
                        value={profileData.name}
                        onChange={handleChange}
                        style={{
                            width: "93%",
                            padding: "10px",
                            border: "1px solid #104436",
                            borderWidth: "2px",
                            borderRadius: "20px",
                            padding: "20px",
                        }}
                    />
                </div>
                <div className="form-group">
                    <label style={{
                        display: "block",
                        marginBottom: "10px",
                        color: "black",
                        fontFamily: "Inria Serif",
                    }}>Email</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={profileData.email}
                        onChange={handleChange}
                        style={{
                            width: "93%",
                            padding: "20px",
                            border: "1px solid #104436",
                            borderWidth: "2px",
                            borderRadius: "20px",
                        }}
                        disabled
                    />
                </div>
                
                <button type="submit" className="submit-button" style={{
                    width: "100%",
                    padding: "20px",
                    backgroundColor: "#104436",
                    color: "white",
                    borderRadius: "20px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "18px",
                    fontFamily: "Inria Serif"
                }}>
                    Update Profile
                </button>
            </form>
            <div className="logout-container">
                <button onClick={logout} className="logout-button" style={{
                        width: "100%",
                        padding: "20px",
                        backgroundColor: "#104436",
                        color: "#fff",
                        borderRadius: "20px",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "18px",
                        fontFamily: "Inria Serif",
                        transition: "background-color 0.3s ease",
                    }}
                    onMouseOver={(e) => (e.target.style.backgroundColor = "#256a57")}
                    onMouseOut={(e) => (e.target.style.backgroundColor = "#104436")}>
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Profile;
