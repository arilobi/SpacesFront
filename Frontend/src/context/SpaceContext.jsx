import { createContext, useState, useEffect, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
// 
export const SpaceContext = createContext();

export const SpaceProvider = ({ children }) => {
    const navigate = useNavigate();
    const [authToken, setAuthToken] = useState(() => sessionStorage.getItem("token"));
    const [spaces, setSpaces] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Fetch Spaces
    const fetchSpaces = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch("http://127.0.0.1:5000/spaces", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            console.log("Fetched spaces:", data); // Debugging

            if (Array.isArray(data.spaces)) {
                setSpaces(data.spaces); // Ensure it's always an array
            } else {
                setSpaces([]); // Prevent "map is not a function" error
            }
        } catch (error) {
            console.error("Error fetching spaces:", error);
            setError(`Error fetching spaces: ${error.message}`);
            setSpaces([]); // Ensure spaces is always an array
        } finally {
            setLoading(false);
        }
    }, []);

    // Create Space
    const createSpace = async (spaceData) => {
        if (!spaceData.name || !spaceData.description || !spaceData.location) {
            toast.error("All fields are required!");
            return;
        }

        const toastId = toast.loading("Creating space...");
        try {
            const response = await fetch("http://127.0.0.1:5000/spaces", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(spaceData),
            });

            if (!response.ok) throw new Error("Failed to create space.");

            const data = await response.json();
            setSpaces((prev) => [...prev, data]);

            toast.update(toastId, {
                render: "Space created successfully!",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });
        } catch (error) {
            toast.update(toastId, {
                render: `${error.message || "Network error, please try again."}`,
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
        }
    };

    // Update Space
    const updateSpace = async (spaceId, updatedData) => {
        const toastId = toast.loading("Updating space...");
        try {
            const response = await fetch(`http://127.0.0.1:5000/spaces/${spaceId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(updatedData),
            });

            if (!response.ok) throw new Error("Failed to update space.");

            setSpaces((prev) =>
                prev.map((space) => (space.id === spaceId ? { ...space, ...updatedData } : space))
            );

            toast.update(toastId, {
                render: "Space updated successfully!",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });
        } catch (error) {
            toast.update(toastId, {
                render: `${error.message || "Network error, please try again."}`,
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
        }
    };

    // Delete Space
    const deleteSpace = async (spaceId) => {
        if (!authToken) {
            toast.error("You must be logged in to delete a space.");
            return;
        }

        if (!spaceId || isNaN(spaceId)) {
            toast.error("Invalid space ID.");
            return;
        }

        const toastId = toast.loading("Deleting space...");
        try {
            const response = await fetch(`http://127.0.0.1:5000/spaces/${spaceId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    error: "Failed to delete space. Please try again.",
                }));
                throw new Error(errorData.error || "Failed to delete space.");
            }

            setSpaces((prev) => prev.filter((space) => space.id !== parseInt(spaceId)));

            toast.update(toastId, {
                render: "Space deleted successfully!",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });
        } catch (error) {
            toast.update(toastId, {
                render: `${error.message}`,
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
        }
    };

    // Update Space Availability
    const updateSpaceAvailability = async (spaceId, availability) => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/spaces/${spaceId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ availability }),
            });
    
            if (!response.ok) {
                throw new Error("Failed to update space availability.");
            }
    
            await fetchSpaces(); // Refresh spaces after update
        } catch (error) {
            console.error("Error updating space availability:", error);
            throw error;
        }
    };


    // Create Booking (without payment)
    const createBooking = async (spaceId, bookingData) => {
        const toastId = toast.loading("Creating booking...");
        try {
            const response = await fetch("http://127.0.0.1:5000/bookings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ ...bookingData, space_id: spaceId }), // Ensure the correct field name
            });
    
            if (!response.ok) {
                const errorData = await response.json(); // Log the server's error response
                console.error("Server Error:", errorData);
                throw new Error(errorData.error || "Failed to create booking.");
            }
    
            const data = await response.json();
            toast.update(toastId, {
                render: "Booking created successfully! Proceed to payment.",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });
            return data;
        } catch (error) {
            toast.update(toastId, {
                render: `${error.message}`,
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            throw error;
        }
    };

    // Process Payment
    
    const processPayment = async (bookingId, paymentData) => {
        try {
            const payload = {
                phone_number: paymentData.phoneNumber,
                amount: paymentData.amount,
                booking_id: bookingId,
                user_id: sessionStorage.getItem("user_id"), // Include user ID
            };
    
            console.log("Sending payload:", payload); // Log the payload
    
            const response = await fetch("http://127.0.0.1:5000/process-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
    
            if (!response.ok) {
                const errorData = await response.json(); // Parse error response
                console.error("Backend error response:", errorData); // Log the error
                throw new Error(errorData.error || "Failed to process payment.");
            }
    
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Payment processing error:", error);
            throw error;
        }
    };

    // Auto-fetch spaces on mount
    useEffect(() => {
        fetchSpaces();
    }, [fetchSpaces]);

    // Auto-fetch spaces when authToken is available
    useEffect(() => {
        if (authToken) fetchSpaces();
    }, [authToken]);

    return (
        <SpaceContext.Provider
            value={{
                authToken,
                spaces,
                fetchSpaces,
                createSpace,
                updateSpace,
                deleteSpace,
                updateSpaceAvailability,
                createBooking, // Separate booking function
                processPayment, // Separate payment function
                loading,
                isProcessingPayment,
                error,
            }}
        >
            {children}
            <ToastContainer position="top-right" autoClose={3000} className="fixed top-0 right-0 m-4 z-50" />
        </SpaceContext.Provider>
    );
};