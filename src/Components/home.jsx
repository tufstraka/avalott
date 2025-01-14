import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import "./css/home.css"
import LOTTERY_ABI_ARTIFACT from './MultiTokenLottery.json';



const LOTTERY_ABI = LOTTERY_ABI_ARTIFACT.abi;

const Home = () => {
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [endTime, setEndTime] = useState(0);
  const [tokens, setTokens] = useState([]);
  const [tokenConfigs, setTokenConfigs] = useState({});
  const [selectedToken, setSelectedToken] = useState('');
  const [ticketAmount, setTicketAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [participants, setParticipants] = useState(0);
  const [userTickets, setUserTickets] = useState({});
  
  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const newProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(newProvider);

          const accounts = await newProvider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0].address);

            const contractAddress = '0x21C4432DD0e56242A5aBB19b482470A7C2Bb4A0c';
            const newContract = new ethers.Contract(contractAddress, LOTTERY_ABI, newProvider);
            setContract(newContract);

            await updateLotteryState(newContract, accounts[0].address);
          }
        } catch (err) {
          handleError(err, 'Failed to initialize');
        }
      } else {
        setError('Please install MetaMask');
      }
    };

    init();
  }, []);

  const handleError = (err, message) => {
    console.error(message, err);
    setError(`${message}: ${err.message}`);
  };

  const updateLotteryState = async (contractInstance, userAccount) => {
    if (!contractInstance || !userAccount) return;

    try {
      const [active, lotteryEndTime, availableTokens, participantCount] = await Promise.all([
        contractInstance.lotteryActive(),
        contractInstance.lotteryEndTime(),
        contractInstance.getTokens(),
        contractInstance.getParticipantCount(),
      ]);

      setIsActive(active);
      setEndTime(Number(lotteryEndTime));
      setTokens(availableTokens);
      setParticipants(Number(participantCount));

      const configs = {};
      const tickets = {};

      for (const token of availableTokens) {
        const config = await contractInstance.supportedTokens(token);
        configs[token] = {
          isActive: config.isActive,
          ticketPrice: formatTicketPrice(Number(config.ticketPrice)),
          totalTickets: Number(config.totalTickets),
        };

        const userTicketCount = await contractInstance.ticketHoldings(token, userAccount);
        tickets[token] = Number(userTicketCount);
      }

      setTokenConfigs(configs);
      setUserTickets(tickets);
    } catch (err) {
      handleError(err, 'Failed to update lottery state');
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await provider.listAccounts();
        setAccount(accounts[0].address);
        await updateLotteryState(contract, accounts[0].address);
      }
    } catch (err) {
      handleError(err, 'Failed to connect wallet');
    }
  };

  const formatTicketPrice = (priceInWei, decimals = 6 ) => {
    if (!priceInWei || priceInWei <= 0) {
      console.error('Invalid ticket price:', priceInWei);
      return '0.0000'; 
    }

    try {
      const price = ethers.formatUnits(priceInWei, decimals);
      return parseFloat(price).toFixed(2); 
    } catch (err) {
      console.error('Error formatting ticket price:', err);
      return '0.0000'; 
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setContract(null);
    setAccount('');
    setIsActive(false);
    setEndTime(0);
    setTokens([]);
    setTokenConfigs({});
    setUserTickets({});
    setError('');
  };

  const buyTickets = async () => {
    if (!contract || !selectedToken || !ticketAmount) return;
  
    setLoading(true);
    setError('');
  
    try {
      const signer = await provider.getSigner();
      const connectedContract = contract.connect(signer);
  
      const tokenContract = new ethers.Contract(
        selectedToken,
        ['function allowance(address owner, address spender) view returns (uint256)',
         'function approve(address spender, uint256 amount) public returns (bool)'],
        signer
      );
  
      const totalCost = tokenConfigs[selectedToken].ticketPrice * Number(ticketAmount);
  
      const allowance = await tokenContract.allowance(account, contract.target);
  
      if (allowance < totalCost) {
        const approveTx = await tokenContract.approve(contract.target, totalCost);
        await approveTx.wait();
        console.log('Allowance granted');
      } else {
        console.log('Sufficient allowance already granted');
      }
  
      const tx = await connectedContract.buyTickets(selectedToken, ticketAmount);
      await tx.wait();
  
      setTicketAmount('');
      await updateLotteryState(contract, account);
    } catch (err) {
      handleError(err, 'Failed to buy tickets');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeLeft = () => {
    if (!endTime) return 'Not started';
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = endTime - now;
    if (timeLeft <= 0) return 'Ended';

    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  return (
    <div className="app">
      <header className="header">
        <h1>Lottery-DAO</h1>
        <button className="wallet-button" onClick={connectWallet}>
          {account ? "Wallet Connected" : "Connect Wallet"}
        </button>
      </header>

      <main className="main">
        <div className="lottery-status">
          <h2>Lottery Status</h2>
          <p>
            Current Status: <span className={isActive ? "active" : "inactive"}>{isActive ? "Active" : "Inactive"}</span>
          </p>
          <p>Next Draw: <b>January 20, 2025</b></p>
          <p>Time Remaining: <b>{formatTimeLeft()}</b></p>
        </div>

        <div className="token-selection">
          <label htmlFor="token-select">Select Token:</label>
          <select
            id="token-select"
            value={selectedToken || ""}
            onChange={(e) => setSelectedToken(e.target.value)}
          >
            <option value="" disabled>
              Choose a token
            </option>
            {tokens.length > 0 ? (
              tokens.map((token) => (
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
          <p>Wallet Balance: {userTickets[selectedToken] || 0} Tickets</p>
          <input
            type="number"
            placeholder="Ticket Amount"
            value={ticketAmount}
            onChange={(e) => setTicketAmount(e.target.value)}
            disabled={loading}
          />
          <button className="purchase-button" onClick={buyTickets} disabled={loading}>
            {loading ? 'Processing...' : `Buy Ticket (${tokenConfigs[selectedToken]?.ticketPrice || '0.00'} ETH)`}
          </button>
          <p>Total Tickets Purchased: {userTickets[selectedToken] || 0}</p>
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
