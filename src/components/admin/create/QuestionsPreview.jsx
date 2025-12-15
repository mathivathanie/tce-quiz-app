import React from 'react';
import { toast } from 'react-toastify';

const QuestionsPreview = ({
  currentSession,
  showQuestionsPreview,
  setShowQuestionsPreview,
  editingQuestion,
  editQuestionData,
  setEditQuestionData,
  handleEditQuestion,
  handleUpdateQuestion,
  handleDeleteQuestion,
  cancelEdit,
  API_BASE_URL,
  styles
}) => {
  return (
    <div style={{ marginTop: '40px', padding: '20px', background: '#f0f8ff', borderRadius: '15px', border: '2px solid #667eea' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>👁️</div>
        <h3 style={{ color: '#667eea' }}>Questions Preview</h3>
        <p style={{ color: '#666', fontSize: '14px' }}>
          {currentSession?.questions?.length || 0} questions added
        </p>
        <button 
          style={{ ...styles.button, background: 'linear-gradient(45deg, #4CAF50, #45a049)' }}
          onClick={() => setShowQuestionsPreview(!showQuestionsPreview)}
        >
          {showQuestionsPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>

      {showQuestionsPreview && (
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {currentSession?.questions?.map((question, index) => (
            <div key={index} style={styles.questionPreviewCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: '#333' }}>Question {index + 1}</h4>
                <div>
                  <button 
                    style={{ ...styles.resumeButton, background: 'linear-gradient(45deg, #2196F3, #1976D2)', marginRight: '5px' }}
                    onClick={() => handleEditQuestion(question, index)}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    style={{ ...styles.resumeButton, background: 'linear-gradient(45deg, #f44336, #d32f2f)' }}
                    onClick={() => handleDeleteQuestion(index)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              {editingQuestion === index ? (
                <div style={styles.editQuestionForm}>
                  <input
                    type="text"
                    value={editQuestionData.question}
                    onChange={(e) => setEditQuestionData({ ...editQuestionData, question: e.target.value })}
                    placeholder="Question text"
                    style={styles.input}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={editQuestionData.options.a}
                      onChange={(e) => setEditQuestionData({ 
                        ...editQuestionData, 
                        options: { ...editQuestionData.options, a: e.target.value } 
                      })}
                      placeholder="Option A"
                      style={styles.input}
                    />
                    <input
                      type="text"
                      value={editQuestionData.options.b}
                      onChange={(e) => setEditQuestionData({ 
                        ...editQuestionData, 
                        options: { ...editQuestionData.options, b: e.target.value } 
                      })}
                      placeholder="Option B"
                      style={styles.input}
                    />
                    <input
                      type="text"
                      value={editQuestionData.options.c}
                      onChange={(e) => setEditQuestionData({ 
                        ...editQuestionData, 
                        options: { ...editQuestionData.options, c: e.target.value } 
                      })}
                      placeholder="Option C"
                      style={styles.input}
                    />
                    <input
                      type="text"
                      value={editQuestionData.options.d}
                      onChange={(e) => setEditQuestionData({ 
                        ...editQuestionData, 
                        options: { ...editQuestionData.options, d: e.target.value } 
                      })}
                      placeholder="Option D"
                      style={styles.input}
                    />
                  </div>
                  <select
                    value={editQuestionData.correct}
                    onChange={(e) => setEditQuestionData({ ...editQuestionData, correct: e.target.value })}
                    style={styles.select}
                  >
                    <option value="">Select Correct Answer</option>
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                  <div style={{ textAlign: 'center', marginTop: '15px' }}>
                    <button style={styles.button} onClick={handleUpdateQuestion}>
                      Update Question
                    </button>
                    <button style={{ ...styles.button, background: 'grey', marginLeft: '10px' }} onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ marginBottom: '15px', fontSize: '16px', lineHeight: '1.5' }}>
                    <strong>Q:</strong> {question.question}
                  </p>
                  {question.questionType === 'image' && question.imageUrl && (
                    <div style={{ textAlign: 'center', margin: '20px 0' }}>
                      <img 
                        src={(() => {
                          let imageUrl = question.imageUrl;
                          if (imageUrl.startsWith('http')) {
                            return imageUrl;
                          }
                          const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
                          return `${API_BASE_URL}${cleanPath}`;
                        })()}
                        alt="Question"
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '400px', 
                          borderRadius: '8px',
                          border: '1px solid #ddd',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                        onError={(e) => {
                          console.error('Image failed to load:', e.target.src);
                          e.target.style.display = 'none';
                          toast.error('Failed to load question image');
                        }}
                      />
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={styles.previewOption(question.correct === 'A')}>
                      <strong>A:</strong> {question.options.a}
                    </div>
                    <div style={styles.previewOption(question.correct === 'B')}>
                      <strong>B:</strong> {question.options.b}
                    </div>
                    <div style={styles.previewOption(question.correct === 'C')}>
                      <strong>C:</strong> {question.options.c}
                    </div>
                    <div style={styles.previewOption(question.correct === 'D')}>
                      <strong>D:</strong> {question.options.d}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '15px' }}>
                    <span style={styles.correctAnswerBadge}>
                      ✓ Correct Answer: {question.correct}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
          {(!currentSession?.questions || currentSession?.questions.length === 0) && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📝</div>
              <h4>No questions added yet</h4>
              <p>Add questions using the methods above to see them here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default QuestionsPreview;