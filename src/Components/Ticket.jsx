import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import "./css/ticket.css";
import LOTTERY_ABI_ARTIFACT from '../deployments/MultiTokenLottery.json';
import PurchaseModal from './PurchaseModal';
import Graph from './graph';
import { getTokenName } from '../utils/helpers';


const LOTTERY_ABI = LOTTERY_ABI_ARTIFACT.abi;
const LOTTERY_ADDRESS = '0xB850924bd2106614F65b323EAB97cd4667426e99';

const Ticket = () => {
  // State management
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [lotteryState, setLotteryState] = useState({
    isActive: false,
    endTime: 0,
    participants: 0
  });
  const [tokens, setTokens] = useState([]);
  const [tokenConfigs, setTokenConfigs] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userTickets, setUserTickets] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketAmount, setTicketAmount] = useState(1);
  const [selectedToken, setSelectedToken] = useState("");
  const [graphData, setGraphData] = useState(null);

  // Initialize Web3 and contract
  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum === 'undefined') {
        setError('Please install MetaMask');
        return;
      }

      try {
        console.log('Initializing provider...');
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(newProvider);

        console.log('Getting signer...');
        const signer = await newProvider.getSigner();
        console.log('Signer address:', await signer.getAddress());

        console.log('Initializing contract...');
        const newContract = new ethers.Contract(LOTTERY_ADDRESS, LOTTERY_ABI, signer);
        setContract(newContract);

        const address = await signer.getAddress();
        setAccount(address);
        console.log('Account set:', address);

        await updateLotteryState(newContract, address, signer);

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', () => window.location.reload());

        return () => {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        };
      } catch (err) {
        console.error('Initialization error:', err);
        if (err.code === 'ACTION_REJECTED') {
          setError('Please connect your wallet to continue');
        } else {
          handleError(err, 'Failed to initialize');
        }
      }
    };

    init();
  }, []);

  const handleAccountsChanged = async (accounts) => {
    console.log('Accounts changed:', accounts);
    if (accounts.length > 0) {
      try {
        const signer = await provider.getSigner();
        const newContract = contract.connect(signer);
        setContract(newContract);
        setAccount(accounts[0]);
        await updateLotteryState(newContract, accounts[0], signer);
      } catch (err) {
        handleError(err, 'Failed to update account');
      }
    } else {
      setAccount('');
      setUserTickets({});
    }
  };

  const updateLotteryState = async (contractInstance, userAccount, signer) => {
    if (!contractInstance || !userAccount || !signer) return;

    try {
      setLoading(true);
      console.log('Updating lottery state...');

      const [
        active,
        endTime,
        participantCount,
        availableTokens
      ] = await Promise.all([
        contractInstance.lotteryActive(),
        contractInstance.lotteryEndTime(),
        contractInstance.getParticipantCount(),
        contractInstance.getTokens()
      ]);

      console.log('Lottery active:', active);
      console.log('Lottery end time:', endTime);
      console.log('Participant count:', participantCount);
      console.log('Available tokens:', availableTokens);

      setLotteryState({
        isActive: active,
        endTime: Number(endTime),
        participants: Number(participantCount)
      });

      setTokens(availableTokens);

      const configs = {};
      const tickets = {};

      for (const token of availableTokens) {
        try {
          console.log(`Loading token ${token}...`);
          const tokenContract = new ethers.Contract(
            token,
            ['function decimals() view returns (uint8)'],
            signer
          );

          const [config, userTicketCount, decimals] = await Promise.all([
            contractInstance.supportedTokens(token),
            contractInstance.ticketHoldings(token, userAccount),
            tokenContract.decimals()
          ]);

          console.log(`Token ${token} config:`, config);
          console.log(`User ticket count for ${token}:`, userTicketCount);
          console.log(`Token decimals for ${token}:`, decimals);

          configs[token] = {
            isActive: config.isActive,
            ticketPrice: config.ticketPrice.toString(),
            totalTickets: Number(config.totalTickets),
            decimals: decimals
          };

          tickets[token] = Number(userTicketCount);
        } catch (err) {
          console.error(`Error loading token ${token}:`, err);
          configs[token] = {
            isActive: false,
            ticketPrice: '0',
            totalTickets: 0,
            decimals: 18  // Default to 18 decimals if loading fails
          };
          tickets[token] = 0;
        }
      }
      
      setTokenConfigs(configs);
      setUserTickets(tickets);

      setGraphData({
        labels: availableTokens,
        values: availableTokens.map(token => tickets[token] || 0)
      });

    } catch (err) {
      handleError(err, 'Failed to update lottery state');
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
      }

      console.log('Requesting accounts...');
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const signer = await provider.getSigner();
      const newContract = contract.connect(signer);
      setContract(newContract);
      setAccount(accounts[0]);
      await updateLotteryState(newContract, accounts[0], signer);
    } catch (err) {
      handleError(err, 'Failed to connect wallet');
    }
  };

  const formatTokenPrice = (price, token) => {
    if (!tokenConfigs[token]) return '0.00';
    const decimals = tokenConfigs[token].decimals || 18;
    return ethers.formatUnits(price, decimals);
  };

  const buyTickets = async () => {
    if (!contract || !selectedToken || !ticketAmount || !tokenConfigs[selectedToken]) {
      setError('Invalid selection or missing data');
      return;
    }
  
    if (typeof ticketAmount !== 'number' || ticketAmount <= 0) {
      setError('Please enter a valid number of tickets.');
      return;
    }
  
    setLoading(true);
    setError('');
  
    try {
      const signer = await provider.getSigner();
      const connectedContract = contract.connect(signer);
  
      if (!lotteryState.isActive) {
        throw new Error('Lottery is not active');
      }
  
      if (Date.now() / 1000 > lotteryState.endTime) {
        throw new Error('Lottery has ended');
      }
  
      const tokenContract = new ethers.Contract(
        selectedToken,
        [
          'function approve(address spender, uint256 amount) returns (bool)',
          'function allowance(address owner, address spender) view returns (uint256)',
          'function balanceOf(address account) view returns (uint256)',
          'function decimals() view returns (uint8)'
        ],
        signer
      );
  
      const tokenConfig = tokenConfigs[selectedToken];
      if (!tokenConfig) {
        throw new Error('Invalid token configuration');
      }
  
      const ticketPriceWei = BigInt(tokenConfig.ticketPrice);
      const ticketAmountBigInt = BigInt(ticketAmount);
      const totalCostWei = ticketPriceWei * ticketAmountBigInt;
  
      const tokenDecimals = await tokenContract.decimals();
      console.log('Token decimals:', tokenDecimals);
  
      const balance = await tokenContract.balanceOf(await signer.getAddress());
      console.log('User balance:', balance.toString());
  
      if (balance < totalCostWei) {
        throw new Error('Insufficient token balance');
      }
  
      const allowance = await tokenContract.allowance(
        await signer.getAddress(),
        contract.target
      );
      console.log('Current allowance:', allowance.toString());
  
      if (allowance < totalCostWei) {
        console.log('Approving tokens...');
        const approveTx = await tokenContract.approve(
          contract.target,
          totalCostWei,
          { gasLimit: 100000 }
        );
        await approveTx.wait();
        console.log('Tokens approved');
      }
  
      console.log('Buying tickets...', {
        token: selectedToken,
        amount: ticketAmount,
        totalCost: ethers.formatUnits(totalCostWei.toString(), tokenDecimals)
      });
  
      const tx = await connectedContract.buyTickets(
        selectedToken,
        ticketAmount
      );
  
      await tx.wait();
      console.log('Tickets purchased successfully');
  
      setTicketAmount(1);
      await updateLotteryState(contract, account);
      setIsModalOpen(false);
  
    } catch (err) {
      console.error('Transaction failed:', err);
      setError(`Transaction failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err, message) => {
    console.error(message, err);
    setError(`${message}: ${err.message}`);
  };

  const formatTimeLeft = () => {
    if (!lotteryState.endTime) return 'Not started';
    
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = lotteryState.endTime - now;
    
    if (timeLeft <= 0) return 'Ended';

    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatAddress = (address) => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  };

  return (
    <div className="app">
      

      <main className="main">
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {graphData && (
          <div className="graph-container">
            <h2>Your Ticket Distribution</h2>
            <Graph data={graphData} />
          </div>
        )}

        <div className="lottery-status">
          <h2>Lottery Status</h2>
          <div className="status-grid">
            <div className="status-item">
              <span>Status:</span>
              <span className={lotteryState.isActive ? "active" : "inactive"}>
                {lotteryState.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="status-item">
              <span>Time Remaining:</span>
              <span>{formatTimeLeft()}</span>
            </div>
            <div className="status-item">
              <span>Participants:</span>
              <span>{lotteryState.participants}</span>
            </div>
          </div>
          
          <button 
            className="purchase-button" 
            onClick={() => setIsModalOpen(true)}
            disabled={!account || !lotteryState.isActive || loading}
          >
            Buy Tickets
          </button>
        </div>

      <div className="tickets-overview">
        <h3>Your Tickets</h3>
        <div className="tickets-grid">
          {tokens.map((token) => (
            <div key={token} className="ticket-card">
              <h4>{getTokenName(token)}</h4>
              <p>Tickets: {userTickets[token] || 0}</p>
              <p>Price: {formatTokenPrice(tokenConfigs[token]?.ticketPrice || '0', token)} tokens</p>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <PurchaseModal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          ticketPriceRaw={tokenConfigs[selectedToken]?.ticketPrice || 0}
          ticketPriceFormatted={formatTokenPrice(tokenConfigs[selectedToken]?.ticketPrice || "0.00", selectedToken)}
          ticketAmount={ticketAmount}
          setTicketAmount={setTicketAmount}
          buyTickets={buyTickets}
          selectedToken={selectedToken}
          setSelectedToken={setSelectedToken}
          tokens={tokens}
          tokenConfigs={tokenConfigs}
          loading={loading}
          userTickets={userTickets}
        />
      )}
      </main>

      
    </div>
  );
};

export default Ticket;