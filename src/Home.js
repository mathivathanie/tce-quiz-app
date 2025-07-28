import React, { useState, useEffect, useCallback } from 'react';
import './Home.css';

const QuizApp = () => {
  // Quiz data - 20 sample questions
  const quizData = [
    {
      question: "What is the time complexity of binary search?",
      options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
      correct: 1
    },
    {
      question: "Which data structure uses LIFO principle?",
      options: ["Queue", "Stack", "Array", "Linked List"],
      correct: 1
    },
    {
      question: "What does HTML stand for?",
      options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink and Text Markup Language"],
      correct: 0
    },
    {
      question: "Which of the following is not a programming language?",
      options: ["Python", "Java", "HTML", "C++"],
      correct: 2
    },
    {
      question: "What is the result of 2^3 in most programming languages?",
      options: ["6", "8", "9", "Error"],
      correct: 1
    },
    {
      question: "Which protocol is used for secure web communication?",
      options: ["HTTP", "HTTPS", "FTP", "SMTP"],
      correct: 1
    },
    {
      question: "What does CPU stand for?",
      options: ["Computer Processing Unit", "Central Processing Unit", "Central Program Unit", "Computer Program Unit"],
      correct: 1
    },
    {
      question: "Which of these is a NoSQL database?",
      options: ["MySQL", "PostgreSQL", "MongoDB", "Oracle"],
      correct: 2
    },
    {
      question: "What is the default port for HTTP?",
      options: ["80", "443", "21", "25"],
      correct: 0
    },
    {
      question: "Which sorting algorithm has the best average time complexity?",
      options: ["Bubble Sort", "Selection Sort", "Quick Sort", "Insertion Sort"],
      correct: 2
    },
    {
      question: "What does API stand for?",
      options: ["Application Programming Interface", "Advanced Programming Interface", "Application Program Integration", "Advanced Program Integration"],
      correct: 0
    },
    {
      question: "Which of the following is a version control system?",
      options: ["Docker", "Git", "Node.js", "React"],
      correct: 1
    },
    {
      question: "What is the maximum value of an unsigned 8-bit integer?",
      options: ["127", "255", "256", "128"],
      correct: 1
    },
    {
      question: "Which language is primarily used for iOS app development?",
      options: ["Java", "Kotlin", "Swift", "C#"],
      correct: 2
    },
    {
      question: "What does RAM stand for?",
      options: ["Random Access Memory", "Read Access Memory", "Rapid Access Memory", "Real Access Memory"],
      correct: 0
    },
    {
      question: "Which of these is not a web framework?",
      options: ["React", "Angular", "Vue", "Photoshop"],
      correct: 3
    },
    {
      question: "What is the binary representation of decimal 10?",
      options: ["1010", "1100", "1001", "1110"],
      correct: 0
    },
    {
      question: "Which company developed JavaScript?",
      options: ["Microsoft", "Google", "Netscape", "Apple"],
      correct: 2
    },
    {
      question: "What does SQL stand for?",
      options: ["Structured Query Language", "Simple Query Language", "Standard Query Language", "System Query Language"],
      correct: 0
    },
    {
      question: "Which of the following is used for styling web pages?",
      options: ["HTML", "JavaScript", "CSS", "PHP"],
      correct: 2
    }
  ];

  // State management
  const [currentView, setCurrentView] = useState('form'); // 'form', 'quiz', 'result'
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    regNo: '',
    department: ''
  });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState(new Array(quizData.length).fill(null));
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [showWarning, setShowWarning] = useState(false);

  // Timer effect
  useEffect(() => {
    let timerInterval;
    
    if (currentView === 'quiz' && timeLeft > 0) {
      timerInterval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            submitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [currentView, timeLeft]);

  // Page navigation and tab switching prevention
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (currentView === 'quiz') {
        e.preventDefault();
        e.returnValue = '';
        showWarningMessage();
        return '';
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && currentView === 'quiz') {
        showWarningMessage();
        // Auto-submit immediately when tab is switched
        submitQuiz();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.key === 'u') ||
          (e.ctrlKey && e.key === 'r') ||
          (e.key === 'F5')) {
        e.preventDefault();
        showWarningMessage();
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [currentView]);

  const showWarningMessage = () => {
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 3000);
  };

  const startQuiz = () => {
    if (!studentInfo.name.trim() || !studentInfo.regNo.trim() || !studentInfo.department) {
      alert('Please fill in all required fields!');
      return;
    }
    
    setCurrentView('quiz');
    setCurrentQuestion(0);
    setUserAnswers(new Array(quizData.length).fill(null));
    setTimeLeft(30 * 60);
  };

  const selectOption = (optionIndex) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = optionIndex;
    setUserAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestion === quizData.length - 1) {
      submitQuiz();
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const submitQuiz = useCallback(() => {
    const correctAnswers = userAnswers.reduce((count, answer, index) => {
      return answer === quizData[index].correct ? count + 1 : count;
    }, 0);

    setCurrentView('result');
  }, [userAnswers]);

  const restartQuiz = () => {
    setCurrentView('form');
    setStudentInfo({ name: '', regNo: '', department: '' });
    setCurrentQuestion(0);
    setUserAnswers(new Array(quizData.length).fill(null));
    setTimeLeft(30 * 60);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateResults = () => {
    const correctAnswers = userAnswers.reduce((count, answer, index) => {
      return answer === quizData[index].correct ? count + 1 : count;
    }, 0);
    
    const totalQuestions = quizData.length;
    const wrongAnswers = totalQuestions - correctAnswers;
    const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    let grade;
    if (scorePercentage >= 90) grade = 'A+';
    else if (scorePercentage >= 80) grade = 'A';
    else if (scorePercentage >= 70) grade = 'B';
    else if (scorePercentage >= 60) grade = 'C';
    else if (scorePercentage >= 50) grade = 'D';
    else grade = 'F';

    return { correctAnswers, wrongAnswers, scorePercentage, grade };
  };

  return (
    <div className="min-h-screen select-none">
      {/* Warning Banner */}
      {showWarning && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-3 text-center z-50">
          ⚠️ Do not try to leave this page or switch tabs. Your quiz will be automatically submitted!
        </div>
      )}

      <div className="max-w-4xl">
        <div className="bg-white/95">
          
          {/* Student Information Form */}
          {currentView === 'form' && (
            <div className="animate-fadeIn">
              <div className="text-center">
                <h1>📚 Student Quiz Portal</h1>
                <p>Please enter your details to begin the assessment</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={studentInfo.name}
                    onChange={(e) => setStudentInfo({...studentInfo, name: e.target.value})}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label>Registration Number *</label>
                  <input
                    type="text"
                    value={studentInfo.regNo}
                    onChange={(e) => setStudentInfo({...studentInfo, regNo: e.target.value})}
                    placeholder="Enter your registration number"
                  />
                </div>
                
                <div>
                  <label>Department *</label>
                  <select
                    value={studentInfo.department}
                    onChange={(e) => setStudentInfo({...studentInfo, department: e.target.value})}
                  >
                    <option value="">Select your department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics & Communication</option>
                    <option value="Mechanical">Mechanical Engineering</option>
                    <option value="Civil">Civil Engineering</option>
                    <option value="Electrical">Electrical Engineering</option>
                    <option value="Biomedical">Biomedical Engineering</option>
                    <option value="Chemical">Chemical Engineering</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <button
                  onClick={startQuiz}
                  className="btn-primary"
                >
                  Start Quiz
                </button>
              </div>
            </div>
          )}

          {/* Quiz Section */}
          {currentView === 'quiz' && (
            <div className="animate-fadeIn">
              {/* Progress Bar */}
              <div className="progress-container">
                <div 
                  className="progress-bar"
                  style={{ width: `${((currentQuestion + 1) / quizData.length) * 100}%` }}
                ></div>
              </div>
              
              {/* Question Header */}
              <div className="question-header">
                <div className="question-number">
                  Question {currentQuestion + 1} of {quizData.length}
                </div>
                <div className="timer">
                  {formatTime(timeLeft)}
                </div>
              </div>
              
              {/* Question */}
              <div>
                <div className="question-text">
                  {quizData[currentQuestion].question}
                </div>
                
                {/* Options */}
                <div className="options-container">
                  {quizData[currentQuestion].options.map((option, index) => (
                    <div
                      key={index}
                      onClick={() => selectOption(index)}
                      className={`option ${userAnswers[currentQuestion] === index ? 'selected' : ''}`}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Navigation */}
              <div className="navigation">
                {currentQuestion > 0 ? (
                  <button
                    onClick={previousQuestion}
                    className="btn-secondary"
                  >
                    Previous
                  </button>
                ) : (
                  <div className="navigation-spacer"></div>
                )}
                
                <button
                  onClick={nextQuestion}
                  className="btn-next"
                >
                  {currentQuestion === quizData.length - 1 ? 'Submit Quiz' : 'Next Question'}
                </button>
              </div>
            </div>
          )}

          {/* Result Section */}
          {currentView === 'result' && (
            <div className="animate-fadeIn text-center">
              <h2>🎉 Quiz Completed!</h2>
              
              {/* Score Circle */}
              <div className="score-circle">
                {calculateResults().scorePercentage}%
              </div>
              
              {/* Result Details */}
              <div className="result-details">
                <div className="result-grid">
                  <div className="result-row">
                    <span className="result-label">Student Name:</span>
                    <span className="result-value">{studentInfo.name}</span>
                  </div>
                  <div className="result-row">
                    <span className="result-label">Registration No:</span>
                    <span className="result-value">{studentInfo.regNo}</span>
                  </div>
                  <div className="result-row">
                    <span className="result-label">Department:</span>
                    <span className="result-value">{studentInfo.department}</span>
                  </div>
                  <div className="result-row">
                    <span className="result-label">Total Questions:</span>
                    <span className="result-value">{quizData.length}</span>
                  </div>
                  <div className="result-row">
                    <span className="result-label">Correct Answers:</span>
                    <span className="result-value">{calculateResults().correctAnswers}</span>
                  </div>
                  <div className="result-row">
                    <span className="result-label">Wrong Answers:</span>
                    <span className="result-value">{calculateResults().wrongAnswers}</span>
                  </div>
                  <div className="result-row">
                    <span className="result-label">Score:</span>
                    <span className="result-value">{calculateResults().scorePercentage}%</span>
                  </div>
                  <div className="result-row">
                    <span className="result-label">Grade:</span>
                    <span className="grade-value">{calculateResults().grade}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={restartQuiz}
                className="btn-restart"
              >
                Take Another Quiz
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizApp;