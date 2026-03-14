import React, { useState, useRef } from 'react';

interface BillUploadCardProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
  error?: string;
  fileName?: string;
}

export default function BillUploadCard({
  onFileSelected,
  isLoading = false,
  error = '',
  fileName = '',
}: BillUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      console.error('Invalid file type. Please upload JPEG, PNG, or PDF');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error('File is too large. Maximum size is 10MB');
      return;
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      setPreview('pdf'); // Placeholder for PDF
    }

    onFileSelected(file);
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
      handleFile(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.uploadZone,
          ...(dragActive && styles.uploadZoneActive),
          ...(isLoading && styles.uploadZoneDisabled),
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
          onChange={handleInputChange}
          disabled={isLoading}
          style={{ display: 'none' }}
        />

        {isLoading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Analyzing bill...</p>
          </div>
        ) : preview && fileName ? (
          <div style={styles.previewState}>
            {preview !== 'pdf' ? (
              <img src={preview} alt="Bill preview" style={styles.previewImage} />
            ) : (
              <div style={styles.pdfIcon}>📄</div>
            )}
            <p style={styles.fileName}>{fileName}</p>
            <p style={styles.changeText}>Click to change</p>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.uploadIcon}>📸</div>
            <p style={styles.uploadTitle}>Upload a Bill</p>
            <p style={styles.uploadDesc}>
              Drop an image or PDF here, or click to browse
            </p>
            <p style={styles.uploadHint}>
              JPEG, PNG, or PDF • Max 10MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div style={styles.errorBox}>
          <span style={styles.errorIcon}>⚠️</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
  },
  uploadZone: {
    border: '2px dashed rgba(212, 168, 71, 0.3)',
    borderRadius: '8px',
    padding: '32px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: 'rgba(212, 168, 71, 0.02)',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadZoneActive: {
    borderColor: 'rgb(212, 168, 71)',
    backgroundColor: 'rgba(212, 168, 71, 0.05)',
  },
  uploadZoneDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  uploadIcon: {
    fontSize: '40px',
    marginBottom: '8px',
  },
  uploadTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#f0ede8',
    margin: '0 0 4px 0',
  },
  uploadDesc: {
    fontSize: '14px',
    color: '#7a7570',
    margin: '0',
  },
  uploadHint: {
    fontSize: '12px',
    color: '#5a5550',
    margin: '4px 0 0 0',
    fontFamily: 'DM Mono, monospace',
  },
  previewState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '200px',
    borderRadius: '4px',
    border: '1px solid rgba(212, 168, 71, 0.2)',
  },
  pdfIcon: {
    fontSize: '48px',
  },
  fileName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#f0ede8',
    margin: '0',
  },
  changeText: {
    fontSize: '12px',
    color: '#d4a847',
    margin: '0',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '2px solid rgba(212, 168, 71, 0.2)',
    borderTopColor: 'rgb(212, 168, 71)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: '#7a7570',
    margin: '0',
  },
  errorBox: {
    marginTop: '12px',
    padding: '10px 14px',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    border: '1px solid rgba(248, 113, 113, 0.3)',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#f87171',
  },
  errorIcon: {
    fontSize: '14px',
  },
  errorText: {
    flex: 1,
    fontFamily: 'Instrument Sans, sans-serif',
  },
};

// Add keyframes animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
if (!document.head.querySelector('style[data-bill-spinner]')) {
  style.setAttribute('data-bill-spinner', 'true');
  document.head.appendChild(style);
}
