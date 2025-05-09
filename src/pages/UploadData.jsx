import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadWorkHistory } from '../utils/dataUtils';
import '../styles/pages.css';
import '../styles/upload-data.css';

const UploadData = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadedRecords, setUploadedRecords] = useState(null);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Check if file is Excel
    if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
      setUploadStatus({
        success: false,
        message: 'Please select a valid Excel file (.xlsx or .xls)'
      });
      return;
    }
    
    setFile(selectedFile);
    setUploadStatus(null);
  };
  
  const handleUpload = async () => {
    if (!file) {
      setUploadStatus({
        success: false,
        message: 'Please select a file to upload'
      });
      return;
    }
    
    setIsUploading(true);
    setUploadStatus(null);
    
    try {
      const result = await uploadWorkHistory(file);
      setUploadStatus(result);
      
      if (result.success) {
        setUploadedRecords(result.record_count);
      }
    } catch (error) {
      setUploadStatus({
        success: false,
        message: error.message || 'An error occurred during upload'
      });
    }
    
    setIsUploading(false);
  };
  
  const handleGoToDashboard = () => {
    navigate('/');
  };
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          Upload Work History Data
        </h1>
      </div>
      
      <div className="upload-container">
        <div className="upload-instructions">
          <h2>Upload Instructions</h2>
          <p>Upload your work history Excel file to analyze your data.</p>
          <ul>
            <li>File must be in Excel format (.xlsx or .xls)</li>
            <li>Must contain required columns (Work, Actual work, etc.)</li>
            <li>Each row should represent a single work record</li>
          </ul>
        </div>
        
        <div className="upload-form">
          <div className="file-input-container">
            <label htmlFor="file-upload" className="file-input-label">
              {file ? file.name : 'Choose Excel File'}
            </label>
            <input 
              id="file-upload" 
              type="file" 
              accept=".xlsx,.xls" 
              onChange={handleFileChange}
              className="file-input"
            />
          </div>
          
          <button 
            className="upload-button"
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
          
          {uploadStatus && (
            <div className={`upload-status ${uploadStatus.success ? 'success' : 'error'}`}>
              <p>{uploadStatus.message}</p>
              {uploadedRecords && (
                <p>Successfully processed {uploadedRecords} records.</p>
              )}
            </div>
          )}
          
          {uploadStatus && uploadStatus.success && (
            <button 
              className="view-dashboard-button"
              onClick={handleGoToDashboard}
            >
              View Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadData;