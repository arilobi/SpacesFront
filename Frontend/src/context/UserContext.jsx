import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, useSearchParams } from "react-router-dom";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [authToken, setAuthToken] = useState(() => sessionStorage.getItem("token"));
    const [current_user, setCurrentUser] = useState(() => {
        const storedUser = sessionStorage.getItem("current_user");
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [allUsers, setAllUsers] = useState(() => {
        const storedUsers = sessionStorage.getItem("all_users");
        return storedUsers ? JSON.parse(storedUsers) : [];
    });

/** Fetch all users (Admin Only) */
const fetchAllUsers = async () => {
    const token = sessionStorage.getItem("token");

    if (!token) {
        toast.error("Unauthorized! Please log in.");
        return;
    }

    // Check if the current user is an admin
    if (current_user?.role !== "Admin") {
        toast.error("Only admins can access this resource.");
        return;
    }

    try {
        console.log("Fetching users...");
        const response = await fetch("https://spacesfront.onrender.com/users", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch users.");
        }

        const data = await response.json();
        console.log("Users fetched successfully:", data.users);

        setAllUsers([...data.users]); // Ensures React state updates
        sessionStorage.setItem("all_users", JSON.stringify(data.users)); //  Cache users

    } catch (error) {
        console.error(" Fetch Users Error:", error.message);
        setAllUsers([]); // Prevent stale data
        toast.error(error.message);
    }
};

    /**  Load current user from sessionStorage */
    useEffect(() => {
        const storedUser = sessionStorage.getItem("current_user");
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    /**  Ensure fetchAllUsers runs when Admin logs in */
    useEffect(() => {
        if (current_user?.role === "Admin") {
            console.log("👤 Admin detected, fetching all users...");
            fetchAllUsers();
        }
    }, [current_user]); 

    /**  Log `allUsers` updates */
    useEffect(() => {
        console.log("📌 `allUsers` updated:", allUsers);
    }, [allUsers]); 

    console.log("Current user:", current_user);

    // Function to handle Google login
    const handleGoogleLogin = () => {
        // Extract user data from URL parameters
        const user_id = searchParams.get("user_id");
        const name = searchParams.get("name");
        const email = searchParams.get("email");
        const role = searchParams.get("role");

        if (user_id && name && email && role) {
            // Update the current_user state
            setCurrentUser({
                id: user_id,
                name: name,
                email: email,
                role: role,
            });

            // Clear the URL parameters
            navigate(location.pathname, { replace: true });

            // Show success message
            toast.success("Successfully logged in with Google!");

            // Redirect based on role
            if (role === "Client") {
                navigate("/spaces");
            } else if (role === "Admin") {
                navigate("/manage-bookings");
            }
        }
    };

    // Check for Google login data on component mount
    useEffect(() => {
        handleGoogleLogin();
    }, [searchParams]);

    // Google login
    const googleLogin = async (email) => {
        toast.loading("Logging you in ... ");
        try {
            const response = await fetch("https://spacesfront.onrender.com/googlelogin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.access_token) {
                toast.dismiss();
                sessionStorage.setItem("token", data.access_token);
                setAuthToken(data.access_token);

                const userResponse = await fetch("https://spacesfront.onrender.com/current_user", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${data.access_token}`,
                    },
                });

                const user = await userResponse.json();
                if (user.email) {
                    setCurrentUser(user);
                    toast.success("Successfully Logged in!");

                    // Redirect based on role
                    if (user.role === "Client") {
                        navigate("/spaces");
                    } else if (user.role === "Admin") {
                        navigate("/manage-bookings");
                    }
                }
            } else {
                toast.dismiss();
                toast.error(data.error || "Failed to login");
            }
        } catch (error) {
            toast.dismiss();
            toast.error("An error occurred. Please try again.");
        }
    };

    /**  Login function */
const login = async (email, password, role) => {
    const loadingToast = toast.loading("Logging you in...");
    try {
        const response = await fetch("https://spacesfront.onrender.com/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, role }),
        });
        const data = await response.json();

        if (data.access_token) {
            sessionStorage.setItem("token", data.access_token);
            setAuthToken(data.access_token);

            const userResponse = await fetch("https://spacesfront.onrender.com/current_user", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${data.access_token}`,
                },
            });
            const user = await userResponse.json();

            if (user.email) {
                setCurrentUser(user);
                sessionStorage.setItem("current_user", JSON.stringify(user));
                toast.success("Successfully Logged in!");

                navigate(user.role === "Client" ? "/spaces" : "/manage-bookings");
            }
        } else {
            toast.error(data.error || "Failed to login");
        }
    } catch (error) {
        toast.error("An error occurred. Please try again.");
    } finally {
        toast.dismiss(loadingToast);
    }
};

/**  Register a new user */
const addUser = async (name, email, password, role = "Client") => {
    const loadingToast = toast.loading("Creating your account...");

    try {
        const response = await fetch("https://spacesfront.onrender.com/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, role }),
        });

        const data = await response.json();

        if (response.ok) {
            toast.success("Account created successfully!");
        } else {
            throw new Error(data.error || "Registration failed.");
        }
    } catch (error) {
        toast.error(error.message);
    } finally {
        toast.dismiss(loadingToast);
    }
};

const updateProfile = async (userId, updatedData) => {
    const token = sessionStorage.getItem("token");

    if (!token) {
        toast.error("Unauthorized! Please log in.");
        return;
    }

    try {
        console.log(`✏️ Updating user ${userId}...`, updatedData);
        const response = await fetch(`https://spacesfront.onrender.com/users/${userId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updatedData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to update user.");
        }

        toast.success("User updated successfully!");

        //  Only refresh the user list if the current user is an admin
        if (current_user?.role === "Admin") {
            fetchAllUsers(); // Refresh the user list
        }

    } catch (error) {
        console.error(" Update user error:", error.message);
        toast.error(error.message);
    }
};


    const deleteUser = async (userId) => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            toast.error("Unauthorized! Please log in.");
            return;
        }

        try {
            console.log(` Deleting user with ID: ${userId}...`);
            const response = await fetch(`https://spacesfront.onrender.com/users/${userId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to delete user.");
            }

            toast.success("User deleted successfully!");
            fetchAllUsers(); // Refresh the user list

        } catch (error) {
            console.error(" Delete user error:", error.message);
            toast.error(error.message);
        }
    };


    /**  Logout */
    const logout = () => {
        console.log("🔴 Logging out...");
        const loadingToast = toast.loading("Logging out...");

        fetch("https://spacesfront.onrender.com/logout", {
            method: "DELETE",
            headers: {
                "Content-type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
        })
        .then((resp) => resp.json())
        .then((response) => {
            toast.dismiss(loadingToast);

            if (response.success === "Logged out successfully") {
                toast.success("Successfully Logged out", { autoClose: 3000 });

                setTimeout(() => {
                    sessionStorage.clear();
                    setAuthToken(null);
                    setCurrentUser(null);
                    setAllUsers([]);
                    navigate("/login");
                }, 1000);
            } else {
                toast.error("Logout failed. Please try again.");
            }
        })
        .catch((error) => {
            toast.dismiss(loadingToast);
            toast.error("An error occurred while logging out.");
        });
    };

    return (
        <UserContext.Provider value={{ 
            authToken, 
            login, 
            current_user, 
            setCurrentUser, 
            logout, 
            fetchAllUsers, 
            allUsers,   
            setAllUsers, 
            handleGoogleLogin,
            googleLogin ,
            addUser,
            deleteUser,  //  Add deleteUser to context
            updateProfile // 

        }}>
            {children}
        </UserContext.Provider>
    );
};
