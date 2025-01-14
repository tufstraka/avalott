// src/components/PurchaseModal.js
import React from "react";
import Modal from "react-modal";

Modal.setAppElement("#root");  // This ensures accessibility by specifying the app element

const PurchaseModal = ({ isOpen, onRequestClose, ticketPrice, ticketAmount, setTicketAmount, purchaseTicket, balance }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Purchase Tickets"
      className="modal"
      overlayClassName="modal-overlay"
    >
      <h2>Purchase Tickets</h2>
      <p>Current Balance: {balance} ETH</p>
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
      <p>Ticket Price: {ticketPrice} ETH</p>
      <button onClick={purchaseTicket}>Buy Ticket</button>
      <button onClick={onRequestClose}>Close</button>
    </Modal>
  );
};

export default PurchaseModal;
