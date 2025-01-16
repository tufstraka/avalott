import React from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Home.css';
// import JackpotCounter from '../components/JackpotCounter';
// import WinnersList from '../components/WinnersList';
// import HowToPlay from '../components/HowToPlay';

const Home = () => {
  const navigate = useNavigate();
  
  return (
    <div className="home-container">
      <section className="hero-section">
        <h1>Dream Bigger with Every Ticket</h1>
        <p className="hero-subtitle">Join millions of players and get a chance to win life-changing prizes</p>
        {/* <JackpotCounter /> */}
        <button 
          className="cta-button"
          onClick={() => navigate('/buy-tickets')}
        >
          Play Now
        </button>
      </section>

      <section className="features-grid">
      <div className="feature-card">
        <h3>Instant Ticket Purchase</h3>
        <p>Buy your tickets in seconds and join the draw instantly</p>
      </div>
      <div className="feature-card">
        <h3>Secure Wallet Integration</h3>
        <p>Your tickets and winnings are safely stored in your secure digital wallet</p>
      </div>
      <div className="feature-card">
        <h3>Fair & Transparent Draws</h3>
        <p>Every draw is conducted on the blockchain, ensuring fairness and transparency</p>
      </div>
      <div className="feature-card">
        <h3>Easy to Play</h3>
        <p>Simple and user-friendly interface for a seamless lottery experience</p>
      </div>
      </section>

      {/* <WinnersList /> */}
      {/* <HowToPlay /> */}
    </div>
  );
};

export default Home;