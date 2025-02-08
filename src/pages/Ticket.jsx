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
  const [walletType, setWalletType] = useState(null);

  const handleError = (err, message) => {
    console.error(message, err);
    let userMessage = message;
    
    // Convert technical errors to user-friendly messages
    if (err.message.includes('unknown account #0')) {
      userMessage = 'Please connect your wallet to continue';
    } else if (err.code === 4902) {
      userMessage = 'Please add Avalanche Fuji network to your wallet';
    } else if (err.message.includes('user rejected')) {
      userMessage = 'Transaction was cancelled';
    } else if (err.message.includes('insufficient funds')) {
      userMessage = 'Insufficient balance to complete the transaction';
    }
    
    setError(userMessage);
    setLoading(false);
  };

  const switchToAvalancheFuji = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: AVALANCHE_TESTNET_PARAMS.chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [AVALANCHE_TESTNET_PARAMS],
          });
        } catch (addError) {
          handleError(addError, 'Failed to add Avalanche Fuji network');
        }
      } else {
        handleError(switchError, 'Failed to switch to Avalanche Fuji network');
      }
    }
  };

  const checkAndHandleNetwork = async () => {
    if (!provider) return;
    
    const network = await provider.getNetwork();
    if (network.chainId !== parseInt(AVALANCHE_TESTNET_PARAMS.chainId, 16)) {
      setError('Please switch to Avalanche Fuji Testnet');
      await switchToAvalancheFuji();
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
      handleError(err, 'Failed to update lottery state');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const detectWallet = async () => {
      if (typeof window.ethereum !== 'undefined') {
        setWalletType('metamask');
        await checkAndHandleNetwork();
      } else if (typeof window.core !== 'undefined') {
        setWalletType('core');
      } else {
        setError('Please install Core Wallet or MetaMask');
      }
    };

    detectWallet();
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!walletType) return;

      try {
        const walletProvider = walletType === 'core' 
          ? new ethers.providers.Web3Provider(window.core)
          : new ethers.providers.Web3Provider(window.ethereum);
        
        setProvider(walletProvider);

        if (walletType === 'metamask') {
          await checkAndHandleNetwork();
        }

        const signer = walletProvider.getSigner();
        const address = await signer.getAddress();
        
        if (!address) {
          return; // Exit if no address is available
        }

        const newContract = new ethers.Contract(LOTTERY_ADDRESS, LOTTERY_ABI, signer);
        setContract(newContract);
        setAccount(address);

        await updateLotteryState(newContract, address, signer);
      } catch (err) {
        if (err.message.includes('unknown account #0')) {
          return; // Silently return if wallet is not connected
        }
        handleError(err, 'Failed to initialize');
      }
    };

    init();
  }, [walletType]);

  useEffect(() => {
    if (!window.ethereum && !window.core) return;

    const provider = window.ethereum || window.core;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        try {
          const walletProvider = new ethers.providers.Web3Provider(provider);
          const signer = walletProvider.getSigner();
          if (signer && contract) {
            const newContract = contract.connect(signer);
            setContract(newContract);
            setAccount(accounts[0]);
            await updateLotteryState(newContract, accounts[0], signer);
          }
        } catch (err) {
          handleError(err, 'Failed to update account');
        }
      } else {
        setAccount('');
        setUserTickets({});
      }
    };

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', () => window.location.reload());

    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', () => {});
    };
  }, [provider, contract]);

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
      const signer = provider?.getSigner();
      if (!signer) throw new Error('No signer available');

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
      const ticketPriceWei = ethers.BigNumber.from(tokenConfig.ticketPrice);
      const ticketAmountBigInt = ethers.BigNumber.from(ticketAmount);
      const totalCostWei = ticketPriceWei.mul(ticketAmountBigInt);
  
      const balance = await tokenContract.balanceOf(await signer.getAddress());
      
      if (balance.lt(totalCostWei)) {
        throw new Error('Insufficient token balance');
      }
  
      const allowance = await tokenContract.allowance(
        await signer.getAddress(),
        contract.address
      );
  
      if (allowance.lt(totalCostWei)) {
        const approveTx = await tokenContract.approve(
          contract.address,
          totalCostWei,
          { gasLimit: 100000 }
        );
        await approveTx.wait();
      }
  
      const tx = await connectedContract.buyTickets(
        selectedToken,
        ticketAmount,
        { gasLimit: 300000 }
      );
  
      await tx.wait();
  
      setTicketAmount(1);
      await updateLotteryState(connectedContract, account, signer);
      setIsModalOpen(false);
    } catch (err) {
      handleError(err, 'Transaction failed');
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