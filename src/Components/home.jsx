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
  const targetDate = new Date("2025-01-20T00:00:00Z").getTime();

  // Connect Wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("No wallet detected. Please install MetaMask or Core Wallet!");
      }
  
      // Check if the wallet is already connected
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
  
      if (accounts.length === 0) {
        // If no accounts are connected, request accounts
        const requestedAccounts = await provider.send("eth_requestAccounts", []);
        setWalletAddress(requestedAccounts[0]);
      } else {
        setWalletAddress(accounts[0]);
      }
  
      const balance = await provider.getBalance(accounts[0]);
      setWalletConnected(true);
      setBalance(ethers.formatEther(balance));
    } catch (err) {
      alert("Failed to connect wallet: " + err.message);
    }
  };
  
  // Get Supported Tokens and Lottery Status
  const getLotteryDetails = async () => {
    try {
      const { contractRead, contractWrite } = await getLotteryContract();  // Destructuring for contractRead and contractWrite
  
      // Fetch the lottery active status
      const activeStatus = await contractRead.lotteryActive();
      setLotteryActive(activeStatus);
  
      // Define the token addresses (USDC and USDT)
       const usdcAddress = "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e"; // Example address
      const usdtAddress = "0xc7198437980c041c805a1edcba50c1ce5db95118"
  
      const tokens = [usdcAddress, usdtAddress];
      console.log("Supported Tokens:", tokens);
      setSupportedTokens(tokens);
  
      // Fetch ticket prices for USDC and USDT
      const usdcDetails = await contractRead.supportedTokens(usdcAddress);
      const usdtDetails = await contractRead.supportedTokens(usdtAddress);
  
      // Set the default token to USDC and its ticket price
      setSelectedToken(usdcAddress);
      setTicketPrice(ethers.formatEther(usdcDetails.ticketPrice)); // Format ticket price as ether
  
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

    if (!selectedToken || selectedToken === "") {
        alert("No token selected for purchasing tickets.");
        return;
    }

    if (balance < ticketPrice) {
        alert("Insufficient funds to purchase a ticket.");
        return;
    }

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner(); // Need signer for token approval

        const { contractWrite } = await getLotteryContract();

        // Initialize token contract with signer for sending transactions
        const tokenContract = new ethers.Contract(
            selectedToken, 
            ["function approve(address spender, uint256 amount) public returns (bool)"], 
            signer // Use signer instead of provider for sending transactions
        );

        console.log("Approving token spend...");
        const approveTx = await tokenContract.approve(contractWrite.address, ticketPrice);
        console.log("Waiting for approval confirmation...");
        await approveTx.wait();

        console.log("Purchasing ticket...");
        const tx = await contractWrite.buyTickets(selectedToken, 1); // Use contractWrite for transactions
        console.log("Waiting for purchase confirmation...");
        await tx.wait();

        setTickets(tickets + 1);
        setBalance(balance - ticketPrice);
        alert("Ticket purchased successfully!");
    } catch (err) {
        console.error("Error details:", err);
        alert("Error purchasing ticket: " + err.message);
    }
};
  

  // Countdown Logic
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance <= 0) {
        setCountdown(0);
      } else {
        setCountdown(Math.floor(distance / 1000));
      }
    };

    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const formatCountdown = () => {
    const hours = Math.floor(countdown / 3600);
    const minutes = Math.floor((countdown % 3600) / 60);
    const seconds = countdown % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Helper function to get the Lottery contract instance


  const getLotteryContract = async () => {
    if (!window.ethereum) {
        throw new Error("No wallet detected. Please install MetaMask or Core Wallet!");
    }

    // Use BrowserProvider for ethers.js v6
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner(); // Need to await getSigner()

    const contractAddress = "0x21C4432DD0e56242A5aBB19b482470A7C2Bb4A0c";
    const abi = [
        "function lotteryActive() public view returns (bool)",
        "function getTokens() public view returns (address[] memory)",
        "function supportedTokens(address) public view returns (tuple(bool isActive, uint256 ticketPrice, uint256 totalTickets))",
        "function buyTickets(address _token, uint256 _amount)",
    ];

    // Initialize the contract with signer and provider
    const contractRead = new ethers.Contract(contractAddress, abi, provider);
    const contractWrite = new ethers.Contract(contractAddress, abi, signer);

    return { contractRead, contractWrite };
};

  
  

  // Load lottery details when the component mounts
  useEffect(() => {
    getLotteryDetails();
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>Lottery-DAO</h1>
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

        <div className="token-selection">
  <label htmlFor="token-select">Select Token:</label>
  <select
  id="token-select"
  value={selectedToken || ""} // Ensure a default value is set
  onChange={(e) => setSelectedToken(e.target.value)}
>
  <option value="" disabled>
    Choose a token
  </option>
  {supportedTokens.length > 0 ? (
    supportedTokens.map((token) => (
      <option key={token} value={token}>
        {token}
      </option>
    ))
  ) : (
    <option value="" disabled>
      No tokens available
    </option>
  )}
</select>

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
