import React from 'react';

const CsvUpload = ({
  parseCsvFile,
  csvErrors,
  showCsvPreview,
  csvPreview,
  handleCsvUpload,
  clearCsvUpload,
  loading,
  styles
}) => {
  return (
    <div style={{ marginBottom: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '15px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📊</div>
        <h3 style={{ color: '#667eea' }}>Upload Questions via CSV</h3>
      </div>
      <input 
        type="file" 
        accept=".csv" 
        onChange={(e) => parseCsvFile(e.target.files[0])} 
        style={styles.input} 
      />
      {csvErrors.length > 0 && (
        <div style={{ color: 'red' }}>
          <h4>CSV Errors:</h4>
          <ul>
            {csvErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      {showCsvPreview && (
        <div>
          <h4>CSV Preview:</h4>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Question</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>A</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>B</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>C</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>D</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Correct</th>
                </tr>
              </thead>
              <tbody>
                {csvPreview.map((q, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{q.question}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{q.options.a}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{q.options.b}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{q.options.c}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{q.options.d}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{q.correct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button style={styles.button} onClick={handleCsvUpload} disabled={loading || csvErrors.length > 0}>
              {loading ? 'Uploading...' : 'Upload CSV'}
            </button>
            <button style={{ ...styles.button, background: 'grey' }} onClick={clearCsvUpload} disabled={loading}>
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default CsvUpload;