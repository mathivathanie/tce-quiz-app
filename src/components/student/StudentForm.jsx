import React from 'react';
import { styles } from '../common/styles';
import LoadingError from '../common/LoadingError';
import { ToastContainer } from 'react-toastify';

const StudentForm = ({ loading, error, currentQuiz, studentInfo, setStudentInfo, startStudentQuiz, setStudentView, loggedInUser }) => {
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
          <button style={{...styles.button, marginBottom: '20px'}} onClick={() => setStudentView('codeEntry')} disabled={loading}>
            ← Back
          </button>
          <h2>Student Information</h2>
          <p style={{ color: '#666' }}>Quiz: {currentQuiz?.name}</p>
          <p style={{ color: '#666' }}>Questions: {currentQuiz?.questions?.length || 0} | Time: 90 minutes</p>
        </div>
        
        <input
          type="text"
          placeholder="Full Name"
          value={studentInfo.name}
          onChange={(e) => setStudentInfo({ ...studentInfo, name: e.target.value })}
          style={styles.input}
        />
        <input
          type="text"
          placeholder="Register Number"
          value={studentInfo.regNo}
          onChange={(e) => setStudentInfo({ ...studentInfo, regNo: e.target.value })}
          style={styles.input}
        />
        <select
          value={studentInfo.department}
          onChange={(e) => setStudentInfo({ ...studentInfo, department: e.target.value })}
          style={styles.select}
        >
            <option value="">Select Department *</option>
<option value="Civil">Civil Engineering</option>
<option value="Mechanical">Mechanical Engineering</option>
<option value="EEE">Electrical and Electronics Engineering</option>
<option value="ECE">Electronics and Communication Engineering</option>
<option value="CSE">Computer Science Engineering</option>
<option value="CSE AIML">CSE - Artificial Intelligence and Machine Learning</option>
<option value="IT">Information Technology</option>
<option value="Mechatronics">Mechatronics</option>
<option value="AMCS">Applied Mathematics and Computational Sciences</option>
<option value="CSBS">Computer Science and Business Systems</option>
<option value="TSEDA">Architecture,Design,Planning</option>
  <option value="other">Other</option>
            </select>
<select
          value={studentInfo.section}
          onChange={(e) => setStudentInfo({ ...studentInfo, section: e.target.value })}
          style={styles.select}
        >
          <option value="">Select Section *</option>
<option value="A">A</option>
<option value="B">B</option>
<option value="C">C</option>
<option value="D">D</option>
<option value="Other">Other</option>
        </select>
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button style={styles.button} onClick={startStudentQuiz} disabled={loading}>
                {loading ? 'Starting...' : 'Start Quiz'}
              </button>
            </div>

<div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
              <strong style={{ color: '#856404' }}>⚠️ Important Instructions:</strong>
              <ul style={{ margin: '10px 0', paddingLeft: '20px', color: '#856404' }}>
                <li>Do not refresh, minimize, resize, or switch tabs during the quiz.</li>
    <li>Any attempt to switch tabs, copy content, or navigate away will result in immediate termination and auto-submission of the quiz.</li>
    <li>You are allotted 90 minutes to complete the quiz.</li>
    <li>All fields must be filled before starting the quiz.</li>
              </ul>
            </div> 

      </div>
    </div>
  );
};

export default StudentForm;

