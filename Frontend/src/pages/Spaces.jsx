import { useContext, useEffect, useState } from "react";
import { SpaceContext } from "../context/SpaceContext";
import { UserContext } from "../context/UserContext";
import { X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../src/space.css";

const Spaces = () => {
    const {
        spaces,
        fetchSpaces,
        createBooking,
        updateSpaceAvailability,
        loading: spacesLoading,
        error: spacesError,
    } = useContext(SpaceContext);
    const { current_user } = useContext(UserContext);

    const [duration, setDuration] = useState(1);
    const [unit, setUnit] = useState("hour");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [selectedSpace, setSelectedSpace] = useState(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

    // Fetch spaces on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                await fetchSpaces();
            } catch (err) {
                console.error("Error fetching spaces:", err);
                toast.error("Failed to fetch spaces. Please try again.");
            }
        };
        fetchData();
    }, [fetchSpaces]);

    // Calculate total price based on duration and unit
    const calculateTotalPrice = (space) => {
        return unit === "hour" ? space.price_per_hour * duration : space.price_per_day * duration;
    };

    // Open booking modal only if the space is available
    const openBookingModal = (space) => {
        if (space.availability === "true") {
            setSelectedSpace(space);
            setIsBookingModalOpen(true);
        } else {
            toast.error("This space is already booked and cannot be reserved.");
        }
    };

    // Handle "Book Now" button click (books the space immediately)
    const handleBookNow = async () => {
        if (!selectedSpace) {
            toast.error("Please select a space.");
            return;
        }

        const totalCost = calculateTotalPrice(selectedSpace);

        // Format start_time and end_time without milliseconds
        const startTime = new Date().toISOString().split(".")[0] + "Z";
        const endTime = new Date(Date.now() + duration * (unit === "hour" ? 3600000 : 86400000))
            .toISOString()
            .split(".")[0] + "Z";

        const bookingData = {
            user_id: current_user.id,
            space_id: selectedSpace.id,
            start_time: startTime,
            end_time: endTime,
            total_amount: totalCost,
        };

        console.log("Booking Payload:", bookingData); // Log the payload

        try {
            await createBooking(selectedSpace.id, bookingData);
            setIsBookingModalOpen(false);
            setIsPaymentModalOpen(true); // Open payment modal
            toast.success("Booking created successfully! Proceed to payment simulation.");
        } catch (error) {
            console.error("Booking failed:", error);
            toast.error("Failed to create booking. Please try again.");
        }
    };

    // Simulate payment process
    const handlePayment = async () => {
        if (!phoneNumber.match(/^2547[0-9]{8}$/)) {
            toast.error("Enter a valid M-Pesa number (2547XXXXXXXX format).");
            return;
        }

        if (!agreedToTerms) {
            toast.warning("You must agree to the terms before proceeding with the payment.");
            return;
        }

        setIsPaymentProcessing(true);

        try {
            toast.loading("Simulating payment...");

            // Simulate STK push with a 3-second delay
            setTimeout(() => {
                toast.success("Payment simulation successful! Booking confirmed.");
                setIsPaymentModalOpen(false);
                setPhoneNumber("");
                setAgreedToTerms(false);

                // Update space availability to "Booked"
                updateSpaceAvailability(selectedSpace.id, false);

                // Fetch updated spaces
                fetchSpaces();
            }, 3000); // Simulate a 3-second delay for the STK push
        } catch (error) {
            toast.error("Failed to simulate payment. Please try again.");
            console.error("Error during payment simulation:", error);
        } finally {
            setIsPaymentProcessing(false);
            toast.dismiss(); // Dismiss loading toast
        }
    };

    // Automatically update space availability after booking end time
    useEffect(() => {
        const checkBookingEndTimes = async () => {
            const now = new Date();
            let updatesNeeded = false;

            const updatedSpaces = spaces.map((space) => {
                if (space.availability === "false") {
                    const booking = space.bookings?.find((b) => new Date(b.end_time) > now);
                    if (!booking) {
                        updatesNeeded = true;
                        return { ...space, availability: "true" };
                    }
                }
                return space;
            });

            if (updatesNeeded) {
                await fetchSpaces();
            }
        };

        const interval = setInterval(checkBookingEndTimes, 60000);
        return () => clearInterval(interval);
    }, [spaces, fetchSpaces]);

    return (
        <div className="container-center" style={{ minHeight: "100vh", minWidth: "1400px" }}>
            <h2 className="title">Available Spaces</h2>

            {spacesLoading && <p className="text-muted">Loading spaces...</p>}
            {spacesError && <p className="text-error">{spacesError}</p>}
            {!spacesLoading && !spacesError && spaces.length === 0 && (
                <p className="text-muted">No spaces available.</p>
            )}

            <div className="grid-container">
                {spaces.map((space) => (
                    <div
                        key={space.id}
                        className={`card ksh ${space.availability === "true" ? "cursor-pointer" : "cursor-not-allowed"}`}
                        onClick={() => space.availability === "true" && openBookingModal(space)}
                    >
                        <img
                            src={space.images || "https://source.unsplash.com/400x300/?office,workspace"}
                            alt={space.name || "Space"}
                            className="card-image"
                        />
                        <div className="card-content">
                            <h3 className="card-title">{space.name || "Unnamed Space"}</h3>
                            <p><strong>Location:</strong> {space.location || "Unknown"}</p>
                            <p><strong>Price per Day:</strong> ksh {space.price_per_day || 0}</p>
                            <p className={`text-ksh ${space.availability === "true" ? "success" : "error"}`}>
                                <strong>Availability:</strong> {space.availability === "true" ? "Available" : "Booked"}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Booking Modal */}
            {isBookingModalOpen && selectedSpace && (
                <div className="modal-overlay">
                    <div className="modal">
                        <button className="modal-close" onClick={() => setIsBookingModalOpen(false)} aria-label="Close Modal">
                            <X size={24} />
                        </button>

                        <h5><strong>{selectedSpace.name}</strong></h5>
                        <p><strong>Location:</strong> {selectedSpace.location}</p>
                        <p><strong>Price per Hour:</strong> ksh{selectedSpace.price_per_hour}</p>
                        <p><strong>Price per Day:</strong> ksh{selectedSpace.price_per_day}</p>

                        <div className="label-modal">
                            <label>Duration</label>
                            <label>Unit</label>
                        </div>

                        <div className="modal-label">
                            <input
                                type="number"
                                min="1"
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                className="input"
                            />
                            <select
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                className="input"
                            >
                                <option value="hour">Hours</option>
                                <option value="day">Days</option>
                            </select>
                        </div>

                        <p className="total-price"><strong>Total Price:</strong> ksh{calculateTotalPrice(selectedSpace)}</p>
                        <button onClick={handleBookNow} className="btn-green">
                            Book Now
                        </button>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {isPaymentModalOpen && selectedSpace && (
                <div className="modal-overlay">
                    <div className="modal">
                        <button
                            className="modal-close"
                            onClick={() => setIsPaymentModalOpen(false)}
                            aria-label="Close Modal"
                        >
                            <X size={24} />
                        </button>

                        <h3 className="modal-title">Pay for: {selectedSpace.name}</h3>
                        <p><strong>Total Amount:</strong> ksh{calculateTotalPrice(selectedSpace)}</p>

                        <label>Phone Number:</label>
                        <input
                            type="text"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="input"
                            placeholder="Enter M-Pesa number"
                        />

                        <div className="terms-checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                />
                                I agree to the terms{" "}
                                <span
                                    className="terms-link"
                                    onClick={() => setIsTermsModalOpen(true)}
                                >
                                    (view terms)
                                </span>
                                .
                            </label>
                        </div>

                        <button
                            onClick={handlePayment}
                            className="btn-green"
                            disabled={isPaymentProcessing || !agreedToTerms}
                        >
                            {isPaymentProcessing ? "Processing..." : "Simulate Payment"}
                        </button>
                    </div>
                </div>
            )}

            {/* Terms and Conditions Modal */}
            {isTermsModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <button
                            className="modal-close"
                            onClick={() => setIsTermsModalOpen(false)}
                            aria-label="Close Modal"
                        >
                            <X size={24} />
                        </button>

                        <h3 className="modal-title">Terms and Conditions</h3>
                        <div className="terms-content">
                            <p>
                                By proceeding with this booking, you agree to the following terms and conditions:
                            </p>
                            <ol>
                                <li>You are responsible for ensuring that the provided information is accurate.</li>
                                <li>Payments are non-refundable once the booking is confirmed.</li>
                                <li>The space must be used responsibly, and any damages will be charged to the user.</li>
                                <li>The booking duration must be adhered to strictly. Extensions may incur additional charges.</li>
                                <li>The management reserves the right to cancel bookings in case of emergencies.</li>
                                <p style={{ color: "red" }}>DISCLAIMER: Once booked, it cannot be refunded.</p>
                            </ol>
                            <p>If you have any questions, please contact support before proceeding.</p>
                        </div>

                        <button
                            onClick={() => setIsTermsModalOpen(false)}
                            className="btn-green"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
};

export default Spaces;