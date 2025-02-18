import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Shield, Trophy, Users, Wallet, Play, Info } from 'lucide-react';
import './css/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [activeQuestion, setActiveQuestion] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.fade-trigger').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const faqs = [
    {
      question: "How do I trust the randomness?",
      answer: "We use Chainlink's VRF, combining blockchain data with cryptographic proofs. Watch our verification tutorial ↗"
    },
    {
      question: "How does the blockchain lottery work?",
      answer: "Our lottery system utilizes smart contracts on the blockchain to ensure complete transparency and fairness. Every ticket purchase and draw is recorded on the blockchain, making it impossible to manipulate results."
    },
    {
      question: "How do I claim my winnings?",
      answer: "Winnings are automatically transferred to your connected wallet within 24 hours of the draw. For large jackpots, our team will contact you directly to arrange the transfer."
    },
    {
      question: "Is my digital wallet secure?",
      answer: "We implement military-grade encryption and multi-signature security protocols to ensure your digital wallet and assets are protected at all times."
    },
    {
      question: "Is this legal?",
      answer: "AvaLott operates under proper gaming licenses. Check eligibility ↗"
    }
  ];

  return (
    <div className="home-container">
      <div className="cyber-grid"></div>
      
      <section className="hero-section fade-trigger">
        <div className="hero-3d-element"></div>
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="holographic-text">Dream Bigger</span>
            <span className="neon-subtitle">With Every Ticket</span>
          </h1>
          <p className="hero-subtitle">
            Join millions of players and get a chance to win life-changing prizes
            <span className="blinking-cursor">_</span>
          </p>

          <div className="stats-grid">
            <div className="stat-card holographic-border">
              <div className="stat-inner">
                <Trophy className="stat-icon" size={32} />
                <div className="stat-content">
                  <span className="stat-value">$50M+</span>
                  <span className="stat-label">Total Prizes</span>
                </div>
              </div>
            </div>
            <div className="stat-card holographic-border">
              <div className="stat-inner">
                <Users className="stat-icon" size={32} />
                <div className="stat-content">
                  <span className="stat-value">1M+</span>
                  <span className="stat-label">Players</span>
                </div>
              </div>
            </div>
            <div className="stat-card holographic-border">
              <div className="stat-inner">
                <Shield className="stat-icon" size={32} />
                <div className="stat-content">
                  <span className="stat-value">100%</span>
                  <span className="stat-label">Secure</span>
                </div>
              </div>
            </div>
          </div>

          <button className="neon-cta" onClick={() => navigate('/buy-tickets')}>
            <span className="btn-content">
              <span className="btn-text">Play Now</span>
              <span className="btn-glitch"></span>
              {/* <span className="btn-label">Minimum 0.01 ETH</span> */}
            </span>
          </button>
        </div>
      </section>

      <section className="how-it-works-section fade-trigger">
        <div className="content-wrapper">
          <div className="steps-content">
            <h2 className="section-title">How It Works</h2>
            <div className="steps-list">
              <div className="step-item">
                <div className="step-number">01</div>
                <h3>Connect Wallet</h3>
                <p>Link your crypto wallet to start playing instantly.</p>
              </div>
              <div className="step-item">
                <div className="step-number">02</div>
                <h3>Buy Tickets</h3>
                <p>Buy your ticket according to the token present.</p>
              </div>
              <div className="step-item">
                <div className="step-number">03</div>
                <h3>Win Big</h3>
                <p>Wait for the draw and receive instant payouts.</p>
              </div>
            </div>
          </div>
          <div className="video-showcase">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="demo-video"
            >
              <source src="./src/pages/vid/Screen Recording 2025-02-18 191532.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </section>

      <section className="about-section fade-trigger">
        <div className="about-container">
          <div className="about-content">
            <div className="about-text">
              <h2 className="section-title">About AvaLott</h2>
              <p className="about-description">
                Welcome to the future of lottery gaming. AvaLott leverages blockchain technology 
                to create a transparent, fair, and exciting lottery experience.
              </p>
              <div className="feature-list">
                <div className="feature-item">
                  <div className="feature-icon-wrapper">
                    <Shield className="feature-icon" size={24} />
                  </div>
                  <div className="feature-text">
                    <h3>Provably Fair</h3>
                    <p>Every draw is verified on-chain and cannot be manipulated</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon-wrapper">
                    <Wallet className="feature-icon" size={24} />
                  </div>
                  <div className="feature-text">
                    <h3>Instant Payouts</h3>
                    <p>Winners receive prizes directly to their wallets</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="about-visual">
              <div className="tech-sphere">
                <div className="sphere-content">
                  <span className="sphere-text">AVALOTT</span>
                </div>
                <div className="sphere-rings">
                  <div className="ring ring-1"></div>
                  <div className="ring ring-2"></div>
                  <div className="ring ring-3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="testimonials-section fade-trigger">
        <h2 className="section-title">Player Stories</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <p>"Finally, a lottery where I don't wonder if I've been scammed. The blockchain doesn't lie."</p>
            <div className="testimonial-author">
              <span className="author-name">@CryptoQueen</span>
              <span className="author-title">Early Adopter</span>
            </div>
          </div>
          <div className="testimonial-card">
            <p>"Won 5 ETH on my first try! The instant payout was amazing - no waiting or verification needed."</p>
            <div className="testimonial-author">
              <span className="author-name">Alex Chen</span>
              <span className="author-title">Lucky Winner</span>
            </div>
          </div>
          <div className="testimonial-card">
            <p>"The transparency is revolutionary. This is how all gambling should work."</p>
            <div className="testimonial-author">
              <span className="author-name">TechCrunch</span>
              <span className="author-title">Review</span>
            </div>
          </div>
        </div>
      </section>

      <section className="faq-section fade-trigger">
        <h2 className="section-title">Common Questions</h2>
        <div className="faq-grid">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="faq-item"
              onClick={() => setActiveQuestion(activeQuestion === index ? null : index)}
            >
              <div className="faq-question">
                <h3>{faq.question}</h3>
                {activeQuestion === index ? 
                  <ChevronUp className="faq-icon" /> : 
                  <ChevronDown className="faq-icon" />
                }
              </div>
              {activeQuestion === index && (
                <div className="faq-answer">{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;