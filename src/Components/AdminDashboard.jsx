import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import './css/AdminDashboard.css';
import LOTTERY_ABI_ARTIFACT from './MultiTokenLottery.json';

const LOTTERY_ABI = LOTTERY_ABI_ARTIFACT.abi;
const LOTTERY_ADDRESS = '0x21C4432DD0e56242A5aBB19b482470A7C2Bb4A0c'; // Replace with your contract address
const ADMINS = [
  '0x5B058198Fc832E592edA2b749bc6e4380f4ED458', // Example admin address
  // Add more admin addresses here
];

const AdminDashboard = ({ contract, account }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lotteryState, setLotteryState] = useState({
    isActive: false,
    participants: 0,
    totalTickets: 0,
    prizePool: '0',
    endTime: 0,
  });
  const [participantData, setParticipantData] = useState([]);
  const [tokenList, setTokenList] = useState([]);
  const navigate = useNavigate();

  // Check if the current user is an admin or owner
  useEffect(() => {
    const checkAdminAndOwner = async () => {
        if (!contract || !account) return;
        try {
          const owner = await contract.owner();
          console.log('Owner:', owner);
          setIsOwner(owner.toLowerCase() === account.toLowerCase());
      
          // Check if the current account is in the hardcoded admin list
          const isAdmin = ADMINS.map((a) => a.toLowerCase()).includes(account.toLowerCase());
          console.log('Is Admin:', isAdmin);
          setIsAdmin(isAdmin || owner.toLowerCase() === account.toLowerCase());
      
          if (!isAdmin && owner.toLowerCase() !== account.toLowerCase()) {
            console.log('Not an admin or owner, redirecting...');
            navigate('/'); // Redirect if not admin or owner
          }
        } catch (error) {
          console.error('Error checking admin role:', error);
          navigate('/');
        } finally {
          setLoading(false);
        }
      };
    checkAdminAndOwner();
  }, [contract, account]);

  // Fetch lottery state and participant data
  useEffect(() => {
    if (!contract || !isAdmin) return;

    const fetchData = async () => {
      try {
        const [active, endTime, participants, totalTickets, prizePool, tokens] = await Promise.all([
          contract.lotteryActive(),
          contract.lotteryEndTime(),
          contract.getParticipantCount(),
          contract.getTotalTickets(),
          contract.getPrizePool(),
          contract.getTokens(),
        ]);

        setLotteryState({
          isActive: active,
          participants: participants.toNumber(),
          totalTickets: totalTickets.toNumber(),
          prizePool: ethers.utils.formatEther(prizePool),
          endTime: endTime.toNumber(),
        });

        // Fetch participant details
        const participantList = [];
        for (let i = 0; i < participants.toNumber(); i++) {
          const participant = await contract.participants(i);
          participantList.push({
            addr: participant.addr,
            tickets: participant.tickets.toNumber(),
            tokenUsed: participant.tokenUsed,
          });
        }
        setParticipantData(participantList);

        // Fetch token list
        setTokenList(tokens);
      } catch (error) {
        console.error('Error fetching lottery data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [contract, isAdmin]);

  const startLottery = async () => {
    try {
      setLoading(true);
      const tx = await contract.startLottery();
      await tx.wait();
      setLotteryState((prev) => ({ ...prev, isActive: true }));
    } catch (error) {
      console.error('Error starting lottery:', error);
    } finally {
      setLoading(false);
    }
  };

  const endLottery = async () => {
    try {
      setLoading(true);
      const tx = await contract.selectWinners();
      await tx.wait();
      setLotteryState((prev) => ({ ...prev, isActive: false }));
    } catch (error) {
      console.error('Error ending lottery:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  if (!isAdmin && !isOwner) {
    return null; // Navigate would have redirected
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Lottery Admin Dashboard</h1>
        <div className="lottery-controls">
          {isOwner && (
            <button
              className={`control-button ${lotteryState.isActive ? 'end' : 'start'}`}
              onClick={lotteryState.isActive ? endLottery : startLottery}
              disabled={loading}
            >
              {loading ? 'Processing...' : lotteryState.isActive ? 'End Lottery' : 'Start Lottery'}
            </button>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Participants</h3>
          <p className="stat-value">{lotteryState.participants}</p>
        </div>
        <div className="stat-card">
          <h3>Total Tickets</h3>
          <p className="stat-value">{lotteryState.totalTickets}</p>
        </div>
        <div className="stat-card">
          <h3>Prize Pool</h3>
          <p className="stat-value">{parseFloat(lotteryState.prizePool).toFixed(4)} ETH</p>
        </div>
        <div className="stat-card">
          <h3>Status</h3>
          <p className={`stat-value ${lotteryState.isActive ? 'active' : 'inactive'}`}>
            {lotteryState.isActive ? 'Active' : 'Inactive'}
          </p>
        </div>
      </div>

      <div className="participants-table-container">
        <h2>Participant Details</h2>
        <div className="table-wrapper">
          <table className="participants-table">
            <thead>
              <tr>
                <th>Address</th>
                <th>Tickets</th>
                <th>Token Used</th>
              </tr>
            </thead>
            <tbody>
              {participantData.map((participant, index) => (
                <tr key={index}>
                  <td>{participant.addr}</td>
                  <td>{participant.tickets}</td>
                  <td>{participant.tokenUsed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;