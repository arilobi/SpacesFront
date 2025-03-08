import { createContext, useState, useCallback, useContext } from "react";
import { toast } from "react-toastify";
import { BookingContext } from "./BookingContext"; 
import { SpaceContext } from "./SpaceContext"; 

export const PaymentsContext = createContext();

export const PaymentsProvider = ({ children }) => {
    const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
    const { fetchBookings } = useContext(BookingContext);
    const { fetchSpaces } = useContext(SpaceContext);

const stkPush = useCallback(async (phoneNumber, amount, bookingId) => {
    setIsPaymentProcessing(true);
    try {
        const payload = {
            phone_number: Number(phoneNumber),
            amount: amount,
            booking_id: bookingId,
            user_id: sessionStorage.getItem("user_id"), 
        };

        const response = await fetch("http://127.0.0.1:5000/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error("Failed to initiate STK push.");
        }

        const data = await response.json();
        toast.success("M-Pesa STK Push request sent! Approve the prompt.");
        return data;
    } catch (error) {
        toast.error(" STK Push Failed.");
        console.error("STK Push Error:", error);
        throw error;
    } finally {
        setIsPaymentProcessing(false);
    }
}, []);


const checkPaymentStatus = useCallback(async (transactionId) => {
    try {
        const response = await fetch(`http://127.0.0.1:5000/payments/${transactionId}`);
        if (!response.ok) throw new Error("Failed to fetch payment status.");
        
        const data = await response.json();
        return data.status;
    } catch (error) {
        console.error("Error checking payment status:", error);
        throw error;
    }
}, []);


    // Delete Payment & Update Bookings
    const deletePayment = async (id) => {
        try {
            const token = sessionStorage.getItem("token");

            if (!token) {
                toast.error("You must be logged in to delete a payment.");
                return;
            }

            console.log("JWT Token being sent:", token); // Debugging

            const response = await fetch(`http://127.0.0.1:5000/payments/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
            });

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error("Unauthorized! Your session might have expired. Please log in again.");
                    return;
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            toast.success(" Payment deleted successfully!", { autoClose: 1000 });

            //  After deletion, refresh bookings & spaces
            fetchBookings();
            fetchSpaces();
        } catch (error) {
            console.error("Error deleting payment:", error);
            toast.error(` ${error.message}`, { autoClose: 1000 });
        }
    };

    return (
        <PaymentsContext.Provider value={{ stkPush, checkPaymentStatus, isPaymentProcessing, setIsPaymentProcessing, deletePayment }}>
            {children}
        </PaymentsContext.Provider>
    );
};
