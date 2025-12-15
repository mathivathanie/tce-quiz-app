import React from 'react';

const ComprehensionPassage = ({
  passageTitle,
  setPassageTitle,
  passageText,
  setPassageText,
  handleAddPassage,
  loading,
  styles
}) => {
  return (
    <div style={{ marginBottom: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '15px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📖</div>
        <h3 style={{ color: '#667eea' }}>Add Comprehension Passage</h3>
      </div>
      <input
        type="text"
        value={passageTitle}
        onChange={(e) => setPassageTitle(e.target.value)}
        placeholder="Passage Title"
        style={styles.input}
        disabled={loading}
      />
      <textarea
        value={passageText}
        onChange={(e) => setPassageText(e.target.value)}
        placeholder="Passage Text"
        style={{ ...styles.input, height: '200px' }}
        disabled={loading}
      />
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <button style={styles.button} onClick={handleAddPassage} disabled={loading}>
          {loading ? 'Adding...' : '➕ Add Passage'}
        </button>
      </div>
    </div>
  );
};
export default ComprehensionPassage;