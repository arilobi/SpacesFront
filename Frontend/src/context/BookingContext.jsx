import { createContext, useCallback, useState, useContext } from "react";
import { toast } from "react-toastify";
import { SpaceContext } from "./SpaceContext"; // Import SpaceContext

export const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
    const [bookings, setBookings] = useState([]);
    const { fetchSpaces } = useContext(SpaceContext); // Use SpaceContext

    //! Create a new booking
    const createBooking = async (bookingData) => {
        const toastId = toast.loading("⏳ Creating booking...");
        try {
            console.log("Booking Data:", bookingData); // Log the payload
    
            const response = await fetch("http://127.0.0.1:5000/bookings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(bookingData),
            });
    
            if (!response.ok) {
                const errorData = await response.json(); // Log the server's error response
                console.error("Server Error:", errorData);
                throw new Error("Failed to create booking.");
            }
    
            const data = await response.json();
            toast.update(toastId, {
                render: "Booking created successfully! Proceed to payment.",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });
            return data; // Return the booking data, including the booking ID
        } catch (error) {
            toast.update(toastId, {
                render: `🚨 ${error.message}`,
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            throw error;
        }
    };


    //! Fetch all bookings
    const fetchBookings = useCallback(async () => {
        try {
            const response = await fetch("http://127.0.0.1:5000/bookings", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) throw new Error("Failed to fetch bookings.");

            const data = await response.json();
            setBookings(data.bookings || []); // Ensure it’s always an array
            return data;
        } catch (error) {
            console.error("Fetch Bookings Error:", error);
            setBookings([]); // Prevent setting bookings to null
            throw error;
        }
    }, []);

// Fetch the current user's bookings
const fetchUserBookings = useCallback(async () => {
    try {
        const token = sessionStorage.getItem("token");
        if (!token) {
            console.error("User is not authenticated. Token is missing.");
            toast.error("User is not authenticated.");
            return;
        }

        const response = await fetch("http://127.0.0.1:5000/my-bookings", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) throw new Error("Failed to fetch user bookings.");

        const data = await response.json();
        setBookings(data.bookings || []); // Ensure it's always an array
    } catch (error) {
        toast.error(" Failed to fetch user bookings. Please try again.");
        console.error("Fetch User Bookings Error:", error);
        setBookings([]); // Clear bookings on error
    }
}, []);

    // Delete a booking
    const deleteBooking = async (id) => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/bookings/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error("Unauthorized! Please log in again.");
                    return;
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            toast.success("Booking deleted successfully!", { autoClose: 1000 });

            fetchBookings(); // Refetch bookings from the backend
            fetchSpaces(); // Update spaces after booking deletion
        } catch (error) {
            console.error("Error deleting booking:", error);
            toast.error(` ${error.message}`, { autoClose: 1000 });
        }
    };

      // Fetch all bookings (for admin)
      const fetchAllBookings = useCallback(async () => {
        try {
            const token = sessionStorage.getItem("token");
            if (!token) {
                console.error("User is not authenticated. Token is missing.");
                toast.error(" User is not authenticated.");
                return;
            }

            const response = await fetch("http://127.0.0.1:5000/bookings", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Failed to fetch all bookings.");

            const data = await response.json();
            setBookings(data || []); // Ensure it's always an array
        } catch (error) {
            toast.error(" Failed to fetch all bookings. Please try again.");
            console.error("Fetch All Bookings Error:", error);
            setBookings([]); // Clear bookings on error
        }
    }, []);

    return (
        <BookingContext.Provider
            value={{
                bookings,
                createBooking,
                fetchBookings,
                fetchUserBookings,
                deleteBooking,
                fetchAllBookings
            }}
        >
            {children}
        </BookingContext.Provider>
    );
};