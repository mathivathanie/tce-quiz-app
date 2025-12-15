import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { styles } from '../common/styles';
import LoadingError from '../common/LoadingError';

const ManageSessions = ({
  quizSessions,
  loading,
  error,
  setActiveAdminSection,
  loadQuizSessions,
  API_BASE_URL
}) => {
  const [editingSession, setEditingSession] = useState(null);
  const [editSessionData, setEditSessionData] = useState({
    name: '',
    questions: [],
    passages: [],
    audioFiles: []
  });
  const [newQuestionData, setNewQuestionData] = useState({
    question: '',
    options: { a: '', b: '', c: '', d: '' },
    correct: ''
  });

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

  const handleStartQuiz = async (sessionId) => {
    try {
      await apiCall(`/api/quiz-sessions/${sessionId}/start`, 'PUT');
      await loadQuizSessions();
      toast.info(`Quiz Started! Students can join using code: ${sessionId}`);
    } catch (error) {
      toast.error('Failed to start quiz: ' + error.message);
    }
  };

  const handleEndQuiz = async (sessionId) => {
    try {
      await apiCall(`/api/quiz-sessions/${sessionId}/end`, 'PUT');
      await loadQuizSessions();
      toast.info('Quiz Ended!');
    } catch (error) {
      toast.error('Failed to end quiz: ' + error.message);
    }
  };

  const handleGenerateLink = (sessionId) => {
    const currentSession = quizSessions.find((s) => s.sessionId === sessionId);
    if (currentSession && currentSession.questions.length > 0) {
      toast.info(`Quiz Code: ${sessionId}\nShare this code with students to join the quiz.`);
    } else {
      toast.info('Please add at least one question before generating the code.');
    }
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setEditSessionData({
      name: session.name,
      questions: [...session.questions],
      passages: session.passages || [],
      audioFiles: session.audioFiles || []
    });
  };

  const handleUpdateSession = async () => {
    if (!editingSession) return;
    
    try {
      const response = await apiCall(`/api/quiz-sessions/${editingSession.sessionId}`, 'PUT', editSessionData);
      if (response.success) {
        await loadQuizSessions();
        setEditingSession(null);
        setEditSessionData({ name: '', questions: [], passages: [], audioFiles: [] });
        toast.success('Quiz session updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update quiz session: ' + error.message);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this quiz session? This will also delete all associated results and violations.');
    if (!confirmDelete) return;

    try {
      await apiCall(`/api/quiz-sessions/${sessionId}`, 'DELETE');
      await loadQuizSessions();
      toast.success('Quiz session deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete quiz session: ' + error.message);
    }
  };

  const cancelEditSession = () => {
    setEditingSession(null);
    setEditSessionData({ name: '', questions: [], passages: [], audioFiles: [] });
  };

  const handleAddQuestionToSession = () => {
    if (!newQuestionData.question || !newQuestionData.options.a || !newQuestionData.options.b || 
        !newQuestionData.options.c || !newQuestionData.options.d || !newQuestionData.correct) {
      toast.info('Please fill all question fields!');
      return;
    }

    const newQuestion = {
      question: newQuestionData.question,
      options: { ...newQuestionData.options },
      correct: newQuestionData.correct
    };

    setEditSessionData({
      ...editSessionData,
      questions: [...editSessionData.questions, newQuestion]
    });

    setNewQuestionData({
      question: '',
      options: { a: '', b: '', c: '', d: '' },
      correct: ''
    });

    toast.success('Question added to session!');
  };

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
        <h2>Quiz Sessions</h2>
        <div>
          {quizSessions.map((session) => (
            <div key={session.sessionId} style={styles.questionCard}>
              {editingSession && editingSession.sessionId === session.sessionId ? (
                <div style={styles.editSessionForm}>
                  <h3>Edit Quiz Session</h3>
                  <input
                    type="text"
                    value={editSessionData.name}
                    onChange={(e) => setEditSessionData({ ...editSessionData, name: e.target.value })}
                    placeholder="Quiz Session Name"
                    style={styles.input}
                  />
                  <div style={{ marginTop: '15px' }}>
                    <h4>Questions ({editSessionData.questions.length})</h4>
                    
                    {/* Add New Question Form */}
                    <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                      <h5 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>➕ Add New Question</h5>
                      <input
                        type="text"
                        value={newQuestionData.question}
                        onChange={(e) => setNewQuestionData({ ...newQuestionData, question: e.target.value })}
                        placeholder="Enter new question"
                        style={styles.input}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <input
                          type="text"
                          value={newQuestionData.options.a}
                          onChange={(e) => setNewQuestionData({ 
                            ...newQuestionData, 
                            options: { ...newQuestionData.options, a: e.target.value } 
                          })}
                          placeholder="Option A"
                          style={styles.input}
                        />
                        <input
                          type="text"
                          value={newQuestionData.options.b}
                          onChange={(e) => setNewQuestionData({ 
                            ...newQuestionData, 
                            options: { ...newQuestionData.options, b: e.target.value } 
                          })}
                          placeholder="Option B"
                          style={styles.input}
                        />
                        <input
                          type="text"
                          value={newQuestionData.options.c}
                          onChange={(e) => setNewQuestionData({ 
                            ...newQuestionData, 
                            options: { ...newQuestionData.options, c: e.target.value } 
                          })}
                          placeholder="Option C"
                          style={styles.input}
                        />
                        <input
                          type="text"
                          value={newQuestionData.options.d}
                          onChange={(e) => setNewQuestionData({ 
                            ...newQuestionData, 
                            options: { ...newQuestionData.options, d: e.target.value } 
                          })}
                          placeholder="Option D"
                          style={styles.input}
                        />
                      </div>
                      <select
                        value={newQuestionData.correct}
                        onChange={(e) => setNewQuestionData({ ...newQuestionData, correct: e.target.value })}
                        style={styles.select}
                      >
                        <option value="">Select Correct Answer</option>
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                      <div style={{ textAlign: 'center', marginTop: '10px' }}>
                        <button 
                          style={{ ...styles.button, background: 'linear-gradient(45deg, #4CAF50, #45a049)' }}
                          onClick={handleAddQuestionToSession}
                        >
                          Add Question
                        </button>
                      </div>
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' }}>
                      {editSessionData.questions.map((question, index) => (
                        <div key={index} style={styles.questionPreviewCard}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <h5 style={{ margin: 0 }}>Question {index + 1}</h5>
                            <button 
                              style={{ ...styles.resumeButton, background: 'linear-gradient(45deg, #f44336, #d32f2f)', padding: '4px 8px', fontSize: '10px' }}
                              onClick={() => {
                                const newQuestions = editSessionData.questions.filter((_, i) => i !== index);
                                setEditSessionData({ ...editSessionData, questions: newQuestions });
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                          <p style={{ fontSize: '14px', marginBottom: '8px' }}><strong>Q:</strong> {question.question}</p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '12px' }}>
                            <span style={styles.previewOption(question.correct === 'A')}><strong>A:</strong> {question.options.a}</span>
                            <span style={styles.previewOption(question.correct === 'B')}><strong>B:</strong> {question.options.b}</span>
                            <span style={styles.previewOption(question.correct === 'C')}><strong>C:</strong> {question.options.c}</span>
                            <span style={styles.previewOption(question.correct === 'D')}><strong>D:</strong> {question.options.d}</span>
                          </div>
                          <div style={{ textAlign: 'center', marginTop: '8px' }}>
                            <span style={styles.correctAnswerBadge}>✓ {question.correct}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {editSessionData.passages && editSessionData.passages.length > 0 && (
                    <div style={{ marginTop: '15px' }}>
                      <h4>Passages ({editSessionData.passages.length})</h4>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {editSessionData.passages.map((passage, index) => (
                          <div key={index} style={styles.passagePreview}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong>{passage.title}</strong>
                              <button 
                                style={{ ...styles.resumeButton, background: 'linear-gradient(45deg, #f44336, #d32f2f)', padding: '4px 8px', fontSize: '10px' }}
                                onClick={() => {
                                  const newPassages = editSessionData.passages.filter((_, i) => i !== index);
                                  setEditSessionData({ ...editSessionData, passages: newPassages });
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                              {passage.content.substring(0, 100)}...
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {editSessionData.audioFiles && editSessionData.audioFiles.length > 0 && (
                    <div style={{ marginTop: '15px' }}>
                      <h4>Audio Files ({editSessionData.audioFiles.length})</h4>
                      <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {editSessionData.audioFiles.map((audio, index) => (
                          <div key={index} style={styles.audioPreview}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px' }}>🎵 {audio.originalName}</span>
                              <button 
                                style={{ ...styles.resumeButton, background: 'linear-gradient(45deg, #f44336, #d32f2f)', padding: '4px 8px', fontSize: '10px' }}
                                onClick={() => {
                                  const newAudioFiles = editSessionData.audioFiles.filter((_, i) => i !== index);
                                  setEditSessionData({ ...editSessionData, audioFiles: newAudioFiles });
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button style={styles.button} onClick={handleUpdateSession}>
                      Update Session
                    </button>
                    <button style={{ ...styles.button, background: 'grey', marginLeft: '10px' }} onClick={cancelEditSession}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3>{session.name}</h3>
                  <p>ID: {session.sessionId}</p>
                  <p>Status: {session.isActive ? '🟢 Active' : '🔴 Inactive'}</p>
                  <p>Questions: {session.questions.length}</p>
                  {session.passages && session.passages.length > 0 && (
                    <p>Passages: {session.passages.length}</p>
                  )}
                  {session.audioFiles && session.audioFiles.length > 0 && (
                    <p>Audio Files: {session.audioFiles.length}</p>
                  )}
                  <p>Created: {new Date(session.createdAt).toLocaleDateString()}</p>
                  
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px' }}>
                    <button style={styles.button} onClick={() => handleStartQuiz(session.sessionId)} disabled={loading || session.isActive}>
                      Start
                    </button>
                    <button style={styles.button} onClick={() => handleEndQuiz(session.sessionId)} disabled={loading || !session.isActive}>
                      End
                    </button>
                    <button style={styles.button} onClick={() => handleGenerateLink(session.sessionId)} disabled={loading}>
                      Link
                    </button>
                    <button 
                      style={{ ...styles.button, background: 'linear-gradient(45deg, #2196F3, #1976D2)' }}
                      onClick={() => handleEditSession(session)}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      style={{ ...styles.button, background: 'linear-gradient(45deg, #f44336, #d32f2f)' }}
                      onClick={() => handleDeleteSession(session.sessionId)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageSessions;