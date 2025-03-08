import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import { toast } from "react-toastify";
import "../App.css";

const ManageUsers = () => {
    const { allUsers = [], fetchAllUsers, current_user, deleteUser, addUser, updateProfile } = useContext(UserContext);
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "Client" });
    const [editUser, setEditUser] = useState(null);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (current_user?.role === "Admin") {
            console.log("Fetching all users...");  // Debugging Step
            fetchAllUsers();
        }
    }, [current_user]);  // Ensure it only runs when the user changes

    const fetchUsers = async () => {
        setLoading(true);
        try {
            await fetchAllUsers();
        } catch (error) {
            toast.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;

        setLoading(true);
        try {
            await deleteUser(userId);
            toast.success("User deleted successfully");
            fetchUsers(); // Refresh the user list
        } catch (error) {
            toast.error("Failed to delete user");
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const createdUser = await addUser(newUser.name, newUser.email, newUser.password, newUser.role, false); // ✅ Disable auto-login
            toast.success("User added successfully");
            setNewUser({ name: "", email: "", password: "", role: "Client" });
            setIsAddUserModalOpen(false); // Close the modal
            fetchUsers(); // Refresh the user list
        } catch (error) {
            toast.error("Failed to add user");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateProfile(editUser.id, editUser);
            toast.success("User updated successfully");
            setEditUser(null);
            fetchUsers();
        } catch (error) {
            toast.error("Failed to update user");
        } finally {
            setLoading(false);
        }
    };

    if (!current_user || current_user.role !== "Admin") {
        return <p>You do not have permission to view this page.</p>;
    }

    return (
        <div className="manage-users" style={{ padding: "20px", margin: "0 auto", maxWidth: "1400px", minHeight: "100vh", }}>
            <h1 style={{ fontFamily: "Inria Serif", textAlign: "center", color: "#104436", fontSize: "30px", marginBottom: "20px" }}>
                Manage Users
            </h1>

            {loading && <p style={{ textAlign: "center", fontFamily: "Inria Serif", color: "#104436" }}>Loading...</p>}

            {/* Button to open Add User Modal */}
            <button
                onClick={() => setIsAddUserModalOpen(true)}
                style={{
                    padding: "20px",
                    backgroundColor: "#104436",
                    color: "#fff",
                    border: "none",
                    borderRadius: "20px",
                    cursor: "pointer",
                    fontFamily: "Inria Serif",
                    fontSize: "16px",
                    transition: "background-color 0.3s ease",
                    marginBottom: "20px",
                    display: "block",
                    margin: "0 auto",
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#256a57")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#104436")}
            >
                Add New User
            </button>

            {/* Add User Modal */}
            {isAddUserModalOpen && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 1000,
                }}>
                    <div style={{
                        backgroundColor: "#F1EDE5",
                        padding: "20px",
                        paddingRight: "34px",
                        borderRadius: "12px",
                        width: "90%",
                        border: "3px solid #104436",
                        maxWidth: "600px",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                        position: "relative",
                    }}>
                        <button
                            onClick={() => setIsAddUserModalOpen(false)}
                            style={{
                                position: "absolute",
                                top: "10px",
                                right: "10px",
                                backgroundColor: "transparent",
                                border: "none",
                                fontSize: "20px",
                                cursor: "pointer",
                                color: "#104436",
                            }}
                        >
                            ×
                        </button>

                        <h2 style={{ fontFamily: "Inria Serif", textAlign: "center", color: "#104436", fontSize: "30px", marginBottom: "20px" }}>
                            Add New User
                        </h2>
                        <form onSubmit={handleAddUser} style={{ display: "grid", gap: "20px" }}>
                            <input
                                type="text"
                                placeholder="Name"
                                value={newUser.name}
                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                required
                                style={{ padding: "20px", borderRadius: "20px", border: "3px solid #104436", width: "95%", fontFamily: "Red Hat Display" }}
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                required
                                style={{ padding: "20px", borderRadius: "20px", border: "3px solid #104436", width: "95%", fontFamily: "Red Hat Display" }}
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                required
                                style={{ padding: "20px", borderRadius: "20px", border: "3px solid #104436", width: "95%", fontFamily: "Red Hat Display" }}
                            />
                            <select
                                value={newUser.role}
                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                style={{ padding: "20px", borderRadius: "20px", border: "3px solid #104436", width: "103%", fontFamily: "Red Hat Display", fontSize: "16px", backgroundColor: "#104436", color: "white" }}
                            >
                                <option value="Client">Client</option>
                                <option value="Admin">Admin</option>
                            </select>
                            <button
                                type="submit"
                                style={{
                                    padding: "20px",
                                    backgroundColor: "#104436",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "20px",
                                    cursor: "pointer",
                                    fontFamily: "Inria Serif",
                                    fontSize: "16px",
                                    transition: "background-color 0.3s ease",
                                    width: "103%",
                                }}
                                onMouseOver={(e) => (e.target.style.backgroundColor = "#256a57")}
                                onMouseOut={(e) => (e.target.style.backgroundColor = "#104436")}
                            >
                                {loading ? "Processing..." : "Add User"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editUser && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 1000,
                }}>
                    <div style={{
                        backgroundColor: "#fff",
                        padding: "20px",
                        borderRadius: "12px",
                        width: "90%",
                        border: "3px solid #104436",
                        maxWidth: "600px",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                        position: "relative",
                    }}>
                        <button
                            onClick={() => setEditUser(null)}
                            style={{
                                position: "absolute",
                                top: "10px",
                                right: "10px",
                                backgroundColor: "transparent",
                                border: "none",
                                fontSize: "20px",
                                cursor: "pointer",
                                color: "#104436",
                            }}
                        >
                            ×
                        </button>

                        <h2 style={{ fontFamily: "Inria Serif", textAlign: "center", color: "#104436", fontSize: "30px", marginBottom: "20px" }}>
                            Edit User
                        </h2>
                        <form onSubmit={handleUpdateUser} style={{ display: "grid", gap: "20px", paddingRight: "30px",}}>
                            <input
                                type="text"
                                placeholder="Name"
                                value={editUser.name}
                                onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                                required
                                style={{ padding: "20px", borderRadius: "20px", border: "3px solid #104436", width: "95%", fontFamily: "Red Hat Display" }}
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={editUser.email}
                                onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                                required
                                style={{ padding: "20px", borderRadius: "20px", border: "3px solid #104436", width: "95%", fontFamily: "Red Hat Display" }}
                            />
                            <button
                                type="submit"
                                style={{
                                    padding: "20px",
                                    backgroundColor: "#104436",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "20px",
                                    cursor: "pointer",
                                    fontFamily: "Inria Serif",
                                    fontSize: "16px",
                                    transition: "background-color 0.3s ease",
                                    width: "103%",
                                }}
                                onMouseOver={(e) => (e.target.style.backgroundColor = "#256a57")}
                                onMouseOut={(e) => (e.target.style.backgroundColor = "#104436")}
                            >
                                {loading ? "Processing..." : "Update User"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* User List */}
            <div style={{ marginTop: "40px", marginBottom: "50px" }}>
                {allUsers && allUsers.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                        {allUsers.map((user) => (
                            <div
                                key={user.id}
                                style={{
                                    border: "3px solid #104436",
                                    borderRadius: "10px",
                                    padding: "20px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "20px",
                                    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
                                    backgroundColor: "#F1EDE5",
                                    borderBottomWidth: "10px",
                                    borderRightWidth: "10px",
                                }}
                            >
                                <p style={{ fontFamily: "Inria Serif", color: "#104436", fontSize: "20px", marginBottom: "10px" }}>{user.name}</p>
                                <p style={{ fontFamily: "Red Hat Display", color: "#333" }}>{user.email}</p>
                                <p style={{ fontFamily: "Red Hat Display", color: "#333" }}>Role: {user.role}</p>
                                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        style={{
                                            padding: "10px 20px",
                                            backgroundColor: "#ff4d4d",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "20px",
                                            cursor: "pointer",
                                            fontFamily: "Red Hat Display",
                                            transition: "background-color 0.3s ease",
                                        }}
                                        onMouseOver={(e) => (e.target.style.backgroundColor = "#cc0000")}
                                        onMouseOut={(e) => (e.target.style.backgroundColor = "#ff4d4d")}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => setEditUser(user)}
                                        style={{
                                            padding: "10px 20px",
                                            backgroundColor: "#104436",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "20px",
                                            cursor: "pointer",
                                            fontFamily: "Red Hat Display",
                                            transition: "background-color 0.3s ease",
                                        }}
                                        onMouseOver={(e) => (e.target.style.backgroundColor = "#256a57")}
                                        onMouseOut={(e) => (e.target.style.backgroundColor = "#104436")}
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ textAlign: "center", fontFamily: "Inria Serif", color: "#104436" }}>No users available.</p>
                )}
            </div>
        </div>
    );
};

export default ManageUsers;