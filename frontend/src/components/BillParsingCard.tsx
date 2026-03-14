import React, { useState } from 'react';
import { BillItem } from '../services/billService';

interface BillParsingCardProps {
  items: BillItem[];
  totalAmount: number;
  taxAmount: number;
  isLoading?: boolean;
  onConfirm: (selectedItems: BillItem[]) => void;
  onCancel?: () => void;
}

interface ItemState {
  [key: number]: {
    selected: boolean;
    category: string;
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  veg: '#4ade80',
  non_veg: '#f87171',
  alcohol: '#fbbf24',
  shared: '#60a5fa',
};

const CATEGORY_LABELS: Record<string, string> = {
  veg: '🥬 Veg',
  non_veg: '🍗 Non-Veg',
  alcohol: '🍺 Alcohol',
  shared: '🍶 Shared',
};

export default function BillParsingCard({
  items,
  totalAmount,
  taxAmount,
  isLoading = false,
  onConfirm,
  onCancel,
}: BillParsingCardProps) {
  const [itemStates, setItemStates] = useState<ItemState>(() => {
    const initial: ItemState = {};
    items.forEach((item, idx) => {
      initial[idx] = {
        selected: true,
        category: item.category,
      };
    });
    return initial;
  });

  const handleToggleItem = (idx: number) => {
    setItemStates((prev) => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        selected: !prev[idx].selected,
      },
    }));
  };

  const handleCategoryChange = (idx: number, newCategory: string) => {
    setItemStates((prev) => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        category: newCategory,
      },
    }));
  };

  const selectedItems = items
    .map((item, idx) => ({
      ...item,
      category: itemStates[idx]?.category || item.category,
    }))
    .filter((_, idx) => itemStates[idx]?.selected);

  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Parsed Bill Items</h3>
        <div style={styles.badge}>✓ {items.length} items</div>
      </div>

      <div style={styles.itemsList}>
        {items.map((item, idx) => (
          <div key={idx} style={styles.itemRow}>
            <div style={styles.itemCheck}>
              <input
                type="checkbox"
                checked={itemStates[idx]?.selected || false}
                onChange={() => handleToggleItem(idx)}
                disabled={isLoading}
                style={styles.checkbox}
              />
            </div>

            <div style={styles.itemDetails}>
              <div style={styles.itemName}>{item.name}</div>
              <div style={styles.itemMeta}>
                Amount: ₹{item.amount.toFixed(2)}
              </div>
            </div>

            <select
              value={itemStates[idx]?.category || item.category}
              onChange={(e) => handleCategoryChange(idx, e.target.value)}
              disabled={isLoading}
              style={{
                ...styles.categorySelect,
                borderColor: CATEGORY_COLORS[itemStates[idx]?.category || item.category],
              }}
            >
              <option value="veg">🥬 Veg</option>
              <option value="non_veg">🍗 Non-Veg</option>
              <option value="alcohol">🍺 Alcohol</option>
              <option value="shared">🍶 Shared</option>
            </select>

            <div
              style={{
                ...styles.itemAmount,
                color: itemStates[idx]?.selected ? '#d4a847' : '#5a5550',
              }}
            >
              ₹{item.amount.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.summary}>
        <div style={styles.summaryRow}>
          <span>Subtotal</span>
          <span>₹{selectedTotal.toFixed(2)}</span>
        </div>
        <div style={styles.summaryRow}>
          <span>Tax</span>
          <span>₹{taxAmount.toFixed(2)}</span>
        </div>
        <div style={styles.summaryDivider}></div>
        <div style={styles.summaryRowTotal}>
          <span>Total</span>
          <span>₹{(selectedTotal + taxAmount).toFixed(2)}</span>
        </div>
      </div>

      <div style={styles.actions}>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isLoading}
            style={styles.cancelBtn}
          >
            Cancel
          </button>
        )}
        <button
          onClick={() => onConfirm(selectedItems as BillItem[])}
          disabled={isLoading || selectedItems.length === 0}
          style={styles.confirmBtn}
        >
          {isLoading ? 'Processing...' : 'Use These Items'}
        </button>
      </div>

      {selectedItems.length === 0 && (
        <div style={styles.warningBox}>
          <span>⚠️</span>
          <span>Please select at least one item</span>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: 'rgba(212, 168, 71, 0.05)',
    border: '1px solid rgba(212, 168, 71, 0.2)',
    borderRadius: '8px',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#f0ede8',
    margin: '0',
  },
  badge: {
    fontSize: '12px',
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    color: '#4ade80',
    padding: '4px 8px',
    borderRadius: '4px',
    fontFamily: 'DM Mono, monospace',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    marginBottom: '16px',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderBottom: '1px solid rgba(212, 168, 71, 0.1)',
  },
  itemCheck: {
    flexShrink: 0,
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#d4a847',
  },
  itemDetails: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#f0ede8',
    margin: '0 0 4px 0',
    wordBreak: 'break-word',
  },
  itemMeta: {
    fontSize: '11px',
    color: '#7a7570',
    margin: '0',
    fontFamily: 'DM Mono, monospace',
  },
  categorySelect: {
    padding: '6px 8px',
    fontSize: '12px',
    backgroundColor: '#1e1e1e',
    color: '#f0ede8',
    border: '1px solid',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'Instrument Sans, sans-serif',
  },
  itemAmount: {
    fontSize: '13px',
    fontWeight: '600',
    minWidth: '60px',
    textAlign: 'right',
    fontFamily: 'DM Mono, monospace',
  },
  summary: {
    backgroundColor: 'rgba(22, 22, 22, 0.5)',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '16px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#7a7570',
    margin: '6px 0',
    fontFamily: 'DM Mono, monospace',
  },
  summaryRowTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    fontWeight: '600',
    color: '#d4a847',
    margin: '6px 0',
    fontFamily: 'DM Mono, monospace',
  },
  summaryDivider: {
    height: '1px',
    backgroundColor: 'rgba(212, 168, 71, 0.1)',
    margin: '8px 0',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  confirmBtn: {
    flex: 1,
    padding: '10px 14px',
    backgroundColor: '#d4a847',
    color: '#0e0e0e',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  cancelBtn: {
    padding: '10px 14px',
    backgroundColor: 'transparent',
    color: '#7a7570',
    border: '1px solid rgba(212, 168, 71, 0.2)',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  warningBox: {
    marginTop: '12px',
    padding: '10px 12px',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    border: '1px solid rgba(248, 113, 113, 0.2)',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#f87171',
  },
};
