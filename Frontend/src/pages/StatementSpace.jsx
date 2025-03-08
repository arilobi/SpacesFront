import React from "react";
import SpaceCover from "../assets/SpaceCover.png";
import barCollage from "../assets/barCollage.png";
import { Link } from "react-router-dom";

export default function StatementSpace() {
    return (
        <div className="single-space">
            <img src={SpaceCover} alt="A photo of a dining room" className="normal-image" />

            <h3>STATEMENT SPACE</h3>
            {/* Contact info */}
            <div className="single-container">
                <img src={barCollage} alt="A photo of a dining room" className="normal-image" />
                <div className="text-third">
                    <div className="paragraph">
                        <p>
                            Situated in Ivy Courts, this space was mostly created with a vision of making it a restaurant, bar
                            or a clothing store. However, this space can also be used as a storing unit, a spa or a gymnasium.
                            <br /><br />
                            This statement space is perfect to be a hot business spot that can draw attention to the public eye if they would like to unwind and socialize.
                            <br /><br />
                            Would you consider renting this space to make your dreams come true? <Link to="/about">Feel free to contact us.</Link>
                        </p>
                        <br />
                    </div>
                </div>
            </div>
        </div>
    );
}
