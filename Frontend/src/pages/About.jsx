import React from "react";
import aboutPhoto from "../assets/aboutPhoto.png"
import sndPhoto from "../assets/sndPhoto.png"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // ---> import for FontAwesomeIcon
import { faLocationDot, faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';

const faqData = [
  {
    question: 'What is your refund policy?',
    answer: ' Currently, we do not offer any refunds because it is a one time payment. However, we ensure to share our terms and conditions that you will find when finalizing your payment process before you decide to book a space.'
  },
  {
    question: 'Can I buy a space?',
    answer: 'Unfortunately, one cannot buy a space from Ivy Court because Ivy Court was created to be affordable, reachable and reused. However, you can rent for as long as you want because this is a free space where you can explore yourself and what you can offer the world.'
  },
  {
    question: 'How long can I book a space?',
    answer: 'You can book for as long as you want because we also offer rental apartments.'
  }
];

const FAQAccordion = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleAccordion = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div style={{ margin: '60px', fontFamily: 'Red Hat Display', }}>
        
      {faqData.map((faq, index) => (
        <div key={index} style={{ border: '1px solid #ddd', borderRadius: '50px', padding: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '10px', borderBottomColor:'#104436', borderBottomWidth: '10px', borderStyle: 'solid', borderColor: '#104436'}}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600' }}>{faq.question}</h2>
            <button onClick={() => toggleAccordion(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', marginLeft: '10px' }}>
              {expandedIndex === index ? '-' : '+'}
            </button>
          </div>
          {expandedIndex === index && (
            <div style={{ marginTop: '10px', fontSize: '18px' }}>
              <p>{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default function About(){
    
        
    return (
        <div className="about">
            <img src={aboutPhoto} alt="About photo" />

            <div class="about-container">
                <div class="text">
                    <h3>About Us</h3>
                    <div class="paragraph">
                        <p>Ivy Court was created to help you make your dreams come true. We offer spaces to help you create something unique that resonates with your style and personal taste. All of our spaces can be used for anything you would like whether it's a restaurant, bar, store, gym e.t.c. <br></br><br></br>We also offer apartments to rent and stay for as long as you like. Interested in working with us? Contact us below.
                        </p>
                    </div>
                </div>

                <h3 style={{ fontSize: '50px', fontFamily: 'Red Hat Display', color: '#104436', fontWeight: '500', marginLeft: '60px'}}>FAQ's</h3>
                <FAQAccordion />

                {/* Contact info */}
                <div class="third-container">
                    <div class="text-third">
                        <h3>Get in Touch</h3>
                        <div class="paragraph">
                            <p>Don't leave just yet! Feel free to connect with us for the latest updates.</p>
                        </div>
                        <div class="icons">
                            <p>
                                <FontAwesomeIcon icon={faLocationDot} size="2x" />
                                1111, Kilimani</p>
                            <p>
                                <FontAwesomeIcon icon={faEnvelope} size="2x" />
                                ivycourt@gmail.com</p>
                            <p>
                                <FontAwesomeIcon icon={faPhone} size="2x" />
                                +254 012 345 67</p>
                        </div>
                    </div>
                    <img src={sndPhoto} alt="A photo of a dining room" className="normal-image"/>
                </div>
            </div>
        </div>
    )
}
