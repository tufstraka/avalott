import React, { useState, useEffect } from "react";
import "./css/home.css";
import { connectCoreWallet } from "./wallet";
import { ethers } from "ethers";


const Home = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [countdown, setCountdown] = useState(86400); // 24 hours in seconds
  const [tickets, setTickets] = useState(0);
  const [balance, setBalance] = useState(0);

  // Connect Wallet
  const connectWallet = async () => {
    try {
      const { walletConnected, walletAddress, balance } = await connectCoreWallet();
      setWalletConnected(walletConnected);
      setWalletAddress(walletAddress);
      setBalance(balance);
    } catch (err) {
      alert(err.message);
    }
  };

  // Purchase Tickets
  const purchaseTicket = async () => {
    if (!walletConnected) {
      alert("Please connect your wallet first!");
      return;
    }
    if (balance < 0.01) {
      alert("Insufficient funds to purchase a ticket.");
      return;
    }

    try {
      // Simulate ticket purchase
      setTickets(tickets + 1);
      setBalance((prevBalance) => (prevBalance - 0.01).toFixed(4)); // Deduct 0.01 ETH
      alert("Ticket purchased successfully!");
    } catch (err) {
      console.error("Error purchasing ticket:", err);
    }
  };

  // Countdown Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Countdown
  const formatCountdown = () => {
    const hours = Math.floor(countdown / 3600);
    const minutes = Math.floor((countdown % 3600) / 60);
    const seconds = countdown % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="app">
      <header className="header">
        <h1>DynamicPage</h1>
        <button className="wallet-button" onClick={connectWallet}>
          {walletConnected ? "Wallet Connected" : "Connect Wallet"}
        </button>
      </header>

      <main className="main">
        <div className="lottery-status">
          <h2>Lottery Status</h2>
          <p>
            Current Status: <span className="active">Active</span>
          </p>
          <p>Next Draw: <b>December 20, 2023</b></p>
          <p>Time Remaining: <b>{formatCountdown()}</b></p>
        </div>

        <div className="featured-prize">
          <h2>Featured Lottery Prize</h2>
          <img src="https://via.placeholder.com/300x200" alt="Luxury Car" />
          <p><b>Luxury Car</b></p>
          <p>
            Win a brand new luxury car in the upcoming draw! Participate now to
            increase your chances.
          </p>
        </div>

        <div className="purchase-section">
          <h2>Purchase Tickets</h2>
          <p>Wallet Balance: {balance} ETH</p>
          <button className="purchase-button" onClick={purchaseTicket}>
            Buy Ticket (0.01 ETH)
          </button>
          <p>Total Tickets Purchased: {tickets}</p>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; 2023 DynamicPage. All rights reserved.</p>
        <div>
          <a href="#privacy">Privacy Policy</a> | <a href="#contact">Contact Us</a>
        </div>
      </footer>
    </div>
  );
};

export default Home;
