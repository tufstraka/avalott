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
          <h3>Quick Pick</h3>
          <p>Let luck choose your numbers instantly</p>
        </div>
        <div className="feature-card">
          <h3>Secure Play</h3>
          <p>Your tickets are safely stored digitally</p>
        </div>
        <div className="feature-card">
          <h3>Instant Notifications</h3>
          <p>Get alerts when you win</p>
        </div>
        <div className="feature-card">
          <h3>Multiple Games</h3>
          <p>Choose from various exciting lottery games</p>
        </div>
      </section>

      {/* <WinnersList /> */}
      {/* <HowToPlay /> */}
    </div>
  );
};

export default Home;