import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Confetti from 'react-confetti';
import LOTTERY_ABI_ARTIFACT from '../deployments/MultiTokenLottery.json';
import "./css/Winners.css";

const CONTRACT_ADDRESS = '0xd43eCA4E63D6cc5D229c8066cE9DDbeb85090a28';
const ABI = LOTTERY_ABI_ARTIFACT.abi;

const generateBlockchainImage = (seed) => {
  const colors = ['#1a237e', '#ffd700', '#4a90e2', '#c2185b', '#ffa726'];
  const randomColor = colors[Math.abs(seed.charCodeAt(0)) % colors.length];
  // Construct the SVG markup
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="${randomColor}" stroke-opacity="0.2" stroke-width="1"/>
      </pattern>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" style="stop-color:${randomColor};stop-opacity:0.5"/>
        <stop offset="100%" style="stop-color:${randomColor};stop-opacity:0"/>
      </radialGradient>
    </defs>
    <rect width="200" height="200" fill="url(#grid)"/>
    <circle cx="100" cy="100" r="80" fill="url(#glow)"/>
    <polygon points="100,20 180,100 100,180 20,100" fill="${randomColor}" fill-opacity="0.3" stroke="${randomColor}" stroke-width="2"/>
  </svg>`;
  // URL-encode the SVG string
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const WinnersPage = () => {
  const [winningAddress, setWinningAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight : 600
  });
  const [showConfetti, setShowConfetti] = useState(false);

  // Update window size on resize
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper: query events in batches (each ≤2048 blocks)
  const queryEventsInBatches = async (contract, filter, startBlock, endBlock, batchSize = 2048) => {
    let events = [];
    for (let from = startBlock; from <= endBlock; from += batchSize) {
      const to = Math.min(from + batchSize - 1, endBlock);
      const batchEvents = await contract.queryFilter(filter, from, to);
      events = events.concat(batchEvents);
    }
    return events;
  };

  // Fetch WinnerSelected events from roughly the last 24 hours
  useEffect(() => {
    const fetchLatestWinner = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

        // Filter for WinnerSelected events: WinnerSelected(address indexed winner, address indexed token, uint256 prize)
        const winnerFilter = contract.filters.WinnerSelected();

        // Approximate block range for last 24 hours (assume ~6500 blocks/day)
        const currentBlock = await provider.getBlockNumber();
        const blocksPerDay = 6500;
        const startBlock = currentBlock > blocksPerDay ? currentBlock - blocksPerDay : 0;

        // Query events in batches to avoid exceeding the block range limit
        const events = await queryEventsInBatches(contract, winnerFilter, startBlock, currentBlock);

        if (events.length > 0) {
          const latestEvent = events[events.length - 1];
          const [winner, token, prize] = latestEvent.args;
          console.log("WinnerSelected event:", { winner, token, prize: prize.toString() });
          setWinningAddress(winner);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to fetch latest winner: ' + err.message);
        setLoading(false);
      }
    };

    fetchLatestWinner();
  }, []);

  return (
    <div className="cyber-container">
      {/* <div className="grid-overlays"></div> */}
      <div className="node-animation"></div>

      <h1 className="cyber-title">🏆 Daily Lottery Winner</h1>

      {loading && (
        <div className="loading-container">
          <div className="cyber-loader"></div>
          <p>Loading today's winner...</p>
        </div>
      )}

      {!loading && error && (
        <div className="cyber-error">{error}</div>
      )}

      {!loading && !error && winningAddress ? (
        <div className="latest-winner">
          <h2>Today's Winning Address</h2>
          <p className="winner-address">{winningAddress}</p>
          <img
            src={generateBlockchainImage(winningAddress)}
            alt="Winner's blockchain pattern"
            className="winner-image"
          />
        </div>
      ) : (
        !loading && !error && <div className="no-winner">No winner yet for today.</div>
      )}

      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={200}
          recycle={false}
          colors={['#FFD700', '#4a90e2', '#ff6b6b', '#4ecdc4', '#45b7d1']}
          gravity={0.3}
        />
      )}
    </div>
  );
};

export default WinnersPage;

