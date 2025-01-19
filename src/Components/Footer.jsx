import React from 'react';
import './css/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Lottery-DAO</h3>
          <p>Decentralized lottery platform powered by blockchain technology.</p>
          <div className="social-links">
            
            <a href="https://x.com/avax?lang=en&mx=2" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a href="https://github.com/Avalanche-Team1-DAO-Kenya" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
        
       
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Lottery-DAO. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;