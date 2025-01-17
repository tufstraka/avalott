import React from "react";
import Modal from "react-modal";
import "./css/Modal.css";
import { getTokenName } from "../utils/helpers";

// Set app element for accessibility
Modal.setAppElement("#root");
const PurchaseModal = ({
  isOpen,
  onRequestClose,
  ticketPriceRaw,
  ticketPriceFormatted,
  ticketAmount,
  setTicketAmount,
  buyTickets,
  selectedToken,
  setSelectedToken,
  tokens,
  tokenConfigs,
  loading,
  userTickets,
}) => {
  const handleAmountChange = (e) => {
    const value = Math.max(1, Math.floor(Number(e.target.value)));
    setTicketAmount(value);
  };

  const calculateTotalCost = () => {
    if (!selectedToken || ticketAmount < 1) return "0.00";
  
    // Step 1: Remove non-numeric characters from the formatted price
    const cleanedPrice = ticketPriceFormatted.replace(/[^0-9.]/g, '');
  
    // Step 2: Convert the cleaned string to a number
    const priceAsNumber = parseFloat(cleanedPrice);
  
    // Step 3: Validate the number
    if (isNaN(priceAsNumber)) {
      console.error("Invalid ticket price format:", ticketPriceFormatted);
      return "0.00";
    }
  
    // Step 4: Calculate the total cost
    const total = priceAsNumber * ticketAmount;
  
    // Step 5: Format the total to 4 decimal places
    const formattedTotal = total.toFixed(4);
  
    return formattedTotal;
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Purchase Tickets"
      className="modal"
      overlayClassName="modal-overlay"
    >
      <div className="modal-content">
        <h2 className="modal-title">Buy Lottery Tickets</h2>

        <div className="modal-body">
          <div className="token-selection-container">
            <label htmlFor="token" className="input-label">
              Select Token:
            </label>
            <select
              id="token"
              className="token-select"
              value={selectedToken}
              onChange={(e) => {
                setSelectedToken(e.target.value);
                setTicketAmount(1);
              }}
              disabled={loading}
            >
              <option value="">Select a token</option>
              {tokens.map((token) => (
                <option key={token} value={token}>
                  {getTokenName(token)}
                </option>
              ))}
            </select>
          </div>

          {selectedToken && tokenConfigs[selectedToken] && (
            <>
              <div className="ticket-info">
                <p className="info-item">
                  <span>Your Tickets:</span>
                  <span>{userTickets[selectedToken] || 0}</span>
                </p>
                <p className="info-item">
                  <span>Price per Ticket:</span>
                  <span>{ticketPriceFormatted}</span>
                </p>
              </div>

              <div className="amount-input-container">
                <label htmlFor="ticketAmount" className="input-label">
                  Number of Tickets:
                </label>
                <input
                  type="number"
                  id="ticketAmount"
                  className="amount-input"
                  value={ticketAmount}
                  onChange={handleAmountChange}
                  min="1"
                  step="1"
                  disabled={loading}
                />
              </div>

              <div className="total-cost">
                <p className="info-item">
                  <span>Total Cost:</span>
                  <span>{calculateTotalCost()} </span>
                </p>
              </div>
            </>
          )}

          <div className="modal-actions">
            <button
              className="purchase-button"
              onClick={buyTickets}
              disabled={!selectedToken || loading || ticketAmount < 1}
            >
              {loading ? (
                <span className="loading-text">Processing...</span>
              ) : (
                <span>Buy Tickets</span>
              )}
            </button>
            
            <button 
              className="cancel-button"
              onClick={onRequestClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default PurchaseModal;