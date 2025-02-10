import React from 'react';
import './css/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Avalot</h3>
          <p>Decentralized lottery platform powered by blockchain technology.</p>
          <div className="social-links">
            {/* <a href="https://discord.com" target="_blank" rel="noopener noreferrer">Discord</a> */}
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a href="https://github.com/Avalanche-Team1-DAO-Kenya" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
        
        {/* <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/faq">FAQ</a></li>
            <li><a href="/terms">Terms</a></li>
            <li><a href="/privacy">Privacy</a></li>
          </ul>
        </div> */}
        
        {/* <div className="footer-section">
          <h4>Resources</h4>
          <ul>
            <li><a href="/docs">Documentation</a></li>
            <li><a href="/support">Support</a></li>
            <li><a href="/about">About</a></li>
          </ul>
        </div> */}
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Lottery-DAO. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;