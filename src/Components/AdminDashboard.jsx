import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import './css/AdminDashboard.css';

const AdminDashboard = ({ contract, account }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lotteryState, setLotteryState] = useState({
    isActive: false,
    participants: 0,
    totalTickets: 0,
    prizePool: '0'
  });
  const [participantData, setParticipantData] = useState([]);
  const [selectedToken, setSelectedToken] = useState('');
  const navigate = useNavigate();

  // Check if current user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!contract || !account) return;
      try {
        const adminRole = await contract.DEFAULT_ADMIN_ROLE();
        const hasRole = await contract.hasRole(adminRole, account);
        setIsAdmin(hasRole);
        if (!hasRole) {
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        navigate('/');
      }
      setLoading(false);
    };
    checkAdmin();
  }, [contract, account]);

  // Fetch lottery state and participant data
  useEffect(() => {
    if (!contract || !isAdmin) return;
    
    const fetchData = async () => {
      try {
        const [
          active,
          participants,
          totalTickets,
          prizePool
        ] = await Promise.all([
          contract.isLotteryActive(),
          contract.getParticipantCount(),
          contract.getTotalTickets(),
          contract.getPrizePool()
        ]);

        setLotteryState({
          isActive: active,
          participants: participants.toNumber(),
          totalTickets: totalTickets.toNumber(),
          prizePool: ethers.utils.formatEther(prizePool)
        });

        // Fetch participant details
        const participantList = [];
        for (let i = 0; i < participants.toNumber(); i++) {
          const address = await contract.getParticipantAtIndex(i);
          const tickets = await contract.getTicketCount(address);
          participantList.push({
            address,
            tickets: tickets.toNumber()
          });
        }
        setParticipantData(participantList);

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
      setLotteryState(prev => ({ ...prev, isActive: true }));
    } catch (error) {
      console.error('Error starting lottery:', error);
    } finally {
      setLoading(false);
    }
  };

  const endLottery = async () => {
    try {
      setLoading(true);
      const tx = await contract.endLottery();
      await tx.wait();
      setLotteryState(prev => ({ ...prev, isActive: false }));
    } catch (error) {
      console.error('Error ending lottery:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  if (!isAdmin) {
    return null; // Navigate would have redirected
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Lottery Admin Dashboard</h1>
        <div className="lottery-controls">
          <button
            className={`control-button ${lotteryState.isActive ? 'end' : 'start'}`}
            onClick={lotteryState.isActive ? endLottery : startLottery}
            disabled={loading}
          >
            {loading ? 'Processing...' : lotteryState.isActive ? 'End Lottery' : 'Start Lottery'}
          </button>
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
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {participantData.map((participant) => (
                <tr key={participant.address}>
                  <td>{participant.address}</td>
                  <td>{participant.tickets}</td>
                  <td>
                    {((participant.tickets / lotteryState.totalTickets) * 100).toFixed(2)}%
                  </td>
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