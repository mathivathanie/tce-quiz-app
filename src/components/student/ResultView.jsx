import React from 'react';
import { styles } from '../common/styles';
import { ToastContainer } from 'react-toastify';
import { calculateStudentResults } from './studentUtils';

const ResultView = ({ currentQuiz, userAnswers, studentInfo, loggedInUser }) => {
  const { scorePercentage } = calculateStudentResults(currentQuiz, userAnswers);
  
  return (
    <div style={styles.container}>
      <ToastContainer />
      <div style={{ ...styles.card, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', position: 'relative' }}>
        {loggedInUser && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
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
        <div style={{
          ...styles.resultCard,
          animation: 'popIn 0.7s cubic-bezier(0.23, 1, 0.32, 1)',
          boxShadow: '0 8px 32px rgba(102,126,234,0.15)',
          maxWidth: 350,
          width: '100%'
        }}>
          <h2>Quiz Submitted</h2>
          <div style={{
            marginTop: 32,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 24,
            fontSize: 17,
            color: '#333',
            fontWeight: 500,
            textAlign: 'center',
            background: 'rgba(245,247,250,0.85)',
            borderRadius: 16,
            padding: '12px 18px',
            boxShadow: '0 2px 8px rgba(102,126,234,0.07)'
          }}>
            <div><span style={{ color: '#667eea', fontWeight: 700 }}>Name:</span> {studentInfo.name}</div>
            <div style={{ borderLeft: '1.5px solid #e0e0e0', height: 24 }}></div>
            <div><span style={{ color: '#667eea', fontWeight: 700 }}>Reg No:</span> {studentInfo.regNo}</div>
            <div style={{ borderLeft: '1.5px solid #e0e0e0', height: 24 }}></div>
            <div><span style={{ color: '#667eea', fontWeight: 700 }}>Dept:</span> {studentInfo.department}</div>
            <div><span style={{ color: '#667eea', fontWeight: 700 }}>Sec:</span> {studentInfo.section}</div>
          </div>
        </div>
      </div>
      <div style={styles.footerBlack}>
  {/* Floating background elements */}
  <div style={styles.footerOverlay}></div>
  <div style={styles.footerShape1}></div>
  <div style={styles.footerShape2}></div>
  <div style={styles.footerShape3}></div>
  
  <div style={styles.footerThreeColumns}>
    
    <div style={styles.footerLeftColumn}>
      <div style={{...styles.footerHeading, position: 'relative'}}>
        Developed By
        <div style={styles.footerHeadingUnderline}></div>
      </div>
      <div style={styles.developerName}>
        <div style={styles.developerNameShimmer}></div>
        MATHIVATHANI E -IT
      </div>
      <div style={styles.developerName}>
        <div style={styles.developerNameShimmer}></div>
        ROSHINI M -IT
      </div>
      <div style={styles.developerName}>
        <div style={styles.developerNameShimmer}></div>
        SHANMATHI N -IT
      </div>
      <div style={styles.developerName}>
        <div style={styles.developerNameShimmer}></div>
        HARINI R -IT
      </div>
      <div style={styles.developerName}>
        <div style={styles.developerNameShimmer}></div>
        SANCHANA R -IT
      </div>
    </div>

    <div style={styles.footerCenterColumn}>
      <div style={{...styles.footerHeading, position: 'relative'}}>
        HEAD OF THE DEPARTMENT
        <div style={styles.footerHeadingUnderline}></div>
      </div>
      <div style={styles.departmentHead}>Dr.C.DEISY</div>
    </div>

    <div style={styles.footerRightColumn}>
      <div style={{...styles.footerHeading, position: 'relative'}}>
        Under the guidance of
        <div style={styles.footerHeadingUnderline}></div>
      </div>
      <div style={styles.guidanceInfo}>Department of Information Technology</div>
      <div style={styles.guidanceInfo}>C.V. NISHA ANGELINE</div>
    </div>

  </div>
</div>

{/* Add the CSS animations */}
<style>{`
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }

  @keyframes rotate {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }

  @keyframes glow {
    from { box-shadow: 0 2px 8px rgba(255,255,255,0.4); }
    to { box-shadow: 0 2px 20px rgba(255,255,255,0.8); }
  }

  @keyframes floatPattern {
    from { transform: translateX(0); }
    to { transform: translateX(60px); }
  }

  @keyframes popIn {
    0% { opacity: 0; transform: scale(0.7); }
    60% { opacity: 1; transform: scale(1.05); }
    100% { opacity: 1; transform: scale(1); }
  }
`}</style>
      </div>
    );
};

export default ResultView;

