import React from 'react';
import { styles } from '../common/styles';
import { ToastContainer } from 'react-toastify';

const WaitingForAdmin = ({ loading, suspensionMessage, handleResumeQuiz, loggedInUser }) => {
  return (
    <div style={styles.container}>
      <div style={styles.waitingCard}>
        <ToastContainer />
        {loggedInUser && (
          <div style={{
            textAlign: 'right',
            marginBottom: '15px',
            padding: '10px',
            background: 'rgba(102, 126, 234, 0.1)',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#667eea',
            fontWeight: '500'
          }}>
            Logged in as: <span style={{ fontWeight: '600' }}>{loggedInUser.email}</span>
          </div>
        )}
        <h2>Quiz Suspended</h2>
        <p>{suspensionMessage}</p>
        <button style={styles.button} onClick={handleResumeQuiz} disabled={loading}>
            {loading ? 'Checking...' : 'Check for Approval'}
        </button>
      </div>
    </div>
  );
};

export default WaitingForAdmin;

