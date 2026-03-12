import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

interface ParsedExpense {
  title: string;
  amount: number;
  items: Array<{ name: string; amount: number }>;
}

export default function BillUploadPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedExpense | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);

    // Call OCR API to parse bill
    try {
      // const response = await fetch('/api/parse-bill', { ... });
      // setParsedData(response.json());
    } catch (error) {
      console.error('Error parsing bill:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bill-upload-container">
      <h1>Upload Bill</h1>

      <div className="upload-section">
        <input 
          type="file" 
          accept="image/*,.pdf"
          onChange={handleFileUpload}
        />
        {loading && <p>Parsing bill...</p>}
      </div>

      {parsedData && (
        <div className="parsed-data">
          <h2>Parsed Data</h2>
          <p><strong>Title:</strong> {parsedData.title}</p>
          <p><strong>Total:</strong> ${parsedData.amount}</p>
          <div className="items">
            {parsedData.items.map((item, idx) => (
              <div key={idx}>
                <p>{item.name}: ${item.amount}</p>
              </div>
            ))}
          </div>
          <button className="btn-primary">Save as Expense</button>
        </div>
      )}
    </div>
  );
}
