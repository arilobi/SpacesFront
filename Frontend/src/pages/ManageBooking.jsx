import React, { useContext, useEffect, useState } from "react";
import { BookingContext } from "../context/BookingContext";
import { toast } from "react-toastify";
// $
const ManageBookings = () => {
    const { bookings, fetchAllBookings, deleteBooking, completePayment } = useContext(BookingContext);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all bookings on component mount
    useEffect(() => {
        const loadBookings = async () => {
            try {
                await fetchAllBookings(); // Fetch all bookings
            } catch (error) {
                console.error("Error loading bookings:", error);
                setError("Failed to load bookings. Please try again later.");
                toast.error(" Failed to load bookings.");
            } finally {
                setLoading(false);
            }
        };

        loadBookings();
    }, [fetchAllBookings]);

    // Handle deleting a booking
    const handleDeleteBooking = async (id) => {
        if (window.confirm("Are you sure you want to delete this booking?")) {
            try {
                await deleteBooking(id);
                toast.success(" Booking deleted successfully!");
            } catch (error) {
                toast.error(" Failed to delete booking.");
            }
        }
    };

    // Handle completing payment for a booking
    const handleCompletePayment = async (id) => {
        if (window.confirm("Are you sure you want to mark this booking as paid?")) {
            try {
                await completePayment(id);
                toast.success(" Payment completed successfully!");
            } catch (error) {
                toast.error(" Failed to complete payment.");
            }
        }
    };

    if (loading) {
        return <div style={{ textAlign: "center", marginTop: "20px", fontSize: "18px" }}>Loading bookings...</div>;
    }

    if (error) {
        return <div style={{ textAlign: "center", marginTop: "20px", color: "red", fontSize: "18px" }}>{error}</div>;
    }

    return (
        <div style={{ padding: "40px", minHeight: "100vh" }}>
            <h1 style={{ textAlign: "center", color: "#104436", marginBottom: "60px", fontFamily: "Inria Serif", fontSize: "40px" }}>Manage Bookings</h1>
            {bookings.length === 0 ? (
                <p style={{ textAlign: "center", fontFamily: "Red Hat Display", fontSize: "16px", color: "#666" }}>No bookings found.</p>
            ) : (
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
                        borderRadius: "8px",
                        overflow: "hidden",
                    }}
                >
                    <thead>
                        <tr style={{ backgroundColor: "#104436", color: "#fff", fontFamily: "Inria Serif" }}>
                            <th style={{ padding: "12px", textAlign: "left" }}>Booking ID</th>
                            <th style={{ padding: "12px", textAlign: "left" }}>User Name</th>
                            <th style={{ padding: "12px", textAlign: "left" }}>Space Name</th>
                            <th style={{ padding: "12px", textAlign: "left" }}>Start Time</th>
                            <th style={{ padding: "12px", textAlign: "left" }}>End Time</th>
                            <th style={{ padding: "12px", textAlign: "left" }}>Total Amount</th>
                            <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
                            <th style={{ padding: "12px", textAlign: "left" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking) => (
                            <tr
                                key={booking.id}
                                style={{
                                    backgroundColor: "#F1EDE5",
                                    borderBottom: "1px solid #ddd",
                                    transition: "background-color 0.3s",
                                }}
                            >
                                <td style={{ padding: "12px", color: "#333" }}>{booking.id}</td>
                                {/* Update user name to use correct field */}
                                <td style={{ padding: "12px", color: "#333" }}>{booking.user_name}</td>
                                {/* Update space name to use correct field */}
                                <td style={{ padding: "12px", color: "#333" }}>{booking.space_name}</td>
                                <td style={{ padding: "12px", color: "#333" }}>
                                    {new Date(booking.start_time).toLocaleString()}
                                </td>
                                <td style={{ padding: "12px", color: "#333" }}>
                                    {new Date(booking.end_time).toLocaleString()}
                                </td>
                                <td style={{ padding: "12px", color: "#333" }}>$. {booking.total_amount}</td>
                                <td style={{ padding: "12px", color: "#333" }}>{booking.status}</td>
                                <td style={{ padding: "12px" }}>
                                    <button
                                        onClick={() => handleDeleteBooking(booking.id)}
                                        style={{
                                            marginLeft: "10px",
                                            padding: "10px 12px",
                                            backgroundColor: "#dc3545",
                                            fontFamily: "Inria Serif",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "4px",
                                            fontSize: "16px",
                                            cursor: "pointer",
                                            transition: "background-color 0.3s",
                                        }}
                                    >
                                        Delete
                                    </button>
                                   
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ManageBookings;
