import React, { useState, useEffect } from 'react';
import { BillItem } from '../services/billService';
import { Group, GroupMember } from '../services/groupService';

interface BillExpenseFormProps {
  groupId: string;
  groupMembers: GroupMember[];
  billItems: BillItem[];
  billTotal: number;
  billTax: number;
  onSubmit: (expenseData: any) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  onCancel?: () => void;
}

interface MemberAllocation {
  [memberId: string]: {
    name: string;
    share: number;
    owes: number;
  };
}

export default function BillExpenseForm({
  groupId,
  groupMembers,
  billItems,
  billTotal,
  billTax,
  onSubmit,
  isLoading = false,
  error = '',
  onCancel,
}: BillExpenseFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [paidBy, setPaidBy] = useState(groupMembers[0]?.userId || '');
  const [allocations, setAllocations] = useState<MemberAllocation>({});
  const [formError, setFormError] = useState('');

  // Initialize allocations based on item categories and preferences
  useEffect(() => {
    const newAllocations: MemberAllocation = {};
    groupMembers.forEach((member) => {
      newAllocations[member.userId] = {
        name: member.userId,
        share: 0,
        owes: 0,
      };
    });

    // Allocate items based on category
    billItems.forEach((item) => {
      let eligibleMembers: GroupMember[] = [];

      switch (item.category) {
        case 'veg':
          // All members can have veg
          eligibleMembers = groupMembers;
          break;
        case 'non_veg':
          // Only non-vegetarians
          eligibleMembers = groupMembers.filter((m) => !m.isVegetarian);
          if (eligibleMembers.length === 0) eligibleMembers = groupMembers; // fallback
          break;
        case 'alcohol':
          // Only members who drink
          eligibleMembers = groupMembers.filter((m) => m.drinksAlcohol);
          if (eligibleMembers.length === 0) eligibleMembers = groupMembers; // fallback
          break;
        case 'shared':
        default:
          // All members
          eligibleMembers = groupMembers;
          break;
      }

      // Split item among eligible members
      const perPersonAmount = item.amount / eligibleMembers.length;
      eligibleMembers.forEach((member) => {
        newAllocations[member.userId].share += perPersonAmount;
        newAllocations[member.userId].owes += perPersonAmount;
      });
    });

    setAllocations(newAllocations);
  }, [billItems, groupMembers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Expense title is required');
      return;
    }

    if (!paidBy) {
      setFormError('Please select who paid');
      return;
    }

    try {
      // Prepare expense data
      const expenseItems = billItems.map((item) => {
        // Find members who should be charged for this item
        const eligibleMembers: GroupMember[] = [];

        switch (item.category) {
          case 'veg':
            eligibleMembers.push(...groupMembers);
            break;
          case 'non_veg':
            eligibleMembers.push(...groupMembers.filter((m) => !m.isVegetarian));
            if (eligibleMembers.length === 0) {
              eligibleMembers.push(...groupMembers);
            }
            break;
          case 'alcohol':
            eligibleMembers.push(...groupMembers.filter((m) => m.drinksAlcohol));
            if (eligibleMembers.length === 0) {
              eligibleMembers.push(...groupMembers);
            }
            break;
          case 'shared':
          default:
            eligibleMembers.push(...groupMembers);
            break;
        }

        return {
          name: item.name,
          amount: item.amount,
          category: item.category.toUpperCase(),
          sharedBy: eligibleMembers.map((m) => m.userId),
        };
      });

      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        paidBy,
        items: expenseItems,
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to create expense');
    }
  };

  const totalAmount = billTotal + billTax;
  const userOwes = allocations[paidBy]?.owes || 0;
  const shouldReceive = totalAmount - userOwes;

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Expense Details</h3>

        <div style={styles.formGroup}>
          <label style={styles.label}>Expense Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Dinner at Thalassa"
            disabled={isLoading}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Description (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add notes about this expense"
            disabled={isLoading}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Who Paid?</label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            disabled={isLoading}
            style={styles.select}
          >
            {groupMembers.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.userId}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Item Allocation</h3>
        <div style={styles.allocationList}>
          {billItems.map((item, idx) => (
            <div key={idx} style={styles.allocationRow}>
              <div style={styles.allocationLeft}>
                <div style={styles.allocationName}>{item.name}</div>
                <div style={styles.allocationCategory}>
                  {item.category.toUpperCase()}
                </div>
              </div>
              <div style={styles.allocationAmount}>
                ₹{item.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Summary</h3>
        <div style={styles.summaryBox}>
          <div style={styles.summaryRow}>
            <span>Subtotal</span>
            <span>₹{billTotal.toFixed(2)}</span>
          </div>
          <div style={styles.summaryRow}>
            <span>Tax</span>
            <span>₹{billTax.toFixed(2)}</span>
          </div>
          <div style={styles.summaryDivider}></div>
          <div style={styles.summaryRowBold}>
            <span>Total</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </div>
          {shouldReceive > 0 && (
            <div style={styles.summaryInfo}>
              {groupMembers.find((m) => m.userId === paidBy)?.userId} will
              <span style={styles.highlightAmount}>
                receive ₹{shouldReceive.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {error || formError ? (
        <div style={styles.errorBox}>
          <span style={styles.errorIcon}>⚠️</span>
          <span>{error || formError}</span>
        </div>
      ) : null}

      <div style={styles.actions}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={styles.cancelBtn}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || !title.trim()}
          style={styles.submitBtn}
        >
          {isLoading ? 'Creating Expense...' : 'Create Expense'}
        </button>
      </div>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  section: {
    backgroundColor: 'rgba(212, 168, 71, 0.05)',
    border: '1px solid rgba(212, 168, 71, 0.15)',
    borderRadius: '8px',
    padding: '16px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#d4a847',
    margin: '0 0 12px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: 'DM Mono, monospace',
  },
  formGroup: {
    marginBottom: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#f0ede8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: 'DM Mono, monospace',
  },
  input: {
    padding: '10px 12px',
    fontSize: '13px',
    backgroundColor: '#161616',
    color: '#f0ede8',
    border: '1px solid rgba(212, 168, 71, 0.2)',
    borderRadius: '4px',
    fontFamily: 'Instrument Sans, sans-serif',
    outline: 'none',
  },
  select: {
    padding: '10px 12px',
    fontSize: '13px',
    backgroundColor: '#161616',
    color: '#f0ede8',
    border: '1px solid rgba(212, 168, 71, 0.2)',
    borderRadius: '4px',
    fontFamily: 'Instrument Sans, sans-serif',
    cursor: 'pointer',
  },
  allocationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  allocationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    borderBottom: '1px solid rgba(212, 168, 71, 0.1)',
  },
  allocationLeft: {
    flex: 1,
  },
  allocationName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#f0ede8',
    margin: '0 0 4px 0',
  },
  allocationCategory: {
    fontSize: '11px',
    color: '#d4a847',
    fontFamily: 'DM Mono, monospace',
  },
  allocationAmount: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#d4a847',
    minWidth: '70px',
    textAlign: 'right',
    fontFamily: 'DM Mono, monospace',
  },
  summaryBox: {
    backgroundColor: 'rgba(22, 22, 22, 0.5)',
    borderRadius: '4px',
    padding: '12px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#7a7570',
    margin: '6px 0',
    fontFamily: 'DM Mono, monospace',
  },
  summaryRowBold: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    fontWeight: '600',
    color: '#d4a847',
    margin: '8px 0',
    fontFamily: 'DM Mono, monospace',
  },
  summaryDivider: {
    height: '1px',
    backgroundColor: 'rgba(212, 168, 71, 0.1)',
    margin: '8px 0',
  },
  summaryInfo: {
    fontSize: '12px',
    color: '#7a7570',
    marginTop: '8px',
    padding: '8px',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderRadius: '3px',
  },
  highlightAmount: {
    color: '#4ade80',
    fontWeight: '600',
    margin: '0 4px',
    fontFamily: 'DM Mono, monospace',
  },
  errorBox: {
    padding: '10px 12px',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    border: '1px solid rgba(248, 113, 113, 0.3)',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#f87171',
  },
  errorIcon: {
    fontSize: '14px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  submitBtn: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: '600',
    backgroundColor: '#d4a847',
    color: '#0e0e0e',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  cancelBtn: {
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: '600',
    backgroundColor: 'transparent',
    color: '#7a7570',
    border: '1px solid rgba(212, 168, 71, 0.2)',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};
