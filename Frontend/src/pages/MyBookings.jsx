import React, { useContext, useEffect, useState } from "react";
import { BookingContext } from "../context/BookingContext";
import { toast } from "react-toastify";

const MyBookings = () => {
    const { bookings, fetchUserBookings } = useContext(BookingContext);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch user bookings on component mount
    useEffect(() => {
        const loadBookings = async () => {
            try {
                await fetchUserBookings();
            } catch (error) {
                console.error("Error loading bookings:", error);
                setError("Failed to load bookings. Please try again later.");
                toast.error("Failed to load bookings.");
            } finally {
                setLoading(false);
            }
        };

        loadBookings();
    }, [fetchUserBookings]);

    if (loading) {
        return <div style={{ textAlign: "center", marginTop: "20px", fontSize: "18px" }}>Loading bookings...</div>;
    }

    if (error) {
        return <div style={{ textAlign: "center", marginTop: "20px", color: "red", fontSize: "18px" }}>{error}</div>;
    }

    return (
        <div style={{ padding: "20px", minHeight: "100vh", }}>
            <h1 style={{ textAlign: "center", color: "#104436", marginBottom: "60px", fontFamily: "Inria Serif", fontSize: "40px" }}>
                My Bookings
            </h1>
            {bookings.length === 0 ? (
                <p style={{ textAlign: "center", fontSize: "16px", color: "#666", fontFamily: "Red Hat Display" }}>No bookings found.</p>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={{ border: "1px solid #ddd", padding: "20px", backgroundColor: "#104436", color: "white", textAlign: "left", fontFamily: "Inria Serif", }}>Space Name</th>
                            <th style={{ border: "1px solid #ddd", padding: "20px", backgroundColor: "#104436", color: "white", textAlign: "left", fontFamily: "Inria Serif",}}>Status</th>
                            <th style={{ border: "1px solid #ddd", padding: "20px", backgroundColor: "#104436", color: "white", textAlign: "left", fontFamily: "Inria Serif", }}>Start Time</th>
                            <th style={{ border: "1px solid #ddd", padding: "20px", backgroundColor: "#104436", color: "white", textAlign: "left" , fontFamily: "Inria Serif",}}>End Time</th>
                            <th style={{ border: "1px solid #ddd", padding: "20px", backgroundColor: "#104436", color: "white", textAlign: "left", fontFamily: "Inria Serif", }}>Total Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking) => (
                            <tr key={booking.id}>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                    {booking.space_name || "No space name available"}
                                </td>
                                <td style={{ border: "1px solid #ddd", padding: "20px" }}>{booking.status}</td>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                    {new Date(booking.start_time).toLocaleString()}
                                </td>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                    {new Date(booking.end_time).toLocaleString()}
                                </td>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>${booking.total_amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default MyBookings;
