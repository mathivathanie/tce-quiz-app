import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { styles } from '../common/styles';
import LoadingError from '../common/LoadingError';

const Violations = ({
  loading,
  error,
  setActiveAdminSection,
  user,
  API_BASE_URL
}) => {
  const [violationSessionCode, setViolationSessionCode] = useState('');
  const [quizViolations, setQuizViolations] = useState([]);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [showViolationDetails, setShowViolationDetails] = useState(false);

  const apiCall = async (endpoint, method = 'GET', data = null) => {
    try {
      const config = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (data) config.body = JSON.stringify(data);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const loadQuizViolations = async (sessionId) => {
    if (!user || !user.email) return;
    
    try {
      const violations = await apiCall(`/api/quiz-violations/${sessionId}?adminEmail=${encodeURIComponent(user.email)}`);
      const uniqueViolations = [];
      const seenRegNos = new Set();
      for (const v of violations) {
        if (!seenRegNos.has(v.regNo)) {
          seenRegNos.add(v.regNo);
          uniqueViolations.push(v);
        }
      }
      setQuizViolations(uniqueViolations);
    } catch (error) {
      toast.error('Failed to load violations: ' + error.message);
    }
  };

  const handleApproveResume = async (violationId) => {
    try {
      const response = await apiCall(`/api/quiz-violations/${violationId}/resume`, 'POST');
      if (response && response.success) {
        toast.success('Resume approved. The student can now continue the quiz.');
      } else {
        toast.success(response?.message || 'Resume approved.');
      }
      if (violationSessionCode) {
        await loadQuizViolations(violationSessionCode);
      }
    } catch (error) {
      toast.error('Failed to approve resume: ' + error.message);
    }
  };

  const handleRestartStudentQuiz = async (violation) => {
    const confirmRestart = window.confirm(
      `Are you sure you want to restart the quiz for ${violation.studentName} (${violation.regNo})?\n\nThis will:\n• Allow them to restart from question 1\n• Give them full time allocation\n• Reset their violation count\n• Mark this violation as resolved`
    );
    if (!confirmRestart) return;
    try {
      const response = await apiCall(`/api/quiz-violations/${violation._id}/restart`, 'POST', {
        adminAction: true,
        restartReason: 'Admin approved restart due to violations',
      });
      if (response.success) {
        toast.info(`Quiz restart approved for ${violation.studentName}! The student can restart without a token.`);
        if (violationSessionCode) {
          await loadQuizViolations(violationSessionCode);
        }
      }
    } catch (error) {
      toast.error('Failed to approve quiz restart: ' + error.message);
    }
  };

  useEffect(() => {
    if (violationSessionCode) {
      loadQuizViolations(violationSessionCode);
    }
  }, [violationSessionCode]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <LoadingError loading={loading} error={error} />
        <button 
          style={{ ...styles.button, marginBottom: '20px' }} 
          onClick={() => setActiveAdminSection(null)} 
          disabled={loading}
        >
          ← Back to Dashboard
        </button>
        <h2>Quiz Violations</h2>
        <input
          type="text"
          placeholder="Enter Quiz Code to see violations"
          value={violationSessionCode}
          onChange={(e) => setViolationSessionCode(e.target.value)}
          style={styles.input}
        />
        <div>
          {quizViolations.map((violation) => (
            <div key={violation._id} style={styles.violationCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <p style={{ margin: '5px 0', fontSize: '16px' }}>
                    <strong>{violation.studentName}</strong> ({violation.regNo})
                  </p>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>Department:</strong> {violation.department}
                  </p>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>Section:</strong> {violation.section}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={styles.violationStatusBadge(violation.isResolved, violation.adminAction)}>
                    {violation.isResolved ? '✅ Resolved' : 
                     violation.adminAction === 'resume_approved' ? '🔄 Resume Approved' :
                     violation.adminAction === 'restart_approved' ? '🔄 Restart Approved' :
                     '⏳ Pending'}
                  </div>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    {new Date(violation.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>Violation Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <p style={{ margin: '5px 0' }}>
                      <strong>Type:</strong> 
                      <span style={styles.violationTypeBadge(violation.violationType)}>
                        {violation.violationType.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </p>
                    <p style={{ margin: '5px 0' }}>
                      <strong>Current Question:</strong> {violation.currentQuestion || 'N/A'}
                    </p>
                    <p style={{ margin: '5px 0' }}>
                      <strong>Time Left:</strong> {Math.floor((violation.timeLeft || 0) / 60)}m {(violation.timeLeft || 0) % 60}s
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '5px 0' }}>
                      <strong>Tab Switches:</strong> {violation.tabSwitchCount || 0}
                    </p>
                    <p style={{ margin: '5px 0' }}>
                      <strong>Time Spent:</strong> {Math.floor((violation.timeSpent || 0) / 60)}m {(violation.timeSpent || 0) % 60}s
                    </p>
                    {violation.resolvedAt && (
                      <p style={{ margin: '5px 0', color: '#28a745' }}>
                        <strong>Resolved:</strong> {new Date(violation.resolvedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  style={styles.resumeButton}
                  onClick={() => {
                    setSelectedViolation(violation);
                    setShowViolationDetails(true);
                  }}
                >
                  📋 Details
                </button>
                {!violation.isResolved && (
                  <>
                    {violation.adminAction !== 'resume_approved' && (
                      <button 
                        style={{ ...styles.resumeButton, background: 'linear-gradient(45deg, #28a745, #20c997)' }}
                        onClick={() => handleApproveResume(violation._id)} 
                        disabled={loading}
                      >
                        ✅ Approve Resume
                      </button>
                    )}
                    
                    {violation.adminAction !== 'restart_approved' && (
                      <button 
                        style={{ ...styles.resumeButton, background: 'linear-gradient(45deg, #ffc107, #fd7e14)' }}
                        onClick={() => handleRestartStudentQuiz(violation)} 
                        disabled={loading}
                      >
                        🔄 Approve Restart
                      </button>
                    )}
                  </>
                )}
                
                {violation.isResolved && (
                  <span style={styles.resolvedBadge}>
                    ✅ Issue Resolved
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {quizViolations.length === 0 && violationSessionCode && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>✅</div>
              <h4>No violations found</h4>
              <p>Great! No students have violated quiz rules in this session.</p>
            </div>
          )}
        </div>
        
        {showViolationDetails && selectedViolation && (
          <div style={styles.passageModal}>
            <div style={styles.passageContent}>
              <button onClick={() => setShowViolationDetails(false)} style={{ float: 'right' }}>
                Close
              </button>
              <h3>Violation Details - {selectedViolation.studentName}</h3>
              
              <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4>Status Information</h4>
                <div style={styles.violationStatusBadge(selectedViolation.isResolved, selectedViolation.adminAction)}>
                  {selectedViolation.isResolved ? '✅ Resolved' : 
                   selectedViolation.adminAction === 'resume_approved' ? '🔄 Resume Approved' :
                   selectedViolation.adminAction === 'restart_approved' ? '🔄 Restart Approved' :
                   '⏳ Pending'}
                </div>
                <p><strong>Created:</strong> {new Date(selectedViolation.createdAt).toLocaleString()}</p>
                {selectedViolation.resolvedAt && (
                  <p><strong>Resolved:</strong> {new Date(selectedViolation.resolvedAt).toLocaleString()}</p>
                )}
              </div>

              <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4>Violation Details</h4>
                <p><strong>Student:</strong> {selectedViolation.studentName} ({selectedViolation.regNo})</p>
                <p><strong>Department:</strong> {selectedViolation.department}</p>
                <p><strong>Section:</strong> {selectedViolation.section}</p>
                <p><strong>Violation Type:</strong> {selectedViolation.violationType.replace(/_/g, ' ').toUpperCase()}</p>
                <p><strong>Current Question:</strong> {selectedViolation.currentQuestion || 'N/A'}</p>
                <p><strong>Time Left:</strong> {Math.floor((selectedViolation.timeLeft || 0) / 60)}m {(selectedViolation.timeLeft || 0) % 60}s</p>
                <p><strong>Time Spent:</strong> {Math.floor((selectedViolation.timeSpent || 0) / 60)}m {(selectedViolation.timeSpent || 0) % 60}s</p>
                <p><strong>Tab Switch Count:</strong> {selectedViolation.tabSwitchCount || 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Violations;