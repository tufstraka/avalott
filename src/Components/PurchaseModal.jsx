import React from "react";
import Modal from "react-modal";

Modal.setAppElement("#root");  // This ensures accessibility by specifying the app element

const PurchaseModal = ({
  isOpen,
  onRequestClose,
  ticketPrice,
  ticketAmount,
  setTicketAmount,
  buyTicket,
  balance,
  selectedToken,
  setSelectedToken
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Purchase Tickets"
      className="modal"
      overlayClassName="modal-overlay"
    >
      <h2>Purchase Tickets</h2>
      <div className="balance-info">
        <p>Current Balance: {balance} {selectedToken}</p>
        <div className="token-selection">
          <label htmlFor="token">Select Token:</label>
          <select
            id="token"
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
          >
            <option value="USDT">USDT</option>
            <option value="USDC">USDC</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="ticketAmount">Ticket Amount:</label>
        <input
          type="number"
          id="ticketAmount"
          value={ticketAmount}
          onChange={(e) => setTicketAmount(e.target.value)}
          min="1"
        />
      </div>
      <p>Ticket Price: {ticketPrice} {selectedToken}</p>
      <button onClick={buyTicket} className="but1">Buy Ticket</button>
      <button onClick={onRequestClose} className="but1">Close</button>
    </Modal>
  );
};

export default PurchaseModal;
