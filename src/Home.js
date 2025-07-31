import React, { useState, useEffect, useCallback } from 'react';

const IntegratedQuizApp = () => {
  // Configuration - Update these URLs to match your backend
  const API_BASE_URL = 'http://localhost:3001'; // Change this to your backend URL
  
  // Global state for quiz sessions and results
  const [quizSessions, setQuizSessions] = useState([]);
  const [studentResults, setStudentResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // App state
  const [currentView, setCurrentView] = useState('home'); // 'home', 'admin', 'student'
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  
  // Admin states
  const [adminCode, setAdminCode] = useState('');
  const [activeAdminSection, setActiveAdminSection] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState('');
  const [resultSessionCode, setResultSessionCode] = useState('');
// ADD these new CSV states:
const [entryMethod, setEntryMethod] = useState('manual'); // 'manual' or 'csv'
const [csvFile, setCsvFile] = useState(null);
const [csvPreview, setCsvPreview] = useState([]);
const [showCsvPreview, setShowCsvPreview] = useState(false);
const [csvErrors, setCsvErrors] = useState([]);

  
  // Student states
  const [studentView, setStudentView] = useState('codeEntry'); // 'codeEntry', 'form', 'quiz', 'result'
  const [quizCode, setQuizCode] = useState('');
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    regNo: '',
    department: ''
  });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [showWarning, setShowWarning] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0); // NEW: Track tab switches

  // NEW: CSV Export Function
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to export!');
      return;
    }

    // Define CSV headers
    const headers = [
      'Student Name',
      'Registration Number',
      'Department',
      'Score',
      'Total Questions',
      'Percentage',
      'Grade',
      'Submission Date',
      'Submission Time'
    ];

    // Convert data to CSV format
    const csvContent = [
      headers.join(','),
      ...data.map(result => {
        const submissionDate = new Date(result.submittedAt);
        const grade = getGradeFromPercentage(result.percentage);
        
        return [
          `"${result.studentName}"`,
          `"${result.regNo}"`,
          `"${result.department}"`,
          result.score,
          result.totalQuestions,
          result.percentage,
          `"${grade}"`,
          submissionDate.toLocaleDateString(),
          submissionDate.toLocaleTimeString()
        ].join(',');
      })
    ].join('\n');

    // Create and download the file
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

  // NEW: Helper function to get grade from percentage
  const getGradeFromPercentage = (percentage) => {
    if (percentage >= 90) return 'A+';
    else if (percentage >= 80) return 'A';
    else if (percentage >= 70) return 'B';
    else if (percentage >= 60) return 'C';
    else if (percentage >= 50) return 'D';
    else return 'F';
  };

  // NEW: Handle CSV export for current results
  const handleExportCSV = () => {
    if (!resultSessionCode) {
      alert('Please enter a quiz code first!');
      return;
    }

    if (studentResults.length === 0) {
      alert('No results found to export!');
      return;
    }

    const currentSession = quizSessions.find(s => s.sessionId === resultSessionCode);
    const sessionName = currentSession ? currentSession.name : resultSessionCode;
    const filename = `Quiz_Results_${sessionName}_${resultSessionCode}_${new Date().toISOString().split('T')[0]}.csv`;
    
    exportToCSV(studentResults, filename);
  };

  // API Functions
  const apiCall = async (endpoint, method = 'GET', data = null) => {
    setLoading(true);
    setError('');
    
    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      if (data) {
        config.body = JSON.stringify(data);
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
      setError(error.message);
      console.error('API Error:', error);
      throw error;
    }
  };

  // Load quiz sessions on component mount and when needed
  const loadQuizSessions = async () => {
    try {
      const sessions = await apiCall('/api/quiz-sessions');
      setQuizSessions(sessions);
    } catch (error) {
      alert('Failed to load quiz sessions: ' + error.message);
    }
  };

  // Load results for a specific session
  const loadSessionResults = async (sessionId) => {
    try {
      const results = await apiCall(`/api/quiz-results/${sessionId}`);
      setStudentResults(results);
    } catch (error) {
      alert('Failed to load results: ' + error.message);
    }
  };

  // Admin authentication
  const handleAdminLogin = async () => {
    try {
      const response = await apiCall('/api/admin/login', 'POST', { 
        adminCode 
      });
      
      if (response.success) {
        setIsAdminAuthenticated(true);
        setCurrentView('admin');
        await loadQuizSessions(); // Load sessions after login
      } else {
        alert('Invalid admin code!');
      }
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  // Create new quiz session
  const handleCreateSession = async () => {
    const sessionName = prompt('Enter Quiz Session Name:');
    if (sessionName) {
      try {
        const newSession = await apiCall('/api/quiz-sessions', 'POST', {
          name: sessionName,
          createdBy: 'admin'
        });
        
        setCurrentSessionId(newSession.sessionId);
        setActiveAdminSection('create');
        await loadQuizSessions(); // Refresh sessions list
        
        alert(`Session created with ID: ${newSession.sessionId}`);
      } catch (error) {
        alert('Failed to create session: ' + error.message);
      }
    }
  };

  // Add question to current session
  const handleAddQuestion = async () => {
    if (questionText && optionA && optionB && optionC && optionD && correctOption && currentSessionId) {
      try {
        const questionData = {
          question: questionText,
          options: { 
            a: optionA, 
            b: optionB, 
            c: optionC, 
            d: optionD 
          },
          correct: correctOption,
        };

        await apiCall(`/api/quiz-sessions/${currentSessionId}/questions`, 'POST', questionData);
        
        // Reset form
        setQuestionText('');
        setOptionA('');
        setOptionB('');
        setOptionC('');
        setOptionD('');
        setCorrectOption('');
        
        // Refresh sessions to show updated questions
        await loadQuizSessions();
        
        alert('Question added successfully!');
      } catch (error) {
        alert('Failed to add question: ' + error.message);
      }
    } else {
      alert('Please fill all fields!');
    }
  };

// KEEP your existing handleAddQuestion function

// ADD these new CSV functions:

// Handle CSV file selection
const handleCsvFileSelect = (event) => {
  const file = event.target.files[0];
  if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
    setCsvFile(file);
    setCsvErrors([]);
    parseCsvFile(file);
  } else {
    alert('Please select a valid CSV file');
    event.target.value = '';
  }
};

// Parse CSV file using Papaparse
const parseCsvFile = (file) => {
  // Import Papaparse (it's available in your environment)
  import('papaparse').then(Papa => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          const errorMessages = results.errors.map(e => `Row ${e.row + 1}: ${e.message}`);
          setCsvErrors(errorMessages);
          alert('CSV parsing errors found. Check the preview section.');
          return;
        }
        
        // Validate CSV structure
        const requiredColumns = ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer'];
        const csvColumns = Object.keys(results.data[0] || {});
        const missingColumns = requiredColumns.filter(col => !csvColumns.includes(col));
        
        if (missingColumns.length > 0) {
          setCsvErrors([`Missing required columns: ${missingColumns.join(', ')}`]);
          alert(`Missing required columns: ${missingColumns.join(', ')}\n\nRequired columns: ${requiredColumns.join(', ')}`);
          return;
        }
        
        // Convert CSV data to question format
        const questions = results.data.map((row, index) => {
          const correctAnswer = row['Correct Answer']?.toString().trim().toUpperCase();
          
          return {
            question: row['Question']?.toString().trim(),
            options: {
              a: row['Option A']?.toString().trim(),
              b: row['Option B']?.toString().trim(),
              c: row['Option C']?.toString().trim(),
              d: row['Option D']?.toString().trim()
            },
            correct: correctAnswer,
            rowIndex: index + 2
          };
        });
        
        // Validate question data
        const validationErrors = [];
        questions.forEach((q, index) => {
          if (!q.question) validationErrors.push(`Row ${q.rowIndex}: Question is empty`);
          if (!q.options.a) validationErrors.push(`Row ${q.rowIndex}: Option A is empty`);
          if (!q.options.b) validationErrors.push(`Row ${q.rowIndex}: Option B is empty`);
          if (!q.options.c) validationErrors.push(`Row ${q.rowIndex}: Option C is empty`);
          if (!q.options.d) validationErrors.push(`Row ${q.rowIndex}: Option D is empty`);
          if (!['A', 'B', 'C', 'D'].includes(q.correct)) {
            validationErrors.push(`Row ${q.rowIndex}: Correct answer must be A, B, C, or D (found: ${q.correct})`);
          }
        });
        
        if (validationErrors.length > 0) {
          setCsvErrors(validationErrors);
        } else {
          setCsvErrors([]);
        }
        
        setCsvPreview(questions);
        setShowCsvPreview(true);
      },
      error: (error) => {
        setCsvErrors([`Error reading CSV file: ${error.message}`]);
        alert('Error reading CSV file: ' + error.message);
      }
    });
  });
};

// Upload CSV questions to backend
const handleCsvUpload = async () => {
  if (!csvPreview.length || !currentSessionId) {
    alert('No questions to upload or session not selected');
    return;
  }
  
  if (csvErrors.length > 0) {
    alert('Please fix the errors before uploading');
    return;
  }
  
  try {
    await apiCall(`/api/quiz-sessions/${currentSessionId}/questions/csv`, 'POST', {
      questions: csvPreview
    });
    
    // Reset CSV states
    setCsvFile(null);
    setCsvPreview([]);
    setShowCsvPreview(false);
    setCsvErrors([]);
    
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
    
    // Refresh sessions to show updated questions
    await loadQuizSessions();
    
    alert(`Successfully uploaded ${csvPreview.length} questions!`);
  } catch (error) {
    alert('Failed to upload CSV questions: ' + error.message);
  }
};

// Clear CSV upload
const clearCsvUpload = () => {
  setCsvFile(null);
  setCsvPreview([]);
  setShowCsvPreview(false);
  setCsvErrors([]);
  
  const fileInput = document.querySelector('input[type="file"]');
  if (fileInput) fileInput.value = '';
};

  // Start quiz
  const handleStartQuiz = async () => {
    try {
      await apiCall(`/api/quiz-sessions/${currentSessionId}/start`, 'PUT');
      await loadQuizSessions(); // Refresh to show updated status
      alert(`Quiz Started! Students can join using code: ${currentSessionId}`);
    } catch (error) {
      alert('Failed to start quiz: ' + error.message);
    }
  };

  // End quiz
  const handleEndQuiz = async () => {
    try {
      await apiCall(`/api/quiz-sessions/${currentSessionId}/end`, 'PUT');
      await loadQuizSessions(); // Refresh to show updated status
      alert('Quiz Ended!');
    } catch (error) {
      alert('Failed to end quiz: ' + error.message);
    }
  };

  // Generate quiz link/code
  const handleGenerateLink = () => {
    const currentSession = quizSessions.find(s => s.sessionId === currentSessionId);
    if (currentSession && currentSession.questions.length > 0) {
      alert(`Quiz Code: ${currentSessionId}\nShare this code with students to join the quiz.`);
    } else {
      alert('Please add at least one question before generating the code.');
    }
  };

  // Student joins quiz
  const handleJoinQuiz = async () => {
    try {
      const quiz = await apiCall(`/api/quiz-sessions/${quizCode.toUpperCase()}`);
      
      if (quiz) {
        if (quiz.isActive && quiz.questions.length > 0) {
          setCurrentQuiz(quiz);
          setStudentView('form');
          setUserAnswers(new Array(quiz.questions.length).fill(null));
        } else if (!quiz.isActive) {
          alert('This quiz is not currently active. Please contact your instructor.');
        } else {
          alert('This quiz has no questions yet. Please try again later.');
        }
      }
    } catch (error) {
      alert('Invalid quiz code or quiz not found. Please check and try again.');
    }
  };

  // Start student quiz
  const startStudentQuiz = () => {
    if (!studentInfo.name.trim() || !studentInfo.regNo.trim() || !studentInfo.department) {
      alert('Please fill in all required fields!');
      return;
    }
    
    setStudentView('quiz');
    setCurrentQuestion(0);
    setTimeLeft(30 * 60);
    setTabSwitchCount(0); // UPDATED: Reset tab switch counter
  };

  // Select answer option
  const selectOption = (optionIndex) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = ['A', 'B', 'C', 'D'][optionIndex];
    setUserAnswers(newAnswers);
  };

  // Navigate to next question
  const nextQuestion = () => {
    if (currentQuestion === currentQuiz.questions.length - 1) {
      submitQuiz();
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  // Navigate to previous question
  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  // Submit quiz results
  const submitQuiz = useCallback(async () => {
    if (!currentQuiz) return;
    
    try {
      const correctAnswers = userAnswers.reduce((count, answer, index) => {
        return answer === currentQuiz.questions[index].correct ? count + 1 : count;
      }, 0);

      const resultData = {
        sessionId: currentQuiz.sessionId,
        studentName: studentInfo.name,
        regNo: studentInfo.regNo,
        department: studentInfo.department,
        answers: userAnswers,
        score: correctAnswers,
        totalQuestions: currentQuiz.questions.length,
        percentage: Math.round((correctAnswers / currentQuiz.questions.length) * 100)
      };

      await apiCall('/api/quiz-results', 'POST', resultData);
      setStudentView('result');
    } catch (error) {
      alert('Failed to submit quiz: ' + error.message);
    }
  }, [userAnswers, currentQuiz, studentInfo]);

  // Restart student session
  const restartStudent = () => {
    setStudentView('codeEntry');
    setQuizCode('');
    setCurrentQuiz(null);
    setStudentInfo({ name: '', regNo: '', department: '' });
    setCurrentQuestion(0);
    setUserAnswers([]);
    setTimeLeft(30 * 60);
    setTabSwitchCount(0); // UPDATED: Reset tab switch counter
  };

  // Load results when result session code changes
  useEffect(() => {
    if (resultSessionCode && activeAdminSection === 'results') {
      loadSessionResults(resultSessionCode);
    }
  }, [resultSessionCode, activeAdminSection]);

  // Timer effect for student quiz
  useEffect(() => {
    let timerInterval;
    
    if (studentView === 'quiz' && timeLeft > 0) {
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
  }, [studentView, timeLeft, submitQuiz]);

  // Security effects for student quiz
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (studentView === 'quiz') {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    // UPDATED: Modified visibility change handler for tab switch tracking
    const handleVisibilityChange = () => {
      if (document.hidden && studentView === 'quiz') {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          
          if (newCount === 1) {
            // First tab switch - show warning only
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 3000);
            return newCount;
          } else if (newCount >= 2) {
            // Second or more tab switches - auto submit
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 3000);
            submitQuiz();
            return newCount;
          }
          
          return newCount;
        });
      }
    };

    const handleKeyDown = (e) => {
      if (studentView === 'quiz' && (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 'r') ||
        (e.key === 'F5')
      )) {
        e.preventDefault();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
      }
    };

    const handleContextMenu = (e) => {
      if (studentView === 'quiz') {
        e.preventDefault();
      }
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
  }, [studentView, submitQuiz]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateStudentResults = () => {
    if (!currentQuiz) return { correctAnswers: 0, wrongAnswers: 0, scorePercentage: 0, grade: 'F' };
    
    const correctAnswers = userAnswers.reduce((count, answer, index) => {
      return answer === currentQuiz.questions[index].correct ? count + 1 : count;
    }, 0);
    
    const totalQuestions = currentQuiz.questions.length;
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

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    },
    card: {
      maxWidth: '900px',
      margin: '0 auto',
      background: 'white',
      borderRadius: '15px',
      padding: '30px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
    },
    button: {
      background: 'linear-gradient(45deg, #667eea, #764ba2)',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '25px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
      margin: '5px',
      transition: 'all 0.3s ease',
      opacity: loading ? 0.7 : 1
    },
    // NEW: CSV Export Button Style
    csvButton: {
      background: 'linear-gradient(45deg, #4CAF50, #45a049)',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
      margin: '5px',
      transition: 'all 0.3s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    input: {
      width: '100%',
      padding: '12px',
      margin: '10px 0',
      border: '2px solid #ddd',
      borderRadius: '8px',
      fontSize: '16px',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '12px',
      margin: '10px 0',
      border: '2px solid #ddd',
      borderRadius: '8px',
      fontSize: '16px',
      boxSizing: 'border-box',
      background: 'white'
    },
    option: (isSelected) => ({
      padding: '15px',
      margin: '10px 0',
      border: `2px solid ${isSelected ? '#667eea' : '#ddd'}`,
      borderRadius: '10px',
      cursor: 'pointer',
      backgroundColor: isSelected ? '#f0f4ff' : 'white',
      transition: 'all 0.3s ease'
    }),
    progressBar: {
      width: '100%',
      height: '8px',
      backgroundColor: '#e0e0e0',
      borderRadius: '4px',
      marginBottom: '20px',
      overflow: 'hidden'
    },
    progressFill: (width) => ({
      height: '100%',
      backgroundColor: '#667eea',
      width: `${width}%`,
      transition: 'width 0.3s ease'
    }),
    timer: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#f44336',
      textAlign: 'center',
      padding: '10px',
      border: '2px solid #f44336',
      borderRadius: '10px',
      marginBottom: '20px'
    },
    questionCard: {
      background: '#f9f9f9',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '20px',
      borderLeft: '4px solid #667eea'
    },
    resultCard: {
      background: '#f0f8ff',
      padding: '20px',
      borderRadius: '15px',
      textAlign: 'center',
      margin: '20px 0'
    },
    scoreCircle: (percentage) => ({
      width: '150px',
      height: '150px',
      borderRadius: '50%',
      background: `conic-gradient(#4CAF50 ${percentage * 3.6}deg, #e0e0e0 0deg)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '20px auto',
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#333'
    }),
    warningBanner: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: '#f44336',
      color: 'white',
      padding: '15px',
      textAlign: 'center',
      zIndex: 1000,
      fontSize: '16px',
      fontWeight: 'bold'
    },
    errorMessage: {
      background: '#f8d7da',
      color: '#721c24',
      padding: '10px',
      borderRadius: '5px',
      margin: '10px 0',
      border: '1px solid #f5c6cb'
    },
    loadingSpinner: {
      display: 'inline-block',
      marginLeft: '10px',
      fontSize: '16px'
    },
    // NEW: Results header style
    resultsHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '10px'
    }
  };

  // Loading and Error Display Component
  const LoadingError = () => (
    <>
      {loading && <span style={styles.loadingSpinner}>⏳ Loading...</span>}
      {error && <div style={styles.errorMessage}>❌ Error: {error}</div>}
    </>
  );

  // Home page
  if (currentView === 'home') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <LoadingError />
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ fontSize: '3rem', color: '#333', marginBottom: '10px' }}>🎓 Quiz Portal</h1>
            <p style={{ fontSize: '1.2rem', color: '#666' }}>Choose your role to continue</p>
            <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '10px' }}>
              Backend Integration: {API_BASE_URL}
            </p>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '30px', border: '2px solid #ddd', borderRadius: '15px', minWidth: '200px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>👨‍🎓</div>
              <h3 style={{ marginBottom: '20px' }}>Student</h3>
              <p style={{ marginBottom: '20px', color: '#666' }}>Take a quiz using the code provided by your instructor</p>
              <button style={styles.button} onClick={() => setCurrentView('student')} disabled={loading}>
                Join Quiz
              </button>
            </div>
            
            <div style={{ textAlign: 'center', padding: '30px', border: '2px solid #ddd', borderRadius: '15px', minWidth: '200px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>👨‍🏫</div>
              <h3 style={{ marginBottom: '20px' }}>Admin</h3>
              <p style={{ marginBottom: '20px', color: '#666' }}>Create and manage quizzes, view results</p>
              <button style={styles.button} onClick={() => setCurrentView('admin')} disabled={loading}>
                Admin Panel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin Panel
  if (currentView === 'admin') {
    if (!isAdminAuthenticated) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <LoadingError />
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <button style={{...styles.button, marginBottom: '20px'}} onClick={() => setCurrentView('home')} disabled={loading}>
                ← Back to Home
              </button>
              <h2>Admin Login</h2>
              <p style={{ color: '#666' }}>Enter admin code to continue</p>
            </div>
            <input
              type="password"
              placeholder="Enter admin code"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              style={styles.input}
              onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              disabled={loading}
            />
            <div style={{ textAlign: 'center' }}>
              <button style={styles.button} onClick={handleAdminLogin} disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Admin Dashboard
    if (!activeAdminSection) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <LoadingError />
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <button style={{...styles.button, marginBottom: '20px'}} onClick={() => {
                setCurrentView('home');
                setIsAdminAuthenticated(false);
                setAdminCode('');
              }} disabled={loading}>
                ← Logout
              </button>
              <h1>Admin Dashboard</h1>
              <p style={{ color: '#666' }}>Total Sessions: {quizSessions.length}</p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', padding: '30px', border: '2px solid #ddd', borderRadius: '15px', minWidth: '200px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📝</div>
                <h3>Create Quiz</h3>
                <button style={styles.button} onClick={handleCreateSession} disabled={loading}>Create</button>
              </div>
              
              <div style={{ textAlign: 'center', padding: '30px', border: '2px solid #ddd', borderRadius: '15px', minWidth: '200px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📊</div>
                <h3>View Results</h3>
                <button style={styles.button} onClick={() => setActiveAdminSection('results')} disabled={loading}>View</button>
              </div>
              
              <div style={{ textAlign: 'center', padding: '30px', border: '2px solid #ddd', borderRadius: '15px', minWidth: '200px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📋</div>
                <h3>Quiz Sessions</h3>
                <button style={styles.button} onClick={() => setActiveAdminSection('sessions')} disabled={loading}>Manage</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

   // Create Quiz Section - Both Manual Entry AND CSV Upload
if (activeAdminSection === 'create') {
  const currentSession = quizSessions.find(s => s.sessionId === currentSessionId);
  
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <LoadingError />
        <button style={{...styles.button, marginBottom: '20px'}} onClick={() => setActiveAdminSection(null)} disabled={loading}>
          ← Back to Dashboard
        </button>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2>Create Quiz: {currentSession?.name}</h2>
          <p style={{ color: '#666', fontSize: '18px' }}>Quiz Code: <strong>{currentSessionId}</strong></p>
        </div>
        
        {/* Method Selection Toggle */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'inline-flex', background: '#f0f0f0', borderRadius: '25px', padding: '5px' }}>
            <button
              style={{
                ...styles.button,
                background: entryMethod === 'manual' ? 'linear-gradient(45deg, #667eea, #764ba2)' : 'transparent',
                color: entryMethod === 'manual' ? 'white' : '#666',
                border: 'none',
                borderRadius: '20px',
                margin: '0 5px',
                padding: '10px 20px'
              }}
              onClick={() => setEntryMethod('manual')}
              disabled={loading}
            >
              ✏️ Manual Entry
            </button>
            <button
              style={{
                ...styles.button,
                background: entryMethod === 'csv' ? 'linear-gradient(45deg, #667eea, #764ba2)' : 'transparent',
                color: entryMethod === 'csv' ? 'white' : '#666',
                border: 'none',
                borderRadius: '20px',
                margin: '0 5px',
                padding: '10px 20px'
              }}
              onClick={() => setEntryMethod('csv')}
              disabled={loading}
            >
              📊 CSV Upload
            </button>
          </div>
        </div>
        
        {/* Manual Entry Section */}
        {entryMethod === 'manual' && (
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
        )}
        
        {/* CSV Upload Section */}
        {entryMethod === 'csv' && (
          <div style={{ marginBottom: '30px', padding: '25px', background: '#f0f8ff', borderRadius: '15px', border: '2px dashed #667eea' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📊</div>
              <h3 style={{ color: '#667eea', marginBottom: '15px' }}>Upload Questions via CSV</h3>
            </div>
            
            <div style={{ marginBottom: '20px', padding: '15px', background: '#fff', borderRadius: '10px', border: '1px solid #ddd' }}>
              <p style={{ color: '#333', marginBottom: '10px', fontWeight: 'bold' }}>
                📋 Required CSV Format:
              </p>
              <p style={{ color: '#666', marginBottom: '10px', fontFamily: 'monospace', fontSize: '14px' }}>
                Question, Option A, Option B, Option C, Option D, Correct Answer
              </p>
              <p style={{ color: '#666', fontSize: '14px' }}>
                • Correct Answer should be: A, B, C, or D<br />
                • All fields are required<br />
                • First row should contain column headers
              </p>
            </div>
            
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvFileSelect}
              style={{
                ...styles.input, 
                padding: '15px',
                border: '2px dashed #667eea',
                background: '#fff',
                cursor: 'pointer'
              }}
              disabled={loading}
            />
            
            {/* Error Display */}
            {csvErrors.length > 0 && (
              <div style={{
                marginTop: '20px',
                padding: '15px',
                background: '#f8d7da',
                borderRadius: '10px',
                border: '1px solid #f5c6cb'
              }}>
                <h4 style={{ color: '#721c24', marginBottom: '10px' }}>❌ Errors Found:</h4>
                <ul style={{ color: '#721c24', margin: '0', paddingLeft: '20px' }}>
                  {csvErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Preview Section */}
            {showCsvPreview && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ color: '#333', marginBottom: '15px' }}>
                  📝 Preview ({csvPreview.length} questions found)
                  {csvErrors.length === 0 && <span style={{ color: '#4CAF50', marginLeft: '10px' }}>✅ Ready to upload</span>}
                </h4>
                
                <div style={{ 
                  maxHeight: '350px', 
                  overflowY: 'auto', 
                  border: '1px solid #ddd', 
                  borderRadius: '10px',
                  background: '#fff'
                }}>
                  {csvPreview.slice(0, 3).map((q, index) => (
                    <div key={index} style={{
                      ...styles.questionCard, 
                      margin: '15px',
                      borderLeft: csvErrors.length === 0 ? '4px solid #4CAF50' : '4px solid #f44336'
                    }}>
                      <strong>Q{index + 1}:</strong> {q.question}<br />
                      <div style={{ marginTop: '10px', fontSize: '14px' }}>
                        <strong>A)</strong> {q.options.a}<br />
                        <strong>B)</strong> {q.options.b}<br />
                        <strong>C)</strong> {q.options.c}<br />
                        <strong>D)</strong> {q.options.d}<br />
                        <strong style={{ color: '#4CAF50' }}>Correct: {q.correct}</strong>
                      </div>
                    </div>
                  ))}
                  {csvPreview.length > 3 && (
                    <p style={{ textAlign: 'center', color: '#666', padding: '15px', fontStyle: 'italic' }}>
                      ... and {csvPreview.length - 3} more questions
                    </p>
                  )}
                </div>
                
                <div style={{ textAlign: 'center', marginTop: '25px' }}>
                  <button 
                    style={{
                      ...styles.button, 
                      background: csvErrors.length === 0 ? 'linear-gradient(45deg, #4CAF50, #45a049)' : 'gray',
                      marginRight: '15px',
                      cursor: csvErrors.length === 0 ? 'pointer' : 'not-allowed'
                    }} 
                    onClick={handleCsvUpload}
                    disabled={loading || csvErrors.length > 0}
                  >
                    {loading ? 'Uploading...' : `📤 Upload ${csvPreview.length} Questions`}
                  </button>
                  <button 
                    style={{...styles.button, background: 'linear-gradient(45deg, #f44336, #da190b)'}} 
                    onClick={clearCsvUpload}
                    disabled={loading}
                  >
                    🗑️ Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Quiz Control Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '30px' }}>
          <button style={styles.button} onClick={handleGenerateLink} disabled={loading}>🔗 Get Quiz Code</button>
          <button style={{...styles.button, background: 'linear-gradient(45deg, #4CAF50, #45a049)'}} onClick={handleStartQuiz} disabled={loading}>
            {loading ? 'Starting...' : '▶️ Start Quiz'}
          </button>
          <button style={{...styles.button, background: 'linear-gradient(45deg, #f44336, #da190b)'}} onClick={handleEndQuiz} disabled={loading}>
            {loading ? 'Ending...' : '⏹️ End Quiz'}
          </button>
        </div>
        
        {/* Display Current Questions */}
        {currentSession && currentSession.questions && currentSession.questions.length > 0 && (
          <div>
            <h3>Questions Added ({currentSession.questions.length})</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {currentSession.questions.map((q, index) => (
                <div key={index} style={styles.questionCard}>
                  <strong>Q{index + 1}:</strong> {q.question}<br />
                  <div style={{ marginTop: '10px' }}>
                    A) {q.options.a}<br />
                    B) {q.options.b}<br />
                    C) {q.options.c}<br />
                    D) {q.options.d}<br />
                    <strong style={{ color: '#4CAF50' }}>Correct: {q.correct}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

    // Results Section - UPDATED WITH CSV EXPORT
    if (activeAdminSection === 'results') {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <LoadingError />
            <button style={{...styles.button, marginBottom: '20px'}} onClick={() => setActiveAdminSection(null)} disabled={loading}>
              ← Back to Dashboard
            </button>
            
            <div style={styles.resultsHeader}>
              <h2>Quiz Results</h2>
              {resultSessionCode && studentResults.length > 0 && (
                <button 
                  style={styles.csvButton} 
                  onClick={handleExportCSV}
                  disabled={loading}
                  title="Export results to CSV file"
                >
                  📊 Export CSV
                </button>
              )}
            </div>
            
            <input
              type="text"
              placeholder="Enter quiz code to view results"
              value={resultSessionCode}
              onChange={(e) => setResultSessionCode(e.target.value.toUpperCase())}
              style={styles.input}
              disabled={loading}
            />
            
            <div style={{ marginTop: '30px' }}>
              {resultSessionCode && (
                <div>
                  <div style={styles.resultsHeader}>
                    <h3>Results for: {resultSessionCode}</h3>
                    {studentResults.length > 0 && (
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        📈 Average Score: {Math.round(studentResults.reduce((sum, result) => sum + result.percentage, 0) / studentResults.length)}%
                      </div>
                    )}
                  </div>
                  {studentResults.length > 0 ? (
                    <div>
                      <p style={{ color: '#666', marginBottom: '20px' }}>
                        Total Submissions: {studentResults.length}
                      </p>
                      {studentResults.map((result, index) => (
                        <div key={index} style={{
                          background: '#f9f9f9',
                          padding: '20px',
                          margin: '15px 0',
                          borderRadius: '10px',
                          borderLeft: `4px solid ${result.percentage >= 70 ? '#4CAF50' : result.percentage >= 50 ? '#ff9800' : '#f44336'}`
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                            <div><strong>Name:</strong> {result.studentName}</div>
                            <div><strong>Reg No:</strong> {result.regNo}</div>
                            <div><strong>Department:</strong> {result.department}</div>
                            <div>
                              <strong>Score:</strong> {result.score}/{result.totalQuestions} ({result.percentage}%)
                              <span style={{ 
                                marginLeft: '10px', 
                                padding: '2px 8px', 
                                borderRadius: '12px', 
                                fontSize: '12px', 
                                fontWeight: 'bold',
                                background: result.percentage >= 90 ? '#4CAF50' : 
                                           result.percentage >= 80 ? '#8BC34A' :
                                           result.percentage >= 70 ? '#FFC107' :
                                           result.percentage >= 60 ? '#FF9800' :
                                           result.percentage >= 50 ? '#FF5722' : '#f44336',
                                color: 'white'
                              }}>
                                {getGradeFromPercentage(result.percentage)}
                              </span>
                            </div>
                            <div><strong>Submitted:</strong> {new Date(result.submittedAt).toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Summary Statistics */}
                      <div style={{
                        background: '#e3f2fd',
                        padding: '20px',
                        borderRadius: '10px',
                        marginTop: '20px',
                        borderLeft: '4px solid #2196F3'
                      }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#1976D2' }}>📊 Summary Statistics</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                          <div>
                            <strong>Total Students:</strong><br />
                            {studentResults.length}
                          </div>
                          <div>
                            <strong>Average Score:</strong><br />
                            {Math.round(studentResults.reduce((sum, result) => sum + result.percentage, 0) / studentResults.length)}%
                          </div>
                          <div>
                            <strong>Highest Score:</strong><br />
                            {Math.max(...studentResults.map(r => r.percentage))}%
                          </div>
                          <div>
                            <strong>Lowest Score:</strong><br />
                            {Math.min(...studentResults.map(r => r.percentage))}%
                          </div>
                          <div>
                            <strong>Pass Rate:</strong><br />
                            {Math.round((studentResults.filter(r => r.percentage >= 50).length / studentResults.length) * 100)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
                      {loading ? 'Loading results...' : 'No results found for this quiz code.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Sessions Management
    if (activeAdminSection === 'sessions') {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <LoadingError />
            <button style={{...styles.button, marginBottom: '20px'}} onClick={() => setActiveAdminSection(null)} disabled={loading}>
              ← Back to Dashboard
            </button>
            
            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Quiz Sessions</h2>
            
            {quizSessions.length > 0 ? (
              quizSessions.map((session, index) => (
                <div key={index} style={{
                  background: session.isActive ? '#e8f5e8' : '#f9f9f9',
                  padding: '20px',
                  margin: '15px 0',
                  borderRadius: '10px',
                  borderLeft: `4px solid ${session.isActive ? '#4CAF50' : '#ddd'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <h3>{session.name}</h3>
                      <p><strong>Code:</strong> {session.sessionId}</p>
                      <p><strong>Questions:</strong> {session.questions ? session.questions.length : 0}</p>
                      <p><strong>Status:</strong> {session.isActive ? '🟢 Active' : '🔴 Inactive'}</p>
                      <p><strong>Created:</strong> {new Date(session.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <button 
                        style={{...styles.button, margin: '5px'}} 
                        onClick={() => {
                          setCurrentSessionId(session.sessionId);
                          setActiveAdminSection('create');
                        }}
                        disabled={loading}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
                {loading ? 'Loading sessions...' : 'No quiz sessions found. Create your first quiz session!'}
              </p>
            )}
          </div>
        </div>
      );
    }
  }

  // Student Panel
  if (currentView === 'student') {
    // UPDATED: Warning Banner with different messages based on tab switch count
    const warningBanner = showWarning && (
      <div style={styles.warningBanner}>
        {tabSwitchCount === 1 
          ? "⚠️ WARNING: Do not switch tabs! Next time your quiz will be auto-submitted!"
          : "⚠️ QUIZ AUTO-SUBMITTED: You switched tabs multiple times!"
        }
      </div>
    );

    // Code Entry View
    if (studentView === 'codeEntry') {
      return (
        <div style={styles.container}>
          {warningBanner}
          <div style={styles.card}>
            <LoadingError />
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <button style={{...styles.button, marginBottom: '20px'}} onClick={() => setCurrentView('home')} disabled={loading}>
                ← Back to Home
              </button>
              <h1>Join Quiz</h1>
              <p style={{ color: '#666' }}>Enter the quiz code provided by your instructor</p>
            </div>
            
            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
              <input
                type="text"
                placeholder="Enter Quiz Code"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                style={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinQuiz()}
                disabled={loading}
              />
              <div style={{ textAlign: 'center' }}>
                <button style={styles.button} onClick={handleJoinQuiz} disabled={loading}>
                  {loading ? 'Joining...' : 'Join Quiz'}
                </button>
              </div>
              
              <div style={{ marginTop: '30px', padding: '20px', background: '#f0f8ff', borderRadius: '10px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Need Help?</h4>
                <p style={{ margin: '0', color: '#666' }}>
                  Enter the quiz code provided by your instructor to join the quiz session.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Student Information Form
    if (studentView === 'form') {
      return (
        <div style={styles.container}>
          {warningBanner}
          <div style={styles.card}>
            <LoadingError />
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <button style={{...styles.button, marginBottom: '20px'}} onClick={() => setStudentView('codeEntry')} disabled={loading}>
                ← Back
              </button>
              <h2>Student Information</h2>
              <p style={{ color: '#666' }}>Quiz: {currentQuiz?.name}</p>
              <p style={{ color: '#666' }}>Questions: {currentQuiz?.questions?.length || 0} | Time: 30 minutes</p>
            </div>
            
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              <input
                type="text"
                placeholder="Full Name *"
                value={studentInfo.name}
                onChange={(e) => setStudentInfo({...studentInfo, name: e.target.value})}
                style={styles.input}
                disabled={loading}
              />
              
              <input
                type="text"
                placeholder="Registration Number *"
                value={studentInfo.regNo}
                onChange={(e) => setStudentInfo({...studentInfo, regNo: e.target.value})}
                style={styles.input}
                disabled={loading}
              />
              
              <select
                value={studentInfo.department}
                onChange={(e) => setStudentInfo({...studentInfo, department: e.target.value})}
                style={styles.select}
                disabled={loading}
              >
                <option value="">Select Department *</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Electrical">Electrical</option>
                <option value="Civil">Civil</option>
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
                  <li>Do not refresh the page or switch tabs during the quiz</li>
                  <li>First tab switch will show a warning</li>
                  <li>Second tab switch will auto-submit your quiz</li>
                  <li>You have 30 minutes to complete the quiz</li>
                  <li>All fields are mandatory</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Quiz Taking View
    if (studentView === 'quiz') {
      const currentQ = currentQuiz.questions[currentQuestion];
      const progress = ((currentQuestion + 1) / currentQuiz.questions.length) * 100;
      
      return (
        <div style={styles.container}>
          {warningBanner}
          <div style={styles.card}>
            <LoadingError />
            {/* Timer */}
            <div style={styles.timer}>
              ⏰ Time Remaining: {formatTime(timeLeft)}
            </div>
            
            {/* Progress Bar */}
            <div style={styles.progressBar}>
              <div style={styles.progressFill(progress)}></div>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3>Question {currentQuestion + 1} of {currentQuiz.questions.length}</h3>
              {/* UPDATED: Show tab switch warning */}
              {tabSwitchCount > 0 && (
                <div style={{ 
                  background: tabSwitchCount === 1 ? '#fff3cd' : '#f8d7da',
                  color: tabSwitchCount === 1 ? '#856404' : '#721c24',
                  padding: '10px',
                  borderRadius: '5px',
                  margin: '10px 0',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {tabSwitchCount === 1 
                    ? "⚠️ Warning: 1 tab switch detected. Next switch will auto-submit!"
                    : "❌ Multiple tab switches detected. Quiz will be submitted automatically."
                  }
                </div>
              )}
            </div>
            
            {/* Question */}
            <div style={styles.questionCard}>
              <h3 style={{ marginBottom: '20px', color: '#333' }}>{currentQ.question}</h3>
              
              {/* Options */}
              <div>
                {Object.entries(currentQ.options).map(([key, value], index) => (
                  <div
                    key={key}
                    style={styles.option(userAnswers[currentQuestion] === key.toUpperCase())}
                    onClick={() => selectOption(index)}
                  >
                    <strong>{key.toUpperCase()})</strong> {value}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
              <button 
                style={{
                  ...styles.button,
                  opacity: currentQuestion === 0 ? 0.5 : 1,
                  cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer'
                }}
                onClick={previousQuestion}
                disabled={currentQuestion === 0 || loading}
              >
                ← Previous
              </button>
              
              <div style={{ textAlign: 'center' }}>
                <span style={{ color: '#666' }}>
                  Answered: {userAnswers.filter(a => a !== null).length}/{currentQuiz.questions.length}
                </span>
              </div>
              
              <button 
                style={styles.button}
                onClick={nextQuestion}
                disabled={loading}
              >
                {currentQuestion === currentQuiz.questions.length - 1 ? 
                  (loading ? 'Submitting...' : 'Submit Quiz') : 
                  'Next →'
                }
              </button>
            </div>
            
            {/* Question Navigation */}
            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <h4>Quick Navigation:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
                {currentQuiz.questions.map((_, index) => (
                  <button
                    key={index}
                    style={{
                      ...styles.button,
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      padding: '0',
                      fontSize: '14px',
                      background: userAnswers[index] !== null 
                        ? 'linear-gradient(45deg, #4CAF50, #45a049)' 
                        : index === currentQuestion 
                          ? 'linear-gradient(45deg, #ff9800, #f57c00)'
                          : 'linear-gradient(45deg, #ddd, #bbb)',
                      color: userAnswers[index] !== null || index === currentQuestion ? 'white' : '#666'
                    }}
                    onClick={() => setCurrentQuestion(index)}
                    disabled={loading}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
                🟢 Answered | 🟠 Current | ⚪ Not Answered
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Results View
    if (studentView === 'result') {
      const results = calculateStudentResults();
      
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <LoadingError />
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h1 style={{ color: '#4CAF50', marginBottom: '10px' }}>🎉 Quiz Completed!</h1>
              <h2>Results Summary</h2>
            </div>
            
            {/* Score Circle */}
            <div style={styles.scoreCircle(results.scorePercentage)}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{results.scorePercentage}%</div>
                <div style={{ fontSize: '16px', fontWeight: 'normal' }}>Grade: {results.grade}</div>
              </div>
            </div>
            
            {/* Detailed Results */}
            <div style={styles.resultCard}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', textAlign: 'left' }}>
                <div>
                  <strong>Student Name:</strong><br />
                  {studentInfo.name}
                </div>
                <div>
                  <strong>Registration No:</strong><br />
                  {studentInfo.regNo}
                </div>
                <div>
                  <strong>Department:</strong><br />
                  {studentInfo.department}
                </div>
                <div>
                  <strong>Quiz Name:</strong><br />
                  {currentQuiz.name}
                </div>
                <div>
                  <strong>Total Questions:</strong><br />
                  {currentQuiz.questions.length}
                </div>
                <div>
                  <strong>Correct Answers:</strong><br />
                  <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{results.correctAnswers}</span>
                </div>
                <div>
                  <strong>Wrong Answers:</strong><br />
                  <span style={{ color: '#f44336', fontWeight: 'bold' }}>{results.wrongAnswers}</span>
                </div>
                <div>
                  <strong>Final Score:</strong><br />
                  <span style={{ color: '#667eea', fontWeight: 'bold' }}>{results.scorePercentage}%</span>
                </div>
              </div>
            </div>
            
            {/* Answer Review */}
            <div style={{ marginTop: '30px' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Answer Review</h3>
              {currentQuiz.questions.map((question, index) => {
                const userAnswer = userAnswers[index];
                const correctAnswer = question.correct;
                const isCorrect = userAnswer === correctAnswer;
                
                return (
                  <div key={index} style={{
                    ...styles.questionCard,
                    borderLeft: `4px solid ${isCorrect ? '#4CAF50' : '#f44336'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                      <span style={{ 
                        fontSize: '20px', 
                        marginRight: '10px',
                        color: isCorrect ? '#4CAF50' : '#f44336'
                      }}>
                        {isCorrect ? '✅' : '❌'}
                      </span>
                      <strong>Q{index + 1}:</strong>
                    </div>
                    
                    <p style={{ marginBottom: '15px' }}>{question.question}</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <strong>Your Answer:</strong><br />
                        <span style={{ 
                          color: isCorrect ? '#4CAF50' : '#f44336',
                          fontWeight: 'bold'
                        }}>
                          {userAnswer ? `${userAnswer}) ${question.options[userAnswer.toLowerCase()]}` : 'Not Answered'}
                        </span>
                      </div>
                      <div>
                        <strong>Correct Answer:</strong><br />
                        <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                          {correctAnswer}) {question.options[correctAnswer.toLowerCase()]}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Action Buttons */}
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button style={styles.button} onClick={restartStudent} disabled={loading}>
                Take Another Quiz
              </button>
              <button 
                style={{...styles.button, marginLeft: '10px'}} 
                onClick={() => setCurrentView('home')}
                disabled={loading}
              >
                Go to Home
              </button>
            </div>
            
            {/* Performance Message */}
            <div style={{ 
              marginTop: '20px', 
              padding: '20px', 
              borderRadius: '10px',
              textAlign: 'center',
              background: results.scorePercentage >= 70 ? '#d4edda' : results.scorePercentage >= 50 ? '#fff3cd' : '#f8d7da',
              border: `1px solid ${results.scorePercentage >= 70 ? '#c3e6cb' : results.scorePercentage >= 50 ? '#ffeaa7' : '#f5c6cb'}`,
              color: results.scorePercentage >= 70 ? '#155724' : results.scorePercentage >= 50 ? '#856404' : '#721c24'
            }}>
              <strong>
                {results.scorePercentage >= 90 ? '🏆 Excellent! Outstanding performance!' :
                 results.scorePercentage >= 80 ? '🎉 Great job! You did very well!' :
                 results.scorePercentage >= 70 ? '👍 Good work! Keep it up!' :
                 results.scorePercentage >= 60 ? '👌 Fair performance. Room for improvement!' :
                 results.scorePercentage >= 50 ? '📚 You passed, but consider reviewing the material.' :
                 '📖 Keep studying and try again. You can do better!'}
              </strong>
            </div>
          </div>
        </div>
      );
    }
  }

  return null;
};

export default IntegratedQuizApp;
