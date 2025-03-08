import React, { useEffect, useRef } from "react";
import MainHeader from "../assets/MainHeader.png";
import secondPhoto from "../assets/secondPhoto.png";
import office from "../assets/office.png";
import restaurantPhoto from "../assets/restaurantPhoto.png";
import apartmentsPhoto from "../assets/apartmentsPhoto.png";
import contactPhoto from "../assets/contactPhoto.png";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import { faLocationDot, faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';

export default function Home() {
    const elementsRef = useRef([]); // Initialize as an empty array

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("show");
                    } else {
                        entry.target.classList.remove("show");
                    }
                });
            },
            {
                threshold: 0.1, // trigger when 10% of the element is in view
            }
        );

        // Filter out invalid elements (e.g., null) and observe each valid element
        elementsRef.current.forEach((el) => el && observer.observe(el));

        // Cleanup observer
        return () => {
            elementsRef.current.forEach((el) => el && observer.unobserve(el));
        };
    }, []);

    return (
        <div className="home">
            <img src={MainHeader} alt="Photo of a dining room" />

            <div className="first-container fade-up" ref={(el) => { if (el) elementsRef.current.push(el); }}>
                <img src={secondPhoto} alt="A collage of photos" className="normal-image" />

                <div className="text">
                    <h4>WELCOME TO IVY COURT</h4>
                    <h3>Property leased to<br />your jurisdiction</h3>
                    <div className="paragraph">
                        <p>
                            Ivy Court was created to help you make your 
                            dreams come true. Whether it is opening 
                            a restaurant, renting an apartment, hauling a 
                            shop, or starting a new office.
                        </p>
                    </div>
                </div>
            </div>

            <div className="second-container fade-up" ref={(el) => { if (el) elementsRef.current.push(el); }}>
                <p>VIEW ALL PROPERTIES</p>
                <h3>There’s no place like Ivy Court</h3>
                <div className="product-grid">
                    <div className="product-item fade-up" ref={(el) => { if (el) elementsRef.current.push(el); }}>
                        <img src={apartmentsPhoto} alt="Photo of apartments" className="normal-image" />
                        <Link to="/HomeSweetHome">HOME SWEET HOME</Link>
                    </div>
                    <div className="product-item fade-up" ref={(el) => { if (el) elementsRef.current.push(el); }}>
                        <img src={restaurantPhoto} alt="Restaurant Photo" />
                        <Link to="/StatementSpace">STATEMENT PLACE</Link>
                    </div>
                    <div className="product-item fade-up" ref={(el) => { if (el) elementsRef.current.push(el); }}>
                        <img src={office} alt="Photo of an office" />
                        <Link to="/Business">BUSINESS VENTURES</Link>
                    </div>
                </div>

                <div className="third-container fade-up" ref={(el) => { if (el) elementsRef.current.push(el); }}>
                    <div className="text-third">
                        <h4>CONTACT</h4>
                        <h3>Get in Touch</h3>
                        <div className="paragraph">
                            <p>Don’t leave just yet! Feel free to connect with us for the latest updates.</p>
                        </div>
                        <div className="icons">
                            <p> 
                                <FontAwesomeIcon icon={faLocationDot} size="2x" />
                                1111, Kilimani
                            </p>
                            <p>
                                <FontAwesomeIcon icon={faEnvelope} size="2x" />
                                ivycourt@gmail.com
                            </p>
                            <p> 
                                <FontAwesomeIcon icon={faPhone} size="2x" />
                                +254 012 345 67
                            </p>
                        </div>
                    </div>
                    <img src={contactPhoto} alt="A photo of a dining room" className="normal-image"/>
                </div>
            </div>
        </div>
    );
}
