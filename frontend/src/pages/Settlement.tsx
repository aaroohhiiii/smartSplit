import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export default function SettlementPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  useEffect(() => {
    // Fetch settlement data for group
  }, [groupId]);

  return (
    <div className="settlement-container">
      <div className="settlement-header">
        <h1>Settlement Summary</h1>
        <button className="btn-secondary">Recalculate Settlements</button>
      </div>

      <div className="settlements-list">
        {settlements.length === 0 ? (
          <p>All settled up!</p>
        ) : (
          settlements.map((settlement, idx) => (
            <div key={idx} className="settlement-item">
              <p><strong>{settlement.from}</strong> owes <strong>{settlement.to}</strong></p>
              <p className="amount">${settlement.amount}</p>
            </div>
          ))
        )}
      </div>

      <div className="settlement-history">
        <h2>Settlement History</h2>
        {/* Historical settlements */}
      </div>
    </div>
  );
}
