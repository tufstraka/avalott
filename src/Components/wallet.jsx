import { ethers } from "ethers";

/**
 * Connects to a Core-compatible wallet and retrieves account information.
 * @returns {Promise<{walletAddress: string, balance: string}>}
 */
export const connectCoreWallet = async () => {
  if (typeof window.ethereum === "undefined") {
    throw new Error("No wallet detected. Please install MetaMask or Core Wallet!");
  }

  // Use BrowserProvider for ethers.js v6
  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  const walletAddress = accounts[0];
  const balance = await provider.getBalance(walletAddress);

  return {
    walletAddress,
    balance: ethers.formatEther(balance),
  };
};
