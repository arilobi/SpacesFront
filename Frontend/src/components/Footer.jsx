import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // ---> import for FontAwesomeIcon
import { faInstagram, faTiktok, faFacebook } from '@fortawesome/free-brands-svg-icons'; // ---> import the icons
import logoPhoto from '../assets/logoPhoto.png'
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <div className="footer">
      <img src={logoPhoto} alt="Logo" />
      <div className="header">
         <p><Link to="/About">About Us</Link></p>
      </div>
      <div className="para-graph">
        <p>Come as a guest, leave as a friend</p>
      </div>
      <br />
      {/* For the icons. I installed them */}
      <div className="social-icons">
        <a href="https://tiktok.com/yourprofile" target="_blank" rel="noopener noreferrer">
          <FontAwesomeIcon icon={faTiktok} size="2x" />
        </a>
        <a href="https://instagram.com/yourprofile" target="_blank" rel="noopener noreferrer">
          <FontAwesomeIcon icon={faInstagram} size="2x" />
        </a>
        <a href="https://facebook.com/yourprofile" target="_blank" rel="noopener noreferrer">
          <FontAwesomeIcon icon={faFacebook} size="2x" />
        </a>
      </div>
    </div>
  );
}