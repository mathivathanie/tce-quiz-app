import React from 'react';

const ManualEntry = ({
  questionText,
  setQuestionText,
  optionA,
  setOptionA,
  optionB,
  setOptionB,
  optionC,
  setOptionC,
  optionD,
  setOptionD,
  correctOption,
  setCorrectOption,
  handleAddQuestion,
  loading,
  styles
}) => {
  return (
    <div style={{ marginBottom: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '15px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>✏️</div>
        <h3 style={{ color: '#667eea' }}>Add Questions Manually</h3>
      </div>
      <input
        type="text"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
        placeholder="Enter your question"
        style={styles.input}
        disabled={loading}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <input
          type="text"
          value={optionA}
          onChange={(e) => setOptionA(e.target.value)}
          placeholder="Option A"
          style={styles.input}
          disabled={loading}
        />
        <input
          type="text"
          value={optionB}
          onChange={(e) => setOptionB(e.target.value)}
          placeholder="Option B"
          style={styles.input}
          disabled={loading}
        />
        <input
          type="text"
          value={optionC}
          onChange={(e) => setOptionC(e.target.value)}
          placeholder="Option C"
          style={styles.input}
          disabled={loading}
        />
        <input
          type="text"
          value={optionD}
          onChange={(e) => setOptionD(e.target.value)}
          placeholder="Option D"
          style={styles.input}
          disabled={loading}
        />
      </div>
      <select
        value={correctOption}
        onChange={(e) => setCorrectOption(e.target.value)}
        style={styles.select}
        disabled={loading}
      >
        <option value="">Select Correct Answer</option>
        <option value="A">Option A</option>
        <option value="B">Option B</option>
        <option value="C">Option C</option>
        <option value="D">Option D</option>
      </select>
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <button style={styles.button} onClick={handleAddQuestion} disabled={loading}>
          {loading ? 'Adding...' : '➕ Add Question'}
        </button>
      </div>
    </div>
  );
};

export default ManualEntry;