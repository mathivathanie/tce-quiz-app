import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { styles } from '../common/styles';
import LoadingError from '../common/LoadingError';

const ViewResults = ({
  quizSessions,
  loading,
  error,
  setActiveAdminSection,
  user,
  API_BASE_URL
}) => {
  const [resultSessionCode, setResultSessionCode] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [resultFilter, setResultFilter] = useState('all');

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

  const loadSessionResults = async (sessionId) => {
    if (!user || !user.email) return;
    
    try {
      const results = await apiCall(`/api/quiz-results/${sessionId}?adminEmail=${encodeURIComponent(user.email)}`);
      setStudentResults(results);
    } catch (error) {
      toast.error('Failed to load results: ' + error.message);
    }
  };

  const getGradeFromPercentage = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 75 && percentage <= 89) return 'A';
    if (percentage >= 50 && percentage <= 74) return 'B';
    if (percentage >= 40 && percentage <= 49) return 'C';
    if (percentage <= 39) return 'D';
    return 'F';
  };

  const handleExportCSV = () => {
    if (!resultSessionCode) {
      toast.info('Please enter a quiz code first!');
      return;
    }
    if (studentResults.length === 0) {
      toast.error('No results found to export!');
      return;
    }
    const currentSession = quizSessions.find((s) => s.sessionId === resultSessionCode);
    const sessionName = currentSession ? currentSession.name : resultSessionCode;
    const filename = `Quiz_Results_${sessionName}_${resultSessionCode}_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(studentResults, filename);
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data to export!');
      return;
    }
    const headers = [
      'Student Name',
      'Registration Number',
      'Department',
      'Section',
      'Score',
      'Total Questions',
      'Percentage',
      'Grade',
      'Submission Date',
      'Submission Time',
    ];
    const csvContent = [
      headers.join(','),
      ...data.map((result) => {
        const submissionDate = new Date(result.submittedAt);
        const grade = getGradeFromPercentage(result.percentage);
        return [
          `"${result.studentName}"`,
          `"${result.regNo}"`,
          `"${result.department}"`,
          `"${result.section}"`,
          result.score,
          result.totalQuestions,
          result.percentage,
          `"${grade}"`,
          submissionDate.toLocaleDateString(),
          submissionDate.toLocaleTimeString(),
        ].join(',');
      }),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    if (resultSessionCode) {
      loadSessionResults(resultSessionCode);
    }
  }, [resultSessionCode]);

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
        <div style={styles.resultsHeader}>
          <h2>Quiz Results</h2>
          <button style={styles.csvButton} onClick={handleExportCSV} disabled={loading}>
            Export to CSV
          </button>
        </div>
        <input
          type="text"
          placeholder="Enter Quiz Code to see results"
          value={resultSessionCode}
          onChange={(e) => setResultSessionCode(e.target.value)}
          style={styles.input}
          disabled={loading}
        />
        <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} style={styles.select}>
          <option value="all">All Results</option>
          <option value=">=80">≥ 80%</option>
          <option value="<=40">≤ 40%</option>
        </select>
        <div>
          {studentResults
            .filter((result) => {
              if (resultFilter === '>=80') return result.percentage >= 80;
              if (resultFilter === '<=40') return result.percentage <= 40;
              return true;
            })
            .map((result, index) => {
              const grade = getGradeFromPercentage(result.percentage);
              const isPass = grade !== 'F';
              return (
                <div
                  key={index}
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                    borderLeft: `6px solid ${isPass ? '#4caf50' : '#f44336'}`,
                    margin: '18px 0',
                    padding: '24px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    maxWidth: 700
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 18, flexWrap: 'wrap', gap: 12 }}>
                    <div><b>Name:</b> {result.studentName}</div>
                    <div><b>Reg No:</b> {result.regNo}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <b>Score:</b> {result.score}/{result.totalQuestions} ({result.percentage}%)
                      <span style={{
                        marginLeft: 8,
                        padding: '2px 12px',
                        borderRadius: 12,
                        background: isPass ? '#4caf50' : '#f44336',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 15
                      }}>{grade}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 16, flexWrap: 'wrap', gap: 12 }}>
                    <div><b>Department:</b> {result.department}</div>
                    <div><b>Section:</b> {result.section}</div>
                    <div><b>Submitted:</b> {new Date(result.submittedAt).toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default ViewResults;