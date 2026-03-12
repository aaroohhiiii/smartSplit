import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface ExpenseItem {
  name: string;
  amount: number;
  category: string;
  sharedBy: string[];
}

interface Expense {
  id: string;
  title: string;
  paidBy: string;
  currency: string;
  totalAmount: number;
  taxAmount: number;
  items: ExpenseItem[];
  createdAt: string;
}

export default function ExpenseDetailPage() {
  const { expenseId } = useParams<{ expenseId: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);

  useEffect(() => {
    // Fetch expense details
  }, [expenseId]);

  if (!expense) return <div>Loading...</div>;

  return (
    <div className="expense-detail-container">
      <div className="expense-header">
        <h1>{expense.title}</h1>
        <div className="expense-actions">
          <button className="btn-secondary">Edit</button>
          <button className="btn-danger">Delete</button>
        </div>
      </div>

      <div className="expense-info">
        <p><strong>Paid by:</strong> {expense.paidBy}</p>
        <p><strong>Date:</strong> {new Date(expense.createdAt).toLocaleDateString()}</p>
        <p><strong>Currency:</strong> {expense.currency}</p>
      </div>

      <div className="expense-items">
        <h2>Items</h2>
        {expense.items.map((item, idx) => (
          <div key={idx} className="item-detail">
            <h3>{item.name}</h3>
            <p>${item.amount} ({item.category})</p>
            <p>Shared by: {item.sharedBy.join(', ')}</p>
          </div>
        ))}
      </div>

      <div className="expense-breakdown">
        <h2>Who Owes What</h2>
        {/* Breakdown of who owes whom */}
      </div>

      <div className="expense-total">
        <p>Tax: ${expense.taxAmount}</p>
        <h3>Total: ${expense.totalAmount}</h3>
      </div>
    </div>
  );
}
