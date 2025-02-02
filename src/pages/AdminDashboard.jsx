import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import LOTTERY_ABI_ARTIFACT from '../deployments/MultiTokenLottery.json';
import { getTokenName } from '../utils/helpers';
import "./css/AdminDashboard.css";

const LOTTERY_ADDRESS = '0xeADD42c14c50397E64b4dc94a4beD91175c1E011';
const ADMINS = [
  '0xc283f1C9294d7A0299Cf98365687a17D671c4B60',
  '0xA3B224A0C87fdD3FA1916E79b9B997Fa006dCDb5',
  '0xFD3b31c1e73e896cb53d009c196F636814660ed3'
];

const LOTTERY_ABI = LOTTERY_ABI_ARTIFACT.abi;
const AVALANCHE_FUJI_CHAIN_ID = 43113; // Avalanche Fuji Testnet

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    error: null,
    contract: null,
    account: null,
    isAdmin: false,
    isOwner: false,
    loading: true,
    connectingWallet: false
  });

  const [lotteryState, setLotteryState] = useState({
    isActive: false,
    participants: 0,
    totalTickets: 0,
    endTime: 0,
  });

  const [adminState, setAdminState] = useState({
    newAdmin: '',
    adminList: [],
    newDuration: '',
    showAdminPanel: false
  });


  const [data, setData] = useState({
    participantData: [],
    tokenList: [],
    tokenDetails: {},
    newToken: { address: '', ticketPrice: '' }
  });

  const handleError = (error, action = '') => {
    let message = error.message;
    if (error.data) {
      const decodedError = state.contract.interface.parseError(error.data);
      message = decodedError?.args.join(' ') || error.message;
    }
    console.error(`Error ${action}:`, error);
    setState(prev => ({ ...prev, error: message, loading: false }));
  };

  const connectWallet = async () => {
    if (state.connectingWallet) return false;

    try {
      setState(prev => ({ ...prev, connectingWallet: true }));

      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });

      if (accounts.length === 0) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      }

      const currentAccounts = await window.ethereum.request({ method: 'eth_accounts' });

      if (currentAccounts.length === 0) {
        throw new Error('No authorized account found');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const lotteryContract = new ethers.Contract(LOTTERY_ADDRESS, LOTTERY_ABI, signer);

      setState(prev => ({
        ...prev,
        account: currentAccounts[0],
        contract: lotteryContract,
        connectingWallet: false
      }));

      return true;
    } catch (error) {
      handleError(error, 'connecting wallet');
      return false;
    }
  };

  const fetchTokenDecimals = async (tokenAddress) => {
    const tokenContract = new ethers.Contract(tokenAddress, ['function decimals() view returns (uint8)'], state.contract.signer);
    return await tokenContract.decimals();
  };

  const fetchLotteryData = async () => {
    if (!state.contract || !state.account) return;

    try {
      setState(prev => ({ ...prev, loading: true }));

      const owner = await state.contract.owner();
      const isCurrentOwner = ethers.utils.getAddress(owner) === ethers.utils.getAddress(state.account);
      const isCurrentAdmin = ADMINS.map(a => a.toLowerCase()).includes(state.account.toLowerCase());

      if (!isCurrentOwner && !isCurrentAdmin) {
        navigate('/');
        return;
      }

      const [active, endTime, participantCount, tokens] = await Promise.all([
        state.contract.lotteryActive(),
        state.contract.lotteryEndTime(),
        state.contract.getParticipantCount(),
        state.contract.getTokens()
      ]);

      setLotteryState({
        isActive: active,
        participants: Number(participantCount),
        endTime: Number(endTime),
      });

      setData(prev => ({ ...prev, tokenList: tokens }));

      // Fetch participant details
      const participantList = await Promise.all(
        Array.from({ length: Number(participantCount) }, (_, i) =>
          state.contract.participants(i)
        )
      );

      const formattedParticipants = participantList.map(p => ({
        addr: p.addr,
        tickets: Number(p.tickets),
        tokenUsed: p.tokenUsed,
      }));

      // Fetch token details
      const tokenDetails = {};
      await Promise.all(
        tokens.map(async (token) => {
          const config = await state.contract.supportedTokens(token);
          tokenDetails[token] = {
            isActive: config.isActive,
            ticketPrice: Number(config.ticketPrice),
            totalTickets: Number(config.totalTickets)
          };
        })
      );

      setData(prev => ({
        ...prev,
        participantData: formattedParticipants,
        tokenDetails
      }));

      setState(prev => ({
        ...prev,
        isOwner: isCurrentOwner,
        isAdmin: isCurrentOwner || isCurrentAdmin,
        loading: false
      }));

    } catch (error) {
      handleError(error, 'fetching lottery data');
    }
  };

  const addNewAdmin = async (e) => {
    e.preventDefault();
    if (!ethers.utils.isAddress(adminState.newAdmin)) {
      setState(prev => ({ ...prev, error: 'Invalid address format' }));
      return;
    }

    await executeTransaction(
      () => state.contract.addAdmin(adminState.newAdmin, { gasLimit: 800000 }),
      'Admin added successfully'
    );
    ADMINS.push(adminState.newAdmin)
    setAdminState(prev => ({ ...prev, newAdmin: '' }));
    await fetchAdminList();
  };

  // Remove admin
  const removeExistingAdmin = async (adminAddress) => {
    await executeTransaction(
      () => state.contract.removeAdmin(adminAddress),
      'Admin removed successfully'
    );
    await fetchAdminList();
  };

  // Update lottery duration
  const updateDuration = async (e) => {
    e.preventDefault();
    const duration = parseInt(adminState.newDuration);
    if (isNaN(duration) || duration <= 0) {
      setState(prev => ({ ...prev, error: 'Invalid duration' }));
      return;
    }

    await executeTransaction(
      () => state.contract.updateLotteryDuration(duration),
      'Lottery duration updated successfully'
    );
    setAdminState(prev => ({ ...prev, newDuration: '' }));
  };

  // Fetch admin status
  const fetchAdminList = async () => {
    if (!state.contract) return;
    
    try {
      const adminPromises = ADMINS.map(async (admin) => ({
        address: admin,
        isActive: await state.contract.isAdmin(admin)
      }));
      
      const adminList = await Promise.all(adminPromises);
      setAdminState(prev => ({ ...prev, adminList }));
    } catch (error) {
      handleError(error, 'fetching admin list');
    }
  };

  // Add to useEffect
  useEffect(() => {
    if (state.contract && state.isOwner) {
      fetchAdminList();
    }
  }, [state.contract, state.isOwner]);


  useEffect(() => {
    const init = async () => {
      const connected = await connectWallet();
      if (connected) {
        const handleAccountsChanged = async (accounts) => {
          if (accounts.length > 0) {
            setState(prev => ({ ...prev, account: accounts[0] }));
            await fetchLotteryData();
          } else {
            setState(prev => ({ ...prev, account: null }));
          }
        };

        const handleChainChanged = async (chainId) => {
          const numericChainId = parseInt(chainId, 16);
          if (numericChainId !== AVALANCHE_FUJI_CHAIN_ID) {
            handleError(new Error('Please connect to the Avalanche Fuji Testnet'), 'chain change');
          } else {
            await connectWallet();
          }
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
        window.ethereum.on('disconnect', handleAccountsChanged);

        return () => {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
          window.ethereum.removeListener('disconnect', handleAccountsChanged);
        };
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (state.contract && state.account) {
      fetchLotteryData();
      const interval = setInterval(fetchLotteryData, 30000);
      return () => clearInterval(interval);
    }
  }, [state.contract, state.account]);

  const executeTransaction = async (transaction, successMessage = '') => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const tx = await transaction();
      await tx.wait();
      await fetchLotteryData();
      if (successMessage) alert(successMessage);
    } catch (error) {
      handleError(error);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const startLottery = () => executeTransaction(
    () => state.contract.startLottery({ gasLimit: 800000 }),
    'Lottery started successfully'
  );

  const endLottery = () => executeTransaction(
    () => state.contract.selectWinners({ gasLimit: 800000 }),
    'Lottery ended successfully'
  );

  const addToken = async (e) => {
    e.preventDefault();
    try {
      const code = await state.contract.provider.getCode(data.newToken.address);
      if (code === '0x') throw new Error('Invalid contract address');

      const decimals = await fetchTokenDecimals(data.newToken.address);
      await executeTransaction(
        () => state.contract.addToken(
          data.newToken.address,
          ethers.utils.parseUnits(data.newToken.ticketPrice, decimals)
        ),
        'Token added successfully'
      );
      setData(prev => ({ ...prev, newToken: { address: '', ticketPrice: '' } }));
    } catch (error) {
      handleError(error, 'adding token');
    }
  };

  const updateTicketPrice = async (tokenAddress, newPrice) => {
    try {
      const decimals = await fetchTokenDecimals(tokenAddress);
      console.log(decimals)
      const parsedPrice = ethers.utils.parseUnits(newPrice.toString(), decimals);
      console.log(`Updating price with value: ${parsedPrice.toString()}`);
  
      await executeTransaction(
        () => state.contract.updateTicketPrice(tokenAddress, parsedPrice, { gasLimit: 800000 }),
        'Ticket price updated successfully'
      );
    } catch (error) {
      handleError(error);
    }
  };

  const removeToken = (tokenAddress) => executeTransaction(
    () => state.contract.removeToken(tokenAddress),
    'Token removed successfully'
  );

  if (state.error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{state.error}</p>
        <button onClick={() => setState(prev => ({ ...prev, error: null }))}>Dismiss</button>
      </div>
    );
  }

  if (state.loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  if (!state.isAdmin && !state.isOwner) {
    return null;
  }

  const renderAdminPanel = () => {
    if (!state.isOwner) return null;

    return (
      <div className="admin-panel">
        <div className="panel-header">
          <h2>Admin Management</h2>
          <button 
            className="toggle-button"
            onClick={() => setAdminState(prev => ({ 
              ...prev, 
              showAdminPanel: !prev.showAdminPanel 
            }))}
          >
            {adminState.showAdminPanel ? 'Hide' : 'Show'} Admin Panel
          </button>
        </div>

        {adminState.showAdminPanel && (
          <div className="admin-controls">
            <div className="admin-section">
              <h3>Add New Admin</h3>
              <form onSubmit={addNewAdmin} className="admin-form">
                <input
                  type="text"
                  placeholder="Admin Address"
                  value={adminState.newAdmin}
                  onChange={(e) => setAdminState(prev => ({
                    ...prev,
                    newAdmin: e.target.value
                  }))}
                  className="input-field"
                />
                <button type="submit" className="submit-button">
                  Add Admin
                </button>
              </form>
            </div>

            <div className="admin-section">
              <h3>Update Lottery Duration</h3>
              <form onSubmit={updateDuration} className="admin-form">
                <input
                  type="number"
                  placeholder="Duration in seconds"
                  value={adminState.newDuration}
                  onChange={(e) => setAdminState(prev => ({
                    ...prev,
                    newDuration: e.target.value
                  }))}
                  className="input-field"
                />
                <button type="submit" className="submit-button">
                  Update Duration
                </button>
              </form>
            </div>

            <div className="admin-section">
              <h3>Current Admins</h3>
              <div className="admin-list">
                {adminState.adminList.map((admin, index) => (
                  <div key={index} className="admin-item">
                    <span className="admin-address">{admin.address}</span>
                    <span className={`admin-status ${admin.isActive ? 'active' : 'inactive'}`}>
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {admin.isActive && (
                      <button
                        className="action-button remove"
                        onClick={() => removeExistingAdmin(admin.address)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTokenManagement = () => {
    if (!state.isAdmin) return null;

    return (
      <div className="token-management">
        <h2>Token Management</h2>

        <div className="add-token-form">
          <h3>Add New Token</h3>
          <form onSubmit={addToken}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Token Address"
                value={data.newToken.address}
                onChange={(e) => setData(prev => ({
                  ...prev,
                  newToken: { ...prev.newToken, address: e.target.value }
                }))}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Ticket Price (in token units)"
                value={data.newToken.ticketPrice}
                onChange={(e) => setData(prev => ({
                  ...prev,
                  newToken: { ...prev.newToken, ticketPrice: e.target.value }
                }))}
                className="input-field"
              />
              <button type="submit" className="submit-button" disabled={state.loading}>
                {state.loading ? 'Adding...' : 'Add Token'}
              </button>
            </div>
          </form>
        </div>

        <div className="token-list">
          <h3>Supported Tokens</h3>
          <div className="table-wrapper">
            <table className="token-table">
              <thead>
                <tr>
                  <th>Token Address</th>
                  <th>Status</th>
                  <th>Ticket Price</th>
                  <th>Total Tickets</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.tokenList.map((token) => (
                  <tr key={token}>
                    <td>{getTokenName(token)}</td>
                    <td>
                      <span className={`status ${data.tokenDetails[token]?.isActive ? 'active' : 'inactive'}`}>
                        {data.tokenDetails[token]?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{data.tokenDetails[token]?.ticketPrice}</td>
                    <td>{data.tokenDetails[token]?.totalTickets}</td>
                    <td>
                      <button
                        className="action-button remove"
                        onClick={() => removeToken(token)}
                        disabled={state.loading}
                      >
                        Remove
                      </button>
                      <button
                        className="action-button update"
                        onClick={() => {
                          const newPrice = prompt('Enter new ticket price (in token units):');
                          if (!newPrice || isNaN(newPrice) || Number(newPrice) <= 0) {
                            alert('Please enter a valid nonzero number for the ticket price.');
                            return;
                          }
                          updateTicketPrice(token, newPrice);
                        }}
                        disabled={state.loading}
                      >
                        Update Price
                      </button>
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

  const renderLotteryControls = () => {
    if (!state.isAdmin) return null;

    const now = Math.floor(Date.now() / 1000);
    const isEnded = lotteryState.isActive && now >= lotteryState.endTime;

    return (
      <div className="lottery-controls">
        <button
          className={`control-button ${isEnded ? 'end' : lotteryState.isActive ? 'end' : 'start'}`}
          onClick={isEnded ? endLottery : lotteryState.isActive ? endLottery : startLottery}
          disabled={state.loading || data.tokenList.length === 0}
        >
          {state.loading ? 'Processing...' :
            isEnded ? 'Select Winners' :
              lotteryState.isActive ? 'End Lottery' : 'Start Lottery'}
        </button>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Lottery Admin Dashboard</h1>
        {renderLotteryControls()}
      </div>

      {renderAdminPanel()}


      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Participants</h3>
          <p className="stat-value">{lotteryState.participants}</p>
        </div>
        <div className="stat-card">
          <h3>Status</h3>
          <p className={`stat-value ${lotteryState.isActive ? 'active' : 'inactive'}`}>
            {lotteryState.isActive ? 'Active' : 'Inactive'}
          </p>
        </div>
        <div className="stat-card">
          <h3>End Time</h3>
          <p className="stat-value">
            {lotteryState.endTime > 0 ? new Date(lotteryState.endTime * 1000).toLocaleString() : 'N/A'}
          </p>
        </div>
      </div>

      {renderTokenManagement()}

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
              {data.participantData.map((participant, index) => (
                <tr key={index}>
                  <td>{participant.addr}</td>
                  <td>{participant.tickets}</td>
                  <td>{getTokenName(participant.tokenUsed)}</td>
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