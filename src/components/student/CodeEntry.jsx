import React from 'react';
import { styles } from '../common/styles';
import LoadingError from '../common/LoadingError';
import { ToastContainer } from 'react-toastify';

const CodeEntry = ({ loading, error, quizCode, setQuizCode, handleJoinQuiz, loggedInUser }) => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <ToastContainer />
        <LoadingError loading={loading} error={error} />
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
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2>Join a Quiz</h2>
          <p style={{ color: '#666' }}>Enter the quiz code provided by your instructor</p>
        </div>
        <input
          type="text"
          placeholder="Enter quiz code"
          value={quizCode}
          onChange={(e) => setQuizCode(e.target.value)}
          style={styles.input}
          onKeyPress={(e) => e.key === 'Enter' && handleJoinQuiz()}
          disabled={loading}
        />
        <div style={{ textAlign: 'center' }}>
          <button style={styles.button} onClick={handleJoinQuiz} disabled={loading}>
            {loading ? 'Joining...' : 'Join Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeEntry;

