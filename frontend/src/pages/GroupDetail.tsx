import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface Member {
  id: string;
  name: string;
  email: string;
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  date: string;
}

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);

  useEffect(() => {
    // Fetch group details, members, and expenses
  }, [groupId]);

  return (
    <div className="group-detail-container">
      <div className="group-header">
        <h1>Group Name</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowAddExpense(true)}
        >
          Add Expense
        </button>
      </div>

      <div className="group-content">
        <div className="members-section">
          <h2>Members ({members.length})</h2>
          <ul className="members-list">
            {members.map(member => (
              <li key={member.id}>{member.name}</li>
            ))}
          </ul>
        </div>

        <div className="expenses-section">
          <h2>Expenses</h2>
          <div className="expenses-list">
            {expenses.length === 0 ? (
              <p>No expenses yet</p>
            ) : (
              expenses.map(expense => (
                <div key={expense.id} className="expense-item">
                  <h3>{expense.title}</h3>
                  <p>${expense.amount}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="settlement-section">
          <h2>Settlement Summary</h2>
          {/* Settlement details */}
        </div>
      </div>

      {showAddExpense && (
        <div className="modal">
          {/* Add/Edit expense form */}
        </div>
      )}
    </div>
  );
}
