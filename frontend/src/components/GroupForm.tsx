import React, { useState, useRef } from 'react';

interface GroupFormProps {
  onSubmit: (data: {
    name: string;
    description?: string;
    currency: string;
    billFile?: File;
  }) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  onCancel?: () => void;
}

export default function GroupForm({
  onSubmit,
  isLoading = false,
  error = '',
  onCancel,
}: GroupFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billPreview, setBillPreview] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Group name is required');
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        currency,
        billFile: billFile || undefined,
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to create group');
    }
  };

  const handleBillFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setFormError('Invalid file type. Please upload JPEG, PNG, or PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFormError('File is too large. Maximum size is 10MB');
      return;
    }

    setBillFile(file);
    setFormError('');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBillPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      setBillPreview('pdf');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleBillFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleBillFile(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {/* Basic Details Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Group Details</h3>

        <div style={styles.formGroup}>
          <label style={styles.label}>Group Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Goa Trip, Roommates, Family Vacation"
            disabled={isLoading}
            style={styles.input}
            maxLength={100}
          />
          <div style={styles.charCount}>{name.length} / 100</div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Description (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a note about this group"
            disabled={isLoading}
            style={styles.input}
            maxLength={300}
          />
          <div style={styles.charCount}>{description.length} / 300</div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Currency *</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={isLoading}
            style={styles.select}
          >
            <option value="INR">₹ INR</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
            <option value="GBP">£ GBP</option>
            <option value="AUD">A$ AUD</option>
          </select>
        </div>
      </div>

      {/* Bill Upload Section (Optional) */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Add Bill (Optional)</h3>
        <p style={styles.sectionDesc}>
          Upload a bill image and we'll automatically extract items and split them smartly based on member preferences.
        </p>

        <div
          style={{
            ...styles.dropZone,
            ...(dragActive && styles.dropZoneActive),
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={handleFileInput}
            disabled={isLoading}
            style={{ display: 'none' }}
          />

          {billFile && billPreview ? (
            <div style={styles.preview}>
              {billPreview !== 'pdf' ? (
                <img src={billPreview} alt="Bill" style={styles.previewImage} />
              ) : (
                <div style={styles.pdfPlaceholder}>📄 PDF</div>
              )}
              <div style={styles.previewInfo}>
                <div style={styles.previewName}>{billFile.name}</div>
                <div style={styles.previewSize}>
                  {(billFile.size / 1024).toFixed(1)} KB
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBillFile(null);
                    setBillPreview('');
                  }}
                  style={styles.removeBtn}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.emptyUpload}>
              <div style={styles.uploadIcon}>📸</div>
              <div style={styles.uploadText}>Drop a bill image here</div>
              <div style={styles.uploadHint}>
                JPEG, PNG, or PDF • Max 10MB
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error || formError ? (
        <div style={styles.errorBox}>
          <span style={styles.errorIcon}>⚠️</span>
          <span>{error || formError}</span>
        </div>
      ) : null}

      {/* Actions */}
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
          disabled={isLoading || !name.trim()}
          style={styles.submitBtn}
        >
          {isLoading ? 'Creating Group...' : 'Create Group'}
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
    maxWidth: '600px',
    margin: '0 auto',
  },
  section: {
    backgroundColor: 'rgba(212, 168, 71, 0.05)',
    border: '1px solid rgba(212, 168, 71, 0.15)',
    borderRadius: '8px',
    padding: '20px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#d4a847',
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: 'DM Mono, monospace',
  },
  sectionDesc: {
    fontSize: '12px',
    color: '#7a7570',
    margin: '0 0 16px 0',
    lineHeight: '1.5',
  },
  formGroup: {
    marginBottom: '16px',
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
    padding: '12px',
    fontSize: '13px',
    backgroundColor: '#161616',
    color: '#f0ede8',
    border: '1px solid rgba(212, 168, 71, 0.2)',
    borderRadius: '4px',
    fontFamily: 'Instrument Sans, sans-serif',
    outline: 'none',
  },
  select: {
    padding: '12px',
    fontSize: '13px',
    backgroundColor: '#161616',
    color: '#f0ede8',
    border: '1px solid rgba(212, 168, 71, 0.2)',
    borderRadius: '4px',
    fontFamily: 'Instrument Sans, sans-serif',
    cursor: 'pointer',
  },
  charCount: {
    fontSize: '11px',
    color: '#5a5550',
    textAlign: 'right',
    fontFamily: 'DM Mono, monospace',
  },
  dropZone: {
    border: '2px dashed rgba(212, 168, 71, 0.3)',
    borderRadius: '8px',
    padding: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: 'rgba(212, 168, 71, 0.02)',
    minHeight: '140px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropZoneActive: {
    borderColor: 'rgb(212, 168, 71)',
    backgroundColor: 'rgba(212, 168, 71, 0.08)',
  },
  emptyUpload: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
  },
  uploadIcon: {
    fontSize: '32px',
  },
  uploadText: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#f0ede8',
  },
  uploadHint: {
    fontSize: '11px',
    color: '#5a5550',
    fontFamily: 'DM Mono, monospace',
  },
  preview: {
    display: 'flex',
    gap: '12px',
    width: '100%',
    alignItems: 'flex-start',
  },
  previewImage: {
    maxWidth: '100px',
    maxHeight: '100px',
    borderRadius: '4px',
    border: '1px solid rgba(212, 168, 71, 0.2)',
    objectFit: 'cover',
  },
  pdfPlaceholder: {
    width: '100px',
    height: '100px',
    backgroundColor: 'rgba(212, 168, 71, 0.1)',
    border: '1px solid rgba(212, 168, 71, 0.2)',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  },
  previewInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  previewName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#f0ede8',
    wordBreak: 'break-word',
  },
  previewSize: {
    fontSize: '11px',
    color: '#7a7570',
    fontFamily: 'DM Mono, monospace',
  },
  removeBtn: {
    alignSelf: 'flex-start',
    padding: '6px 10px',
    fontSize: '11px',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    color: '#f87171',
    border: '1px solid rgba(248, 113, 113, 0.2)',
    borderRadius: '3px',
    cursor: 'pointer',
    fontFamily: 'DM Mono, monospace',
  },
  errorBox: {
    padding: '12px 14px',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    border: '1px solid rgba(248, 113, 113, 0.3)',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '12px',
    color: '#f87171',
  },
  errorIcon: {
    fontSize: '14px',
    flexShrink: 0,
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  submitBtn: {
    flex: 1,
    padding: '14px 20px',
    fontSize: '13px',
    fontWeight: '600',
    backgroundColor: '#d4a847',
    color: '#0e0e0e',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontFamily: 'Instrument Sans, sans-serif',
  },
  cancelBtn: {
    padding: '14px 20px',
    fontSize: '13px',
    fontWeight: '600',
    backgroundColor: 'transparent',
    color: '#7a7570',
    border: '1px solid rgba(212, 168, 71, 0.2)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'Instrument Sans, sans-serif',
  },
};
