// src/utils/walletUtils.js
import { ethers } from "ethers";


/**
 * Connects to a Core-compatible wallet and retrieves account information.
 * @returns {Promise<{walletConnected: boolean, walletAddress: string, balance: string}>}
 */
export const connectCoreWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("No wallet detected. Please install MetaMask or Core Wallet!");
      return;
    }
  
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setWalletConnected(true);
      setWalletAddress(accounts[0]);
  
      const balance = await provider.getBalance(accounts[0]);
      setBalance(ethers.formatEther(balance));
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      alert("Failed to connect wallet: " + err.message);
    }
  };
  