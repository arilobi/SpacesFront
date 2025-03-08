import React from "react";
import SpaceCover from "../assets/SpaceCover.png";
import homesweethome from "../assets/homesweethome.png";
import { Link } from "react-router-dom";

export default function HomeSweetHome() {
    return (
        <div className="single-space">
            <img src={SpaceCover} alt="A photo of a dining room" className="normal-image" />

            <h3>HOME SWEET HOME</h3>
            {/* Contact info */}
            <div className="single-container">
                <img src={homesweethome} alt="A photo of a dining room" className="normal-image" />
                <div className="text-third">
                    <div className="paragraph">
                        <p>
                            Ivy Court invites you to create a home with them. We offer rental apartments ranging from 1 bedroom to 5 bedrooms. Not only that but we have town houses where you can grow a family with a minimum of 3 and a maximum of 5 bedrooms. 
                            <br /><br />
                            Renting our houses comes with many anemities such as a swimming pool, gym and a spa to relax after a busy day of activies. 
                            <br /><br />
                            Do you want to make Ivy Court your home? <Link to="/about">Feel free to contact us.</Link>

                        </p>
                        <br />
                    </div>
                </div>
            </div>
        </div>
    );
}
