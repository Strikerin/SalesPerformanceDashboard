import React, { useState, useRef } from 'react';
import '../styles/pages.css';
import '../styles/upload.css';

const UploadData = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [uploadHistory, setUploadHistory] = useState([
    { date: '2025-05-01', filename: 'WORKHISTORY_Q1_2025.xlsx', status: 'Completed', records: 234 },
    { date: '2025-04-15', filename: 'WORKHISTORY_MAR_2025.xlsx', status: 'Completed', records: 87 },
    { date: '2025-03-10', filename: 'WORKHISTORY_FEB_2025.xlsx', status: 'Completed', records: 92 }
  ]);
  
  const fileInputRef = useRef(null);
  
  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  // Handle file input change
  const handleChange = (e) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  // Handle file upload button click
  const onButtonClick = () => {
    fileInputRef.current.click();
  };
  
  // Handle file selection
  const handleFile = (file) => {
    // Check if file is Excel or CSV
    const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
    
    if (!validTypes.includes(file.type)) {
      setUploadStatus({
        success: false,
        message: 'Invalid file type. Please upload an Excel or CSV file.'
      });
      return;
    }
    
    setFile(file);
    setUploadStatus(null);
  };
  
  // Process the uploaded file
  const processFile = () => {
    if (!file) return;
    
    setProcessing(true);
    
    // Simulate API call to process the file
    setTimeout(() => {
      // Generate random number of records between 50 and 300
      const recordCount = Math.floor(Math.random() * 250) + 50;
      
      setUploadStatus({
        success: true,
        message: `File uploaded successfully! ${recordCount} records processed.`,
        records: recordCount
      });
      
      // Add to upload history
      const today = new Date().toISOString().split('T')[0];
      setUploadHistory([
        { date: today, filename: file.name, status: 'Completed', records: recordCount },
        ...uploadHistory
      ]);
      
      setProcessing(false);
      setFile(null);
    }, 2000);
  };
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Upload Data</h1>
      </div>
      
      <div className="upload-container">
        <div className="upload-section">
          <h2 className="section-title">Upload Work History Data</h2>
          <p className="upload-description">
            Upload your WORKHISTORY Excel file to update the dashboard with the latest data.
            Supported formats: .xlsx, .xls, .csv
          </p>
          
          <form className="upload-form" onSubmit={(e) => e.preventDefault()}>
            <div 
              className={`upload-area ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="file-input"
                onChange={handleChange}
                accept=".xlsx,.xls,.csv"
              />
              
              {!file ? (
                <div className="upload-placeholder">
                  <div className="upload-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </div>
                  <p className="upload-text">
                    Drag and drop your file here, or <button type="button" className="btn-link" onClick={onButtonClick}>browse files</button>
                  </p>
                </div>
              ) : (
                <div className="file-info">
                  <div className="file-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <div className="file-details">
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button 
                    type="button" 
                    className="btn-remove"
                    onClick={() => setFile(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              )}
            </div>
            
            {file && (
              <div className="upload-actions">
                <button 
                  type="button" 
                  className={`btn-upload ${processing ? 'processing' : ''}`}
                  onClick={processFile}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <div className="btn-spinner"></div>
                      Processing...
                    </>
                  ) : 'Upload and Process'}
                </button>
              </div>
            )}
            
            {uploadStatus && (
              <div className={`upload-status ${uploadStatus.success ? 'success' : 'error'}`}>
                <div className="status-icon">
                  {uploadStatus.success ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  )}
                </div>
                <p className="status-message">{uploadStatus.message}</p>
              </div>
            )}
          </form>
        </div>
        
        <div className="history-section">
          <h2 className="section-title">Upload History</h2>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Filename</th>
                  <th>Status</th>
                  <th>Records</th>
                </tr>
              </thead>
              <tbody>
                {uploadHistory.map((item, index) => (
                  <tr key={index}>
                    <td>{item.date}</td>
                    <td>{item.filename}</td>
                    <td>
                      <span className={`status-badge ${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>{item.records}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadData;