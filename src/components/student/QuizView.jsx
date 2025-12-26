import React from 'react';
import { styles } from '../common/styles';
import { ToastContainer, toast } from 'react-toastify';
import QuestionNavigation from '../common/QuestionNavigation';
import { formatTime } from './studentUtils';

const QuizView = ({ 
  currentQuiz, 
  currentQuestion, 
  userAnswers, 
  timeLeft, 
  selectOption, 
  nextQuestion, 
  previousQuestion, 
  showWarning, 
  warningMessage,
  loggedInUser,
  API_BASE_URL,
  selectedPassage,
  setSelectedPassage,
  showPassageModal,
  setShowPassageModal,
  audioRef,
  isAudioPlaying,
  setIsAudioPlaying,
  setCurrentQuestion
}) => {
  const question = currentQuiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / currentQuiz.questions.length) * 100;

  // Calculate answered questions (0-based index)
  const answeredQuestions = userAnswers
    .map((ans, idx) => (ans !== null ? idx : null))
    .filter((v) => v !== null);

  return (
    <div style={styles.container}>
      <ToastContainer />
      {showWarning && <div style={styles.warningBanner}>{warningMessage}</div>}
      <div style={styles.card}>
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
        <div style={styles.timer}>{formatTime(timeLeft)}</div>
        <div style={styles.progressBar}>
          <div style={styles.progressFill(progress)}></div>
        </div>
        {currentQuiz?.audioUrl && (
    <div style={{ marginBottom: '20px' }}>
      <audio controls src={currentQuiz.audioUrl} style={{ width: '100%' }} />
    </div>
  )}

        <div style={styles.questionCard}>
          <h3>
            Question {currentQuestion + 1} of {currentQuiz.questions.length}
          </h3>
            {question.questionType === 'image' && question.imageUrl && (
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <img 
        src={`${API_BASE_URL}${question.imageUrl}`}
        alt="Question"
        style={{ 
          maxWidth: '100%', 
          maxHeight: '400px', 
          borderRadius: '8px',
          border: '1px solid #ddd',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
        onError={(e) => {
          e.target.style.display = 'none';
          toast.error('Failed to load question image');
        }}
      />
    </div>
  )}
           {question.question && <p>{question.question}</p>}
        </div>

        {currentQuiz.hasAudio && (
          <div style={styles.audioPlayer}>
            <audio
              ref={audioRef}
              src={`${API_BASE_URL}/api/quiz-sessions/${currentQuiz.sessionId}/audio`}
              onPlay={() => setIsAudioPlaying(true)}
              onPause={() => setIsAudioPlaying(false)}
              controls
            />
          </div>
        )}

        {currentQuiz.passages && currentQuiz.passages.length > 0 && (
          <div>
            {currentQuiz.passages.map((passage) => (
              <button
                key={passage._id}
                style={styles.passageButton}
                onClick={() => {
                  setSelectedPassage(passage);
                  setShowPassageModal(true);
                }}
              >
                View Passage: {passage.title}
              </button>
            ))}
          </div>
        )}

        <div>
          {Object.entries(question.options).map(([key, value], index) => {
            // Convert the stored answer (A,B,C,D) to display number (1,2,3,4) for comparison
            const displayNumber = (index + 1).toString();
            const isSelected = userAnswers[currentQuestion] === key.toUpperCase();
            
            return (
              <div
                key={key}
                style={styles.option(isSelected)}
                onClick={() => selectOption(index)}
              >
                {displayNumber}: {value}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <button style={styles.button} onClick={previousQuestion} disabled={currentQuestion === 0}>
            ← Previous
          </button>
          <button style={styles.button} onClick={nextQuestion}>
            {currentQuestion === currentQuiz.questions.length - 1 ? 'Submit' : 'Next →'}
          </button>
        </div>
      </div>

      {/* Footer Navigation Panel */}
      <QuestionNavigation
        totalQuestions={currentQuiz.questions.length}
        answeredQuestions={answeredQuestions}
        currentQuestion={currentQuestion}
        onNavigate={setCurrentQuestion}
      />

      {showPassageModal && selectedPassage && (
        <div style={styles.passageModal}>
          <div style={styles.passageContent}>
            <button onClick={() => setShowPassageModal(false)} style={{ float: 'right' }}>
              Close
            </button>
            <h3>{selectedPassage.title}</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{selectedPassage.content}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizView;

