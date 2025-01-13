import React, { useState, useEffect } from "react";
import "./css/home.css";
import { connectCoreWallet } from "./wallet";
import { ethers } from "ethers";

const Home = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [countdown, setCountdown] = useState(0); // in seconds
  const [tickets, setTickets] = useState(0);
  const [balance, setBalance] = useState(0);
  const [lotteryActive, setLotteryActive] = useState(false);
  const [supportedTokens, setSupportedTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [ticketPrice, setTicketPrice] = useState(0);

  // Define the target date (the lottery draw date)
  const targetDate = new Date("2025-01-20T00:00:00Z").getTime(); // Set your target date and time here

  // Connect Wallet
  const connectWallet = async () => {
    try {
      const { walletAddress, balance } = await connectCoreWallet();
      setWalletConnected(true);
      setWalletAddress(walletAddress);
      setBalance(balance);
    } catch (err) {
      alert("Failed to connect wallet: " + err.message);
    }
  };

  // Get Supported Tokens and Lottery Status
  const getLotteryDetails = async () => {
    try {
      const lotteryContract = await getLotteryContract();
      const activeStatus = await lotteryContract.lotteryActive();
      setLotteryActive(activeStatus);

      const tokens = await lotteryContract.getTokens();
      setSupportedTokens(tokens);

      // Assume we can fetch the ticket price of the first supported token
      if (tokens.length > 0) {
        const ticketPrice = await lotteryContract.supportedTokens(tokens[0]);
        setTicketPrice(ticketPrice.ticketPrice);
        setSelectedToken(tokens[0]);
      }
    } catch (err) {
      console.error("Error fetching lottery details: ", err);
    }
  };

  // Purchase Tickets
  const purchaseTicket = async () => {
    if (!walletConnected) {
      alert("Please connect your wallet first!");
      return;
    }
    if (balance < ticketPrice) {
      alert("Insufficient funds to purchase a ticket.");
      return;
    }

    try {
      const lotteryContract = await getLotteryContract();
      const tx = await lotteryContract.buyTickets(selectedToken, 1); // Purchase 1 ticket
      await tx.wait();
      setTickets(tickets + 1);
      setBalance(balance - ticketPrice);
      alert("Ticket purchased successfully!");
    } catch (err) {
      alert("Error purchasing ticket: " + err.message);
    }
  };

  // Countdown Logic
  useEffect(() => {
    // Check if there's a saved countdown from localStorage
    const savedCountdown = localStorage.getItem("countdown");
    if (savedCountdown) {
      setCountdown(Number(savedCountdown)); // Initialize countdown from saved value
    }

    // Function to calculate and update the countdown
    const updateCountdown = () => {
      const now = new Date().getTime(); // Current time in milliseconds
      const distance = targetDate - now; // Time remaining in milliseconds

      if (distance <= 0) {
        clearInterval(timer);
        setCountdown(0);
        localStorage.setItem("countdown", 0);
      } else {
        setCountdown(Math.floor(distance / 1000)); // Set countdown in seconds
        localStorage.setItem("countdown", Math.floor(distance / 1000)); // Save countdown to localStorage
      }
    };

    const timer = setInterval(updateCountdown, 1000); // Update countdown every second
    return () => clearInterval(timer); // Clear the interval on component unmount
  }, []);

  const formatCountdown = () => {
    const hours = Math.floor(countdown / 3600);
    const minutes = Math.floor((countdown % 3600) / 60);
    const seconds = countdown % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Helper function to get the Lottery contract instance
  const getLotteryContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contractAddress = "<YOUR_CONTRACT_ADDRESS>";
    const abi = [
      "function lotteryActive() public view returns (bool)",
      "function getTokens() public view returns (address[] memory)",
      "function supportedTokens(address) public view returns (tuple(bool isActive, uint256 ticketPrice, uint256 totalTickets))",
      "function buyTickets(address _token, uint256 _amount) public nonReentrant",
    ];

    const contract = new ethers.Contract(contractAddress, abi, provider.getSigner());
    return contract;
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
            Current Status: <span className={lotteryActive ? "active" : "inactive"}>{lotteryActive ? "Active" : "Inactive"}</span>
          </p>
          <p>Next Draw: <b>January 20, 2025</b></p>
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
            Buy Ticket ({ticketPrice} ETH)
          </button>
          <p>Total Tickets Purchased: {tickets}</p>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; 2025 Lottery-DAO. All rights reserved.</p>
        <div>
          <a href="#privacy">Privacy Policy</a> | <a href="#contact">Contact Us</a>
        </div>
      </footer>
    </div>
  );
};

export default Home;
