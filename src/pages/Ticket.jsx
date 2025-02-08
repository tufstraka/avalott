import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LOTTERY_ABI_ARTIFACT from '../deployments/MultiTokenLottery.json';
import PurchaseModal from '../components/PurchaseModal';
import Graph from '../components/graph';
import { getTokenName } from '../utils/helpers';
import './css/ticket.css';

const LOTTERY_ABI = LOTTERY_ABI_ARTIFACT.abi;
const LOTTERY_ADDRESS = '0xeADD42c14c50397E64b4dc94a4beD91175c1E011';
const AVALANCHE_TESTNET_PARAMS = {
  chainId: '0xA869',
  chainName: 'Avalanche Fuji Testnet',
  nativeCurrency: {
    name: 'AVAX',
    symbol: 'AVAX',
    decimals: 18
  },
  rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://testnet.snowtrace.io/']
};

const ERC20_ABI = [
  'function decimals() view returns (uint8)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)'
];

const Ticket = () => {
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

  const handleError = (err) => {
    console.error('Error:', err);
    let userMessage = 'An error occurred';
    
    if (err.code === 4001) {
      userMessage = 'Transaction rejected by user';
    } else if (err.code === -32603) {
      userMessage = 'Internal JSON-RPC error';
    } else if (err.message?.includes('insufficient funds')) {
      userMessage = 'Insufficient balance';
    } else if (err.message?.includes('user rejected')) {
      userMessage = 'Action cancelled by user';
    }
    
    setError(userMessage);
    setLoading(false);
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask');
      }

      setLoading(true);
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await web3Provider.getNetwork();
      
      if (network.chainId !== parseInt(AVALANCHE_TESTNET_PARAMS.chainId, 16)) {
        await switchNetwork();
      }

      setProvider(web3Provider);
      setAccount(accounts[0]);
      
      const signer = web3Provider.getSigner();
      const lotteryContract = new ethers.Contract(LOTTERY_ADDRESS, LOTTERY_ABI, signer);
      setContract(lotteryContract);

      return { signer, lotteryContract, account: accounts[0] };
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: AVALANCHE_TESTNET_PARAMS.chainId }],
      });
    } catch (err) {
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [AVALANCHE_TESTNET_PARAMS],
          });
        } catch (addErr) {
          handleError(addErr);
        }
      } else {
        handleError(err);
      }
    }
  };

  const updateLotteryState = async () => {
    if (!contract || !account) return;

    try {
      setLoading(true);
      
      const [active, endTime, participantCount, availableTokens] = await Promise.all([
        contract.lotteryActive(),
        contract.lotteryEndTime(),
        contract.getParticipantCount(),
        contract.getTokens()
      ].map(p => p.catch(e => null)));

      if (!active || !endTime || !participantCount || !availableTokens) {
        throw new Error('Failed to fetch lottery state');
      }

      setLotteryState({
        isActive: active,
        endTime: endTime.toNumber(),
        participants: participantCount.toNumber()
      });

      setTokens(availableTokens);

      const configs = {};
      const tickets = {};

      for (const token of availableTokens) {
        try {
          const tokenContract = new ethers.Contract(token, ERC20_ABI, provider.getSigner());
          
          const [config, userTicketCount, decimals] = await Promise.all([
            contract.supportedTokens(token),
            contract.ticketHoldings(token, account),
            tokenContract.decimals()
          ]);

          configs[token] = {
            isActive: config.isActive,
            ticketPrice: config.ticketPrice.toString(),
            totalTickets: config.totalTickets.toNumber(),
            decimals
          };

          tickets[token] = userTicketCount.toNumber();
        } catch (err) {
          console.error(`Error loading token ${token}:`, err);
          configs[token] = {
            isActive: false,
            ticketPrice: '0',
            totalTickets: 0,
            decimals: 18
          };
          tickets[token] = 0;
        }
      }

      setTokenConfigs(configs);
      setUserTickets(tickets);

      if (availableTokens.length > 0 && !selectedToken) {
        setSelectedToken(availableTokens[0]);
      }

      setGraphData({
        values: availableTokens.map(token => tickets[token] || 0)
      });
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const connection = await connectWallet();
      if (connection) {
        await updateLotteryState();
      }
    };

    init();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length > 0) {
          await connectWallet();
        } else {
          setAccount('');
          setUserTickets({});
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      return () => {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      };
    }
  }, []);

  const buyTickets = async () => {
    if (!contract || !selectedToken || !ticketAmount || !tokenConfigs[selectedToken]) {
      setError('Invalid selection');
      return;
    }

    if (ticketAmount <= 0) {
      setError('Invalid ticket amount');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (!lotteryState.isActive) {
        throw new Error('Lottery is not active');
      }

      if (Date.now() / 1000 > lotteryState.endTime) {
        throw new Error('Lottery has ended');
      }

      const tokenContract = new ethers.Contract(
        selectedToken,
        ERC20_ABI,
        provider.getSigner()
      );

      const tokenConfig = tokenConfigs[selectedToken];
      const ticketPrice = ethers.BigNumber.from(tokenConfig.ticketPrice);
      const amount = ethers.BigNumber.from(ticketAmount);
      const totalCost = ticketPrice.mul(amount);

      // Check balance
      const balance = await tokenContract.balanceOf(account);
      if (balance.lt(totalCost)) {
        throw new Error('Insufficient token balance');
      }

      // Check and set allowance
      const allowance = await tokenContract.allowance(account, LOTTERY_ADDRESS);
      if (allowance.lt(totalCost)) {
        const approveTx = await tokenContract.approve(LOTTERY_ADDRESS, totalCost);
        await approveTx.wait();
      }

      // Buy tickets
      const buyTx = await contract.buyTickets(selectedToken, ticketAmount, {
        gasLimit: 300000
      });
      await buyTx.wait();

      setTicketAmount(1);
      await updateLotteryState();
      setIsModalOpen(false);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTokenPrice = (price, token) => {
    if (!tokenConfigs[token]) return '0.00';
    const decimals = tokenConfigs[token].decimals || 18;
    return ethers.utils.formatUnits(price, decimals);
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
            {loading ? 'Processing...' : 'Buy Tickets'}
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