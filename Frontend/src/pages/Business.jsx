import React from "react";
import SpaceCover from "../assets/SpaceCover.png";
import businessventures from "../assets/businessventures.png";
import { Link } from "react-router-dom";

export default function Business() {
    return (
        <div className="single-space">
            <img src={SpaceCover} alt="A photo of a dining room" className="normal-image" />

            <h3>BUSINESS VENTURES</h3>
            {/* Contact info */}
            <div className="single-container">
                <img src={businessventures} alt="A photo of a dining room" className="normal-image" />
                <div className="text-third">
                    <div className="paragraph">
                        <p>
                            Starting a business? Not sure where to begin?
                            <br />
                            <br />
                            Don't worry! Ivy Courts offer spaces where you can either hold your meetings, store your products or use it an office. 
                            <br /><br />
                            This space is perfect because it offers security, privacy and most important, a quiet environment to work in. The spaces dedicated to this sort of work is far enough from any noisy areas such as apartments and amenities to help you focus. 
                            <br /><br />
                            Would you like to make Ivy Court your first office rent out? <Link to="/about">Feel free to contact us.</Link>

                        </p>
                        <br />
                    </div>
                </div>
            </div>
        </div>
    );
}
