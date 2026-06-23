import React from "react";
import { LogOut, ArrowLeft } from "lucide-react";
import "./OpponentLeftModal.css";

export default function OpponentLeftModal({ show, onClose }) {
  if (!show) return null;

  return (
    <div className="opponent-modal-overlay">
      <div className="opponent-modal">
        <div className="modal-icon">
          <LogOut size={64} />
        </div>

        <h2 className="modal-title">OPPONENT LEFT</h2>

        <p className="modal-message">
          Your opponent has left the match. The game has ended.
        </p>

        <button className="modal-btn" onClick={onClose}>
          <ArrowLeft size={20} />
          Return to Home
        </button>
      </div>
    </div>
  );
}
