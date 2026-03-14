import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import BillUploadCard from '../components/BillUploadCard';
import BillParsingCard from '../components/BillParsingCard';
import BillExpenseForm from '../components/BillExpenseForm';
import { billService, BillStatus, BillItem } from '../services/billService';
import { groupService, Group } from '../services/groupService';

enum BillUploadStep {
  UPLOAD = 'upload',
  PARSING = 'parsing',
  CREATE_EXPENSE = 'create_expense',
  SUCCESS = 'success',
}

export default function BillUploadPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [step, setStep] = useState(BillUploadStep.UPLOAD);
  const [file, setFile] = useState<File | null>(null);
  const [billId, setBillId] = useState<string>('');
  const [group, setGroup] = useState<Group | null>(null);
  const [billStatus, setBillStatus] = useState<BillStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = getToken();

  // Fetch group details on mount
  useEffect(() => {
    if (groupId && token) {
      groupService
        .getGroupDetails(token as any, groupId)
        .then(setGroup)
        .catch((err) => setError(err.message));
    }
  }, [groupId, token]);

  // Handle file upload
  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setLoading(true);
    setError('');

    try {
      if (!groupId || !token) {
        throw new Error('Missing groupId or authentication');
      }

      // Upload bill
      const response = await billService.uploadBill(
        token as any,
        groupId,
        selectedFile
      );
      setBillId(response.billId);

      // Move to parsing step
      setStep(BillUploadStep.PARSING);

      // Poll for bill processing status
      const finalStatus = await billService.pollBillStatus(
        token as any,
        response.billId
      );
      setBillStatus(finalStatus);
    } catch (err: any) {
      setError(err.message || 'Failed to upload bill');
      setStep(BillUploadStep.UPLOAD);
    } finally {
      setLoading(false);
    }
  };

  // Handle confirmed bill items
  const handleConfirmItems = (selectedItems: BillItem[]) => {
    setStep(BillUploadStep.CREATE_EXPENSE);
  };

  // Handle expense creation
  const handleCreateExpense = async (expenseData: any) => {
    setLoading(true);
    setError('');

    try {
      if (!billId || !token) {
        throw new Error('Missing billId or authentication');
      }

      // TODO: Call expense creation endpoint
      // For now, just show success
      console.log('Creating expense:', expenseData);

      setStep(BillUploadStep.SUCCESS);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate(`/group/${groupId}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (step === BillUploadStep.UPLOAD) {
      navigate(`/group/${groupId}`);
    } else {
      setStep(BillUploadStep.UPLOAD);
      setFile(null);
      setBillId('');
      setBillStatus(null);
      setError('');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button
          onClick={() => navigate(`/group/${groupId}`)}
          style={styles.backBtn}
        >
          ← Back
        </button>
        <h1 style={styles.title}>Upload Bill</h1>
        <div></div>
      </div>

      <div style={styles.content}>
        {error && (
          <div style={styles.errorBox}>
            <span>⚠️</span>
            <div>
              <div style={styles.errorTitle}>Error</div>
              <div style={styles.errorMsg}>{error}</div>
            </div>
          </div>
        )}

        {step === BillUploadStep.UPLOAD && (
          <BillUploadCard
            onFileSelected={handleFileSelected}
            isLoading={loading}
            fileName={file?.name}
            error={error}
          />
        )}

        {step === BillUploadStep.PARSING && billStatus && (
          <div>
            <BillParsingCard
              items={billStatus.items || []}
              totalAmount={billStatus.totalAmount || 0}
              taxAmount={billStatus.taxAmount || 0}
              isLoading={loading}
              onConfirm={handleConfirmItems}
              onCancel={handleCancel}
            />
          </div>
        )}

        {step === BillUploadStep.CREATE_EXPENSE && billStatus && group && (
          <div>
            <BillExpenseForm
              groupId={groupId || ''}
              groupMembers={group.members}
              billItems={billStatus.items || []}
              billTotal={billStatus.totalAmount || 0}
              billTax={billStatus.taxAmount || 0}
              onSubmit={handleCreateExpense}
              isLoading={loading}
              error={error}
              onCancel={handleCancel}
            />
          </div>
        )}

        {step === BillUploadStep.SUCCESS && (
          <div style={styles.successBox}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>Expense Created!</h2>
            <p style={styles.successMsg}>
              Your expense has been created and split automatically.
            </p>
            <p style={styles.successSmall}>Redirecting...</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '32px',
    gap: '16px',
  },
  backBtn: {
    padding: '8px 12px',
    backgroundColor: 'rgba(212, 168, 71, 0.1)',
    color: '#d4a847',
    border: '1px solid rgba(212, 168, 71, 0.3)',
    borderRadius: '4px',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: 'Instrument Sans, sans-serif',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#f0ede8',
    margin: '0',
    fontFamily: 'Playfair Display, serif',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  errorBox: {
    padding: '16px',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    border: '1px solid rgba(248, 113, 113, 0.3)',
    borderRadius: '8px',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  errorTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#f87171',
  },
  errorMsg: {
    fontSize: '12px',
    color: '#f87171',
    marginTop: '4px',
  },
  successBox: {
    padding: '40px',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    border: '1px solid rgba(74, 222, 128, 0.3)',
    borderRadius: '8px',
    textAlign: 'center',
  },
  successIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  successTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#4ade80',
    margin: '0 0 8px 0',
  },
  successMsg: {
    fontSize: '14px',
    color: '#4ade80',
    margin: '0 0 4px 0',
  },
  successSmall: {
    fontSize: '12px',
    color: '#5a5550',
    margin: '0',
    marginTop: '8px',
  },
};
