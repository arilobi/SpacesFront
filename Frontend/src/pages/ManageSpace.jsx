import { useContext, useState, useEffect } from "react";
import { SpaceContext } from "../context/SpaceContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ManageSpace = () => {
    const { spaces, createSpace, updateSpace, deleteSpace, fetchSpaces } = useContext(SpaceContext);
    const [currentSpace, setCurrentSpace] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [spaceForm, setSpaceForm] = useState({
        name: "",
        description: "",
        location: "",
        price_per_hour: "",
        price_per_day: "",
        availability: true,
        images: ""
    });

    useEffect(() => {
        const getSpaces = async () => {
            setLoading(true);
            try {
                await fetchSpaces();
            } catch (error) {
                toast.error("Failed to fetch spaces.");
                console.error("Error fetching spaces:", error);
            } finally {
                setLoading(false);
            }
        };
        getSpaces();
    }, [fetchSpaces]);

    const handleChange = (e) => {
        setSpaceForm({ ...spaceForm, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (currentSpace) {
                await updateSpace(currentSpace.id, spaceForm);
            } else {
                await createSpace(spaceForm);
            }
            resetForm();
            await fetchSpaces();
            setIsModalOpen(false);
        } catch (error) {
            toast.error("Action failed!");
            console.error("Error submitting form:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (space) => {
        setCurrentSpace(space);
        setSpaceForm({
            name: space.name || "",
            description: space.description || "",
            location: space.location || "",
            price_per_hour: space.price_per_hour || "",
            price_per_day: space.price_per_day || "",
            availability: space.availability ?? true,
            images: space.images || ""
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setSpaceForm({
            name: "",
            description: "",
            location: "",
            price_per_hour: "",
            price_per_day: "",
            availability: true,
            images: ""
        });
        setCurrentSpace(null);
    };

    return (
        <div className="manage-space" style={{ padding: "20px", margin: "0 auto", maxWidth: "1400px", minHeight: "100vh", }}>
            {/* Button to open the modal */}
            <button
                onClick={() => {
                    resetForm();
                    setIsModalOpen(true);
                }}
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
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#256a57")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#104436")}
            >
                Create New Space
            </button>

            {/* Modal for the form */}
            {isModalOpen && (
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
                        borderRadius: "12px",
                        width: "90%",
                        border: "3px solid #104436",
                        maxWidth: "600px",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                        position: "relative",
                    }}>
                        {/* "X" button to close the modal */}
                        <button
                            onClick={() => setIsModalOpen(false)}
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
                            {currentSpace ? "Update Space" : "Create New Space"}
                        </h2>
                        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
                            <label style={{ fontFamily: "Inria Serif", fontWeight: "600" }}>Name of the space</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Name of the space"
                                value={spaceForm.name}
                                onChange={handleChange}
                                required
                                style={{ padding: "20px", borderRadius: "20px", border: "3px solid #104436", width: "95%", fontFamily: "Red Hat Display" }}
                            />
                            <label style={{ fontFamily: "Inria Serif", fontWeight: "600" }}>Description</label>
                            <textarea
                                name="description"
                                placeholder="Description"
                                value={spaceForm.description}
                                onChange={handleChange}
                                required
                                style={{ padding: "20px", borderRadius: "20px", border: "3px solid #104436", width: "97%", height: "20vh", fontFamily: "Red Hat Display" }}
                            />
                            <label style={{ fontFamily: "Inria Serif", fontWeight: "600" }}>Add a location</label>
                            <input
                                type="text"
                                name="location"
                                placeholder="Location"
                                value={spaceForm.location}
                                onChange={handleChange}
                                required
                                style={{ padding: "20px", borderRadius: "20px", border: "3px solid #104436", width: "95%", fontFamily: "Red Hat Display" }}
                            />
                            <label style={{ fontFamily: "Inria Serif", fontWeight: "600" }}>Prices</label>
                            <input
                                type="number"
                                name="price_per_hour"
                                placeholder="Price per hour"
                                value={spaceForm.price_per_hour}
                                onChange={handleChange}
                                required
                                style={{ padding: "20px", borderRadius: "20px", border: "3px solid #104436", width: "95%", fontFamily: "Red Hat Display" }}
                            />
                            <input
                                type="number"
                                name="price_per_day"
                                placeholder="Price per day"
                                value={spaceForm.price_per_day}
                                onChange={handleChange}
                                required
                                style={{ padding: "20px", borderRadius: "20px", border: "3px solid #104436", width: "95%", fontFamily: "Red Hat Display" }}
                            />
                            <label style={{ fontFamily: "Inria Serif", fontWeight: "600" }}>Availability</label>
                            <select
                                name="availability"
                                value={spaceForm.availability}
                                onChange={handleChange}
                                required
                                style={{ padding: "20px", borderRadius: "20px", border: "3px solid #104436", width: "103%", fontFamily: "Red Hat Display", fontSize: "16px", backgroundColor: "#104436", color: "white" }}
                            >
                                <option value={true}>Available</option>
                                <option value={false}>Booked</option>
                            </select>
                            <label style={{ fontFamily: "Inria Serif", fontWeight: "600" }}>Add Images</label>
                            <input
                                type="text"
                                name="images"
                                placeholder="Image URLs (comma-separated)"
                                value={spaceForm.images}
                                onChange={handleChange}
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
                                {loading ? "Processing..." : currentSpace ? "Update Space" : "Create Space"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Display spaces */}
            <div style={{ marginTop: "40px", marginBottom: "50px" }}>
                {loading ? (
                    <p>Loading spaces...</p>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                        {spaces.length > 0 ? (
                            spaces.map(space => (
                                <div
                                    key={space.id}
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
                                    }}
                                >
                                    <img
                                        src={space.images}
                                        alt="Space"
                                        style={{ width: "100%", height: "200px", borderRadius: "10px", objectFit: "cover" }}
                                        onError={(e) => { e.target.src = "https://dummyimage.com/400x300/000/fff&text=No+Image"; }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ marginBottom: "10px", fontFamily: "Inria Serif", color: "#104436" }}>{space.name}</h3>
                                        <p style={{ fontFamily: "Red Hat Display", color: "#333" }}>{space.description}</p>
                                        <p style={{ fontFamily: "Red Hat Display", color: "#333" }}><strong>Location:</strong> {space.location}</p>
                                        <p style={{ fontFamily: "Red Hat Display", color: "#333" }}><strong>Price per Hour:</strong> ${space.price_per_hour}</p>
                                        <p style={{ fontFamily: "Red Hat Display", color: "#333" }}><strong>Price per Day:</strong> ${space.price_per_day}</p>
                                        <p style={{ fontFamily: "Red Hat Display", color: "#333" }}><strong>Availability:</strong> {space.availability ? "Available" : "Booked"}</p>
                                        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                            <button
                                                onClick={() => deleteSpace(space.id)}
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
                                                onClick={() => handleEdit(space)}
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
                                                Update
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No spaces available.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageSpace;
