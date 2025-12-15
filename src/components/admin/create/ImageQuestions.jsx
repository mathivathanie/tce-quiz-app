import React from 'react';

const ImageQuestions = ({
  imageUrl,
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
  handleImageUpload,
  handleAddImageQuestion,
  loading,
  styles
}) => {
  return (
    <div style={{ marginBottom: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '15px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🖼️</div>
        <h3 style={{ color: '#667eea' }}>Add Image-Based Questions</h3>
      </div>
      
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={styles.input}
        disabled={loading}
      />
      
      {imageUrl && (
        <div style={{ textAlign: 'center', margin: '15px 0' }}>
          <img 
            src={imageUrl} 
            alt="Question Preview" 
            style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid #ddd' }}
          />
        </div>
      )}
      
      <input
        type="text"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
        placeholder="Optional question text (leave empty for image-only questions)"
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
        <button style={styles.button} onClick={handleAddImageQuestion} disabled={loading}>
          {loading ? 'Adding...' : 'Add Image Question'}
        </button>
      </div>
    </div>
  );
};

export default ImageQuestions;