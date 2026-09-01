import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getApiBaseUrl } from '../../config/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CodeEntry from './CodeEntry';
import StudentForm from './StudentForm';
import QuizView from './QuizView';
import ResultView from './ResultView';
import WaitingForAdmin from './WaitingForAdmin';
import { shuffleArray, apiCall, checkAndHandleViolation, openFullscreen, exitFullscreen } from './studentUtils';
import AppLayout from '../common/AppLayout';

const Student = () => {
  const LOCAL_STORAGE_KEY = 'quizInProgress';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentView, setStudentView] = useState('codeEntry');
  const [quizCode, setQuizCode] = useState('');
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [studentInfo, setStudentInfo] = useState({ name: '', regNo: '', department: '' ,section:''});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  // Per-question timer (seconds remaining for each question)
  const [questionTimeLefts, setQuestionTimeLefts] = useState([]);
  // Once a question's timer reaches 0, it becomes locked (cannot be opened/answered)
  const [lockedQuestions, setLockedQuestions] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warningMessage, setWarningMessage] = useState('');
  const [suspensionMessage, setSuspensionMessage] = useState('');
  const [violationId, setViolationId] = useState(null);
  const [isResuming, setIsResuming] = useState(false);
  const [originalTimeAllotted, setOriginalTimeAllotted] = useState(90 * 60);
  const [timeSpent, setTimeSpent] = useState(0);
  const [violationCount, setViolationCount] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef(null);
  const [selectedPassage, setSelectedPassage] = useState(null);
  const [showPassageModal, setShowPassageModal] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const submissionInProgressRef = useRef(false);
  const submissionCompletedRef = useRef(false);
  
  const API_BASE_URL = getApiBaseUrl();

  const handleCheckAndHandleViolation = async (studentName, regNo, sessionId) => {
    return await checkAndHandleViolation(
      studentName,
      regNo,
      sessionId,
      API_BASE_URL,
      setLoading,
      setError,
      setViolationId,
      setStudentView,
      setSuspensionMessage
    );
  };

  const handleApiCall = async (endpoint, method = 'GET', data = null) => {
    return await apiCall(endpoint, method, data, API_BASE_URL, setLoading, setError);
  };

  const handleJoinQuiz = async () => {
    try {
      const quiz = await handleApiCall(`/api/quiz-sessions/${quizCode.toUpperCase()}`);
      if (quiz) {
        if (quiz.isActive && quiz.questions.length > 0) {
           let finalQuestions =
    quiz.shuffledQuestions && quiz.shuffledQuestions.length > 0
      ? quiz.shuffledQuestions
      : null;

  // ✅ STEP 2: shuffle ONLY if first attempt
  if (!finalQuestions) {
    finalQuestions = shuffleArray(quiz.questions).map((q) => {
      const optionsArray = [
        { label: 'A', text: q.options.a },
        { label: 'B', text: q.options.b },
        { label: 'C', text: q.options.c },
        { label: 'D', text: q.options.d },
      ];

      const shuffledOptions = shuffleArray(optionsArray);
      const newOptions = {};
      let newCorrect = '';

      shuffledOptions.forEach((opt, idx) => {
        const label = ['a', 'b', 'c', 'd'][idx];
        newOptions[label] = opt.text;
        if (opt.label === q.correct) newCorrect = label.toUpperCase();
      });

      return { ...q, options: newOptions, correct: newCorrect };
    });
  }
          if (quiz.audioFiles && quiz.audioFiles.length > 0) {
            quiz.audioUrl = `${API_BASE_URL}${quiz.audioFiles[0].path}`;
          }

          // Don't calculate from questions anymore - use quiz.totalTimeSeconds
          submissionInProgressRef.current = false;
          submissionCompletedRef.current = false;
          setCurrentQuiz({ ...quiz, questions: finalQuestions, originalQuestions: quiz.questions });
          setStudentView('form');
          setUserAnswers(new Array(finalQuestions.length).fill(null));
          
          // Initialize timers based on timerType
          if (quiz.timerType === 'hybrid') {
            // Hybrid mode: auto-calculate totalTime = numQuestions × maxTimePerQuestion
            const calculatedTotal = finalQuestions.length * quiz.maxTimePerQuestion;
            setTimeLeft(calculatedTotal);
            setOriginalTimeAllotted(calculatedTotal);
            const qTimes = (finalQuestions || []).map(() => quiz.maxTimePerQuestion);
            setQuestionTimeLefts(qTimes);
          } else {
            // Total mode: use quiz.totalTimeSeconds that faculty set - NO per-question timing
            const totalTime = quiz.totalTimeSeconds || 3600; // Default 60 minutes
            setTimeLeft(totalTime);
            setOriginalTimeAllotted(totalTime);
            // For total mode, no per-question timing - only overall timer
            setQuestionTimeLefts(new Array(finalQuestions.length).fill(0));
          }
          setLockedQuestions(new Array(finalQuestions.length).fill(false));
        } else if (!quiz.isActive) {
          toast.info('This quiz is not currently active. Please contact your instructor.');
        } else {
          toast.info('This quiz has no questions yet. Please try again later.');
        }
      }
    } catch (error) {
      toast.error('Invalid quiz code or quiz not found. Please check and try again.');
    }
  };

  const startStudentQuiz = async () => {
    if (!studentInfo.name.trim() || !studentInfo.regNo.trim() || !studentInfo.department||!studentInfo.section) {
      toast.info('Please fill in all required fields!');
      return;
    }
    
    const hasViolation = await handleCheckAndHandleViolation(
      studentInfo.name, 
      studentInfo.regNo, 
      currentQuiz.sessionId
    );
    
    if (hasViolation) {
      return;
    }
    
    openFullscreen();
    setStudentView('quiz');
    setCurrentQuestion(0);
    
    // Initialize timers based on timerType
    if (currentQuiz.timerType === 'hybrid') {
      // Hybrid mode: auto-calculate totalTime = numQuestions × maxTimePerQuestion
      const calculatedTotal = (currentQuiz?.questions || []).length * currentQuiz.maxTimePerQuestion;
      setTimeLeft(calculatedTotal);
      setOriginalTimeAllotted(calculatedTotal);
      const qTimes = (currentQuiz?.questions || []).map(() => currentQuiz.maxTimePerQuestion);
      setQuestionTimeLefts(qTimes);
    } else {
      // Total mode: use totalTimeSeconds set by faculty
      const totalTime = currentQuiz.totalTimeSeconds || 3600;
      console.log('Total mode - totalTimeSeconds:', currentQuiz.totalTimeSeconds, 'calculated totalTime:', totalTime, 'in minutes:', totalTime / 60);
      setTimeLeft(totalTime);
      setOriginalTimeAllotted(totalTime);
      const qTimes = (currentQuiz?.questions || []).map(() => 0);
      setQuestionTimeLefts(qTimes);
    }
    setLockedQuestions(new Array(currentQuiz.questions.length).fill(false));
    setTabSwitchCount(0);
  };

  // Updated selectOption function to handle number display but store letters
  const selectOption = (optionIndex) => {
    if (lockedQuestions?.[currentQuestion]) return;
    const newAnswers = [...userAnswers];
    // Store as letters (A, B, C, D) for backend compatibility
    newAnswers[currentQuestion] = ['A', 'B', 'C', 'D'][optionIndex];
    setUserAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestion === currentQuiz.questions.length - 1) {
      // Count unanswered questions, but exclude locked ones
      const unansweredCount = userAnswers
        .map((ans, idx) => (ans === null && !lockedQuestions?.[idx]) ? idx : null)
        .filter((v) => v !== null).length;
      if (unansweredCount > 0 && timeLeft > 0) {
        setWarningMessage(`Please answer all questions before submitting. ${unansweredCount} question(s) remaining.`);
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 4000);
        return;
      }
      submitQuiz();
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion <= 0) return;
    const target = currentQuestion - 1;
    if (lockedQuestions?.[target]) return;
    setCurrentQuestion(target);
  };

  const navigateToQuestion = (idx) => {
    if (idx < 0) return;
    if (lockedQuestions?.[idx]) return;
    if (!currentQuiz?.questions || idx >= currentQuiz.questions.length) return;
    setCurrentQuestion(idx);
  };

  const suspendForViolation = useCallback(
    async (violationType) => {
      if (!currentQuiz || submissionInProgressRef.current) return;
      submissionInProgressRef.current = true;
      try {
        const violationData = {
          sessionId: currentQuiz.sessionId,
          studentName: studentInfo.name,
          regNo: studentInfo.regNo,
          department: studentInfo.department,
          section: studentInfo.section,
          currentQuestion,
          shuffledQuestions: currentQuiz.questions,
          userAnswers,
          timeLeft,
          violationType,
          tabSwitchCount,
          timeSpent: originalTimeAllotted - timeLeft,
        };
        const response = await handleApiCall('/api/quiz-violations', 'POST', violationData);
        setViolationId(response.violationId);
        setSuspensionMessage(`Your quiz has been suspended due to ${violationType.replace('_', ' ')}.\n\nPlease wait for admin approval to continue.`);
        setStudentView('waitingForAdmin');
      } catch (error) {
        toast.error('Failed to save violation: ' + error.message);
      } finally {
        submissionInProgressRef.current = false;
      }
    },
    [currentQuiz, studentInfo, currentQuestion, userAnswers, timeLeft, tabSwitchCount, originalTimeAllotted]
  );

  const submitQuiz = useCallback(
    async (isAutoSubmit = false, violationType = null, submitReason = null) => {
      if (!currentQuiz) return;
      if (submissionCompletedRef.current || submissionInProgressRef.current) return;
      submissionInProgressRef.current = true;
      try {
        if (!isAutoSubmit) {
          // Count unanswered questions, but exclude locked ones
          const unanswered = userAnswers
            .map((ans, idx) => (ans === null && !lockedQuestions?.[idx]) ? idx : null)
            .filter((v) => v !== null).length;
          if (unanswered > 0 && timeLeft > 0) {
            setWarningMessage(`You still have ${unanswered} unanswered question(s). Please answer all questions before submitting.`);
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 4000);
            return;
          }
        }
        if (isAutoSubmit && violationType && submitReason !== 'timeout') {
          await suspendForViolation(violationType);
        } else {
          // Map userAnswers back to original database order/layout
          const originalAnswers = (currentQuiz.originalQuestions || currentQuiz.questions).map((originalQuestion) => {
            const shuffledIndex = currentQuiz.questions.findIndex(q => q._id === originalQuestion._id);
            if (shuffledIndex === -1) return null;
            const studentShuffledAnswerLetter = userAnswers[shuffledIndex];
            if (!studentShuffledAnswerLetter) return null;
            const shuffledOptionsObj = currentQuiz.questions[shuffledIndex].options;
            const chosenOptionText = shuffledOptionsObj[studentShuffledAnswerLetter.toLowerCase()];
            const originalOptionKey = Object.keys(originalQuestion.options).find(
              key => originalQuestion.options[key] === chosenOptionText
            );
            return originalOptionKey ? originalOptionKey.toUpperCase() : null;
          });

          const resultData = {
            sessionId: currentQuiz.sessionId,
            studentName: studentInfo.name,
            regNo: studentInfo.regNo,
            department: studentInfo.department,
            section: studentInfo.section,
            answers: originalAnswers,
            isAutoSubmit,
            violationType: submitReason === 'timeout' ? 'time_expired' : (violationType || null),
            isResumed: isResuming,
            timeSpent: timeSpent,
          };
          await handleApiCall('/api/quiz-results', 'POST', resultData);
          submissionCompletedRef.current = true;
          exitFullscreen();
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          setStudentView('result');
        }
      } catch (error) {
        submissionInProgressRef.current = false;
        toast.error('Failed to submit quiz: ' + error.message);
      }
    },
    [userAnswers, currentQuiz, studentInfo, currentQuestion, timeLeft, tabSwitchCount, isResuming, originalTimeAllotted, timeSpent, lockedQuestions, suspendForViolation]
  );

  const restartStudent = () => {
    submissionInProgressRef.current = false;
    submissionCompletedRef.current = false;
    exitFullscreen();
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    const audio = document.querySelector('audio');
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsAudioPlaying(false);
    setStudentView('codeEntry');
    setQuizCode('');
    setCurrentQuiz(null);
    setStudentInfo({ name: '', regNo: '', department: '' ,section:''});
    setCurrentQuestion(0);
    setUserAnswers([]);
    setTimeLeft(3600);
    setTabSwitchCount(0);
  };

  /*const handleResumeQuiz = async () => {
    if (!violationId) {
      toast.info('Waiting for admin approval...');
      return;
    }
    try {
      const response = await handleApiCall(`/api/quiz-violations/${violationId}/continue`, 'POST');
      if (response.success) {
        try {
          const audioResponse = await fetch(`${API_BASE_URL}/api/quiz-sessions/${response.quizData.sessionId}/audio`, {
            method: 'HEAD',
            headers: { Accept: 'audio/*' },
          });
          response.quizData.hasAudio = audioResponse.ok && audioResponse.status === 200;
        } catch (e) {
          response.quizData.hasAudio = false;
        }
        if (response.actionType === 'resume') {
          if (response.quizData.audioFiles && response.quizData.audioFiles.length > 0) {
            const audioPath = response.quizData.audioFiles[0].path.startsWith('/')
              ? response.quizData.audioFiles[0].path
              : '/' + response.quizData.audioFiles[0].path;
            response.quizData.audioUrl = `${API_BASE_URL}${audioPath}`;
          }
          setCurrentQuiz(response.quizData);
          setStudentInfo(response.studentInfo);
          setCurrentQuestion(response.currentQuestion);
          setUserAnswers(response.userAnswers);
          setTimeLeft(response.timeLeft);
          setTabSwitchCount(0);
          setViolationCount(0);
          setIsResuming(true);
          setStudentView('quiz');
          toast.success('Quiz resumed successfully!');
        } else if (response.actionType === 'restart') {
          if (response.quizData.audioFiles && response.quizData.audioFiles.length > 0) {
            const audioPath = response.quizData.audioFiles[0].path.startsWith('/')
              ? response.quizData.audioFiles[0].path
              : '/' + response.quizData.audioFiles[0].path;
            response.quizData.audioUrl = `${API_BASE_URL}${audioPath}`;
          }
          setCurrentQuiz(response.quizData);
          setStudentInfo(response.studentInfo);
          setCurrentQuestion(0);
          setUserAnswers(new Array(response.quizData.questions.length).fill(null));
          setTimeLeft(response.quizData.timeLimit || 90 * 60);
          setOriginalTimeAllotted(response.quizData.timeLimit || 90 * 60);
          setTabSwitchCount(0);
          setViolationCount(0);
          setIsResuming(true);
          setStudentView('quiz');
          toast.success('Quiz restarted successfully!');
        }
      }
    } catch (error) {
      toast.error(error?.message || 'Approval not ready yet.');
    }
  };*/
  const handleResumeQuiz = async () => {
    if (!violationId) {
      toast.info('Waiting for admin approval...');
      return;
    }
    try {
      const response = await handleApiCall(`/api/quiz-violations/${violationId}/continue`, 'POST');
      if (response.success) {
        try {
          const audioResponse = await fetch(`${API_BASE_URL}/api/quiz-sessions/${response.quizData.sessionId}/audio`, {
            method: 'HEAD',
            headers: { Accept: 'audio/*' },
          });
          response.quizData.hasAudio = audioResponse.ok && audioResponse.status === 200;
        } catch (e) {
          response.quizData.hasAudio = false;
        }
        if (response.actionType === 'resume') {
          const original = response.originalQuestions || response.quizData.questions;
          //USE SHUFFLED QUESTIONS FROM BACKEND RESPONSE
          if (response.shuffledQuestions && response.shuffledQuestions.length > 0) {
            response.quizData.questions = response.shuffledQuestions;
          }
          if (response.quizData.audioFiles && response.quizData.audioFiles.length > 0) {
            const audioPath = response.quizData.audioFiles[0].path.startsWith('/')
              ? response.quizData.audioFiles[0].path
              : '/' + response.quizData.audioFiles[0].path;
            response.quizData.audioUrl = `${API_BASE_URL}${audioPath}`;
          }
          response.quizData.originalQuestions = original;
          setCurrentQuiz(response.quizData);
          setStudentInfo(response.studentInfo);
          setCurrentQuestion(response.currentQuestion);
          setUserAnswers(response.userAnswers);
          setTimeLeft(response.timeLeft);
          const totalTime = response.quizData.timerType === 'hybrid'
            ? (response.quizData.questions || []).length * (response.quizData.maxTimePerQuestion || 300)
            : (response.quizData.totalTimeSeconds || 3600);
          setOriginalTimeAllotted(totalTime);
          setTabSwitchCount(0);
          setIsResuming(true);
                submissionInProgressRef.current = false;
                submissionCompletedRef.current = false;
          openFullscreen();
          setStudentView('quiz');
          toast.success('Quiz resumed successfully!');
        } else if (response.actionType === 'restart') {
          if (response.quizData.audioFiles && response.quizData.audioFiles.length > 0) {
            const audioPath = response.quizData.audioFiles[0].path.startsWith('/')
              ? response.quizData.audioFiles[0].path
              : '/' + response.quizData.audioFiles[0].path;
            response.quizData.audioUrl = `${API_BASE_URL}${audioPath}`;
          }
          // Create brand new shuffle for restart
          const newShuffledQuestions = shuffleArray(response.quizData.questions).map((q) => {
            const optionsArray = [
              { label: 'A', text: q.options.a },
              { label: 'B', text: q.options.b },
              { label: 'C', text: q.options.c },
              { label: 'D', text: q.options.d },
            ];

            const shuffledOptions = shuffleArray(optionsArray);
            const newOptions = {};
            let newCorrect = '';

            shuffledOptions.forEach((opt, idx) => {
              const label = ['a', 'b', 'c', 'd'][idx];
              newOptions[label] = opt.text;
              if (opt.label === q.correct) newCorrect = label.toUpperCase();
            });

            return { ...q, options: newOptions, correct: newCorrect };
          });
        
          const original = response.originalQuestions || response.quizData.questions;
          response.quizData.questions = newShuffledQuestions;
          response.quizData.originalQuestions = original;

          setCurrentQuiz(response.quizData);
          setStudentInfo(response.studentInfo);
          setCurrentQuestion(0);
          setUserAnswers(new Array(response.quizData.questions.length).fill(null));
          const totalTime = response.quizData.timerType === 'hybrid'
            ? (response.quizData.questions || []).length * (response.quizData.maxTimePerQuestion || 300)
            : (response.quizData.totalTimeSeconds || 3600);
          setTimeLeft(totalTime);
          setOriginalTimeAllotted(totalTime);
          setTabSwitchCount(0);
          setIsResuming(true);
                submissionInProgressRef.current = false;
                submissionCompletedRef.current = false;
          openFullscreen();
          setStudentView('quiz');
          toast.success('Quiz restarted successfully!');
        }
      }
    } catch (error) {
      toast.error(error?.message || 'Approval not ready yet.');
    }
  };

  const tryAutoResume = useCallback(async () => {
    if (!violationId || studentView !== 'waitingForAdmin') return;
    try {
      const response = await handleApiCall(`/api/quiz-violations/${violationId}/continue`, 'POST');
      if (!response?.success) return;
      try {
        const audioResponse = await fetch(`${API_BASE_URL}/api/quiz-sessions/${response.quizData.sessionId}/audio`, {
          method: 'HEAD',
          headers: { Accept: 'audio/*' },
        });
        response.quizData.hasAudio = audioResponse.ok && audioResponse.status === 200;
      } catch {
        response.quizData.hasAudio = false;
      }
      if (response.actionType === 'resume') {
        //  USE SHUFFLED QUESTIONS FROM BACKEND
        const original = response.originalQuestions || response.quizData.questions;
        if (response.shuffledQuestions && response.shuffledQuestions.length > 0) {
          response.quizData.questions = response.shuffledQuestions;
        }
        if (response.quizData.audioFiles && response.quizData.audioFiles.length > 0) {
          const audioPath = response.quizData.audioFiles[0].path.startsWith('/')
            ? response.quizData.audioFiles[0].path
            : '/' + response.quizData.audioFiles[0].path;
          response.quizData.audioUrl = `${API_BASE_URL}${audioPath}`;
        }
        response.quizData.originalQuestions = original;
        setCurrentQuiz(response.quizData);
        setStudentInfo(response.studentInfo);
        setCurrentQuestion(response.currentQuestion);
        setUserAnswers(response.userAnswers);
        setTimeLeft(response.timeLeft);
        const totalTime = response.quizData.timerType === 'hybrid'
          ? (response.quizData.questions || []).length * (response.quizData.maxTimePerQuestion || 300)
          : (response.quizData.totalTimeSeconds || 3600);
        setOriginalTimeAllotted(totalTime);
        setTabSwitchCount(0);
        setViolationCount(0);
        setIsResuming(true);
        setStudentView('quiz');
      } else if (response.actionType === 'restart') {
        if (response.quizData.audioFiles && response.quizData.audioFiles.length > 0) {
          const audioPath = response.quizData.audioFiles[0].path.startsWith('/')
            ? response.quizData.audioFiles[0].path
            : '/' + response.quizData.audioFiles[0].path;
          response.quizData.audioUrl = `${API_BASE_URL}${audioPath}`;
        }
        const newShuffledQuestions = shuffleArray(response.quizData.questions).map((q) => {
          const optionsArray = [
            { label: 'A', text: q.options.a },
            { label: 'B', text: q.options.b },
            { label: 'C', text: q.options.c },
            { label: 'D', text: q.options.d },
          ];

          const shuffledOptions = shuffleArray(optionsArray);
          const newOptions = {};
          let newCorrect = '';

          shuffledOptions.forEach((opt, idx) => {
            const label = ['a', 'b', 'c', 'd'][idx];
            newOptions[label] = opt.text;
            if (opt.label === q.correct) newCorrect = label.toUpperCase();
          });

          return { ...q, options: newOptions, correct: newCorrect };
        });
      
        const original = response.originalQuestions || response.quizData.questions;
        response.quizData.questions = newShuffledQuestions;
        response.quizData.originalQuestions = original;
      
        setCurrentQuiz(response.quizData);
        setStudentInfo(response.studentInfo);
        setCurrentQuestion(0);
        setUserAnswers(new Array(response.quizData.questions.length).fill(null));
        const resumedTotalTime = response.quizData.timerType === 'hybrid'
          ? (response.quizData.questions || []).length * (response.quizData.maxTimePerQuestion || 300)
          : (response.quizData.totalTimeSeconds || 3600);
        setTimeLeft(resumedTotalTime);
        setOriginalTimeAllotted(resumedTotalTime);
        setTabSwitchCount(0);
        setViolationCount(0);
        setIsResuming(true);
        openFullscreen();
        setStudentView('quiz');
      }
    } catch {
      // Ignore until approved
    }
  }, [violationId, studentView, API_BASE_URL]);

  const checkPendingResume = async (studentName, regNo, sessionId) => {
    try {
      const response = await handleApiCall('/api/quiz-violations/check-pending', 'POST', { studentName, regNo, sessionId });
      if (response.hasPendingViolation) {
        setViolationId(response.violationId);
        setStudentView('waitingForAdmin');
        setSuspensionMessage(
          `Your quiz was suspended due to ${response.violationType.replace(
            '_',
            ' '
          )}.\n\nPlease wait for your instructor to approve your quiz continuation.`
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking pending resume:', error);
      return false;
    }
  };

  // All useEffect hooks remain the same...
  useEffect(() => {
    let timerInterval;
    if (studentView === 'quiz') {
      timerInterval = setInterval(() => {
        // Overall quiz timer
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // A natural timeout should finish the quiz as a regular submission
            // instead of being recorded as a violation.
            submitQuiz(true, null, 'timeout');
            return 0;
          }
          return prev - 1;
        });

        // Per-question timer (only counts while the question is open, only in hybrid mode)
        setQuestionTimeLefts((prevArr) => {
          // Skip per-question timing in total mode
          if (currentQuiz?.timerType === 'total') return prevArr;
          
          if (!prevArr || prevArr.length === 0) return prevArr;
          const nextArr = [...prevArr];
          const idx = currentQuestion;
          if (idx < 0 || idx >= nextArr.length) return prevArr;
          // Don't tick if already locked
          if (lockedQuestions?.[idx]) return prevArr;
          const cur = Number(nextArr[idx]) || 0;
          if (cur <= 1) {
            nextArr[idx] = 0;
            // Lock the question and move ahead
            setLockedQuestions((prevLocked) => {
              const nextLocked = Array.isArray(prevLocked) ? [...prevLocked] : new Array(nextArr.length).fill(false);
              nextLocked[idx] = true;
              return nextLocked;
            });
            // Auto-advance to next available question (if any)
            setCurrentQuestion((prevQ) => {
              if (!currentQuiz?.questions) return prevQ;
              let nextIndex = prevQ + 1;
              while (nextIndex < currentQuiz.questions.length && (lockedQuestions?.[nextIndex])) {
                nextIndex += 1;
              }
              if (nextIndex >= currentQuiz.questions.length) return prevQ;
              return nextIndex;
            });
            return nextArr;
          }
          nextArr[idx] = cur - 1;
          return nextArr;
        });
      }, 1000);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [studentView, currentQuestion, lockedQuestions, currentQuiz, submitQuiz]);
  
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setLoggedInUser(parsedUser);
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
      }
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        
        if (data.studentInfo && data.quizData) {
          handleCheckAndHandleViolation(
            data.studentInfo.name,
            data.studentInfo.regNo,
            data.quizData.sessionId
          ).then((hasViolation) => {
            if (!hasViolation) {
              setCurrentQuiz(data.quizData);
              setStudentInfo(data.studentInfo);
              setUserAnswers(data.userAnswers);
              setTimeLeft(data.timeLeft);
              setCurrentQuestion(data.currentQuestion);
              setOriginalTimeAllotted(
                data.originalTimeAllotted ||
                  (data.quizData?.questions || []).reduce(
                    (sum, q) => sum + (Number(q?.timeSeconds) || 60),
                    0
                  ) ||
                  60
              );
              setIsResuming(data.isResuming || false);
              setStudentView('quiz');
              toast.success('Resumed quiz from last saved state!');
            } else {
              localStorage.removeItem(LOCAL_STORAGE_KEY);
            }
          });
        }
      } catch (e) {
        console.error('Failed to restore from local storage:', e);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (studentView !== 'quiz') return;
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'x')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [studentView]);

  useEffect(() => {
    if (studentView === 'form' && 
        studentInfo.name.trim() && 
        studentInfo.regNo.trim() && 
        studentInfo.department && 
        studentInfo.section && 
        currentQuiz) {
      
      const timeoutId = setTimeout(() => {
        handleCheckAndHandleViolation(
          studentInfo.name,
          studentInfo.regNo,
          currentQuiz.sessionId
        );
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [studentInfo.name, studentInfo.regNo, studentInfo.department,studentInfo.section, currentQuiz, studentView]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (studentView === 'quiz') {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    const handleVisibilityChange = () => {
      if (document.hidden && studentView === 'quiz') {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          if (isResuming || newCount >= 2) {
            setWarningMessage('🚫 QUIZ SUSPENDED: You switched tabs!');
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 4000);
            suspendForViolation('tab_switch_violation');
            return newCount;
          }
          if (newCount === 1) {
            setWarningMessage('⚠️ WARNING: Do not switch tabs! Next time your quiz will be suspended!');
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 4000);
          }
          return newCount;
        });
      }
    };
    const handleKeyDown = (e) => {
      if (
        studentView === 'quiz' &&
        (e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.key === 'u') ||
          (e.ctrlKey && e.key === 'r') ||
          e.key === 'F5')
      ) {
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
  }, [studentView, submitQuiz, suspendForViolation, isResuming]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const widthRatio = width / screenWidth;
      const heightRatio = height / screenHeight;
      if ((widthRatio < 0.8 || heightRatio < 0.8) && studentView === 'quiz') {
        if (!isResuming && violationCount === 0) {
          setViolationCount(1);
          setWarningMessage('⚠️ SPLIT SCREEN DETECTED: Please maximize your screen. Split screen is not allowed during the quiz.');
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 4000);
        } else {
          setWarningMessage('🚫 QUIZ SUSPENDED: Split screen detected.');
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 4000);
          suspendForViolation('split_screen_violation');
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [studentView, submitQuiz, violationCount, suspendForViolation, isResuming]);

  useEffect(() => {
    if (studentView === 'waitingForAdmin' && violationId) {
      const id = setInterval(() => {
        tryAutoResume();
      }, 3000);
      return () => clearInterval(id);
    }
  }, [studentView, violationId, tryAutoResume]);
  
  useEffect(() => {
    if (studentView === 'quiz' && currentQuiz) {
      const data = {
        quizData: currentQuiz,
        studentInfo,
        userAnswers,
        timeLeft,
        currentQuestion,
        originalTimeAllotted,
        isResuming
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }
  }, [studentView, currentQuiz, studentInfo, userAnswers, timeLeft, currentQuestion, originalTimeAllotted, isResuming]);

  // Render views based on studentView state
  if (studentView === 'codeEntry') {
    return (
      <AppLayout title="Student Portal">
        <CodeEntry
          loading={loading}
          error={error}
          quizCode={quizCode}
          setQuizCode={setQuizCode}
          handleJoinQuiz={handleJoinQuiz}
          loggedInUser={loggedInUser}
        />
      </AppLayout>
    );
  }

  if (studentView === 'form') {
    return (
      <AppLayout title="Student Portal" showBack>
        <StudentForm
          loading={loading}
          error={error}
          currentQuiz={currentQuiz}
          studentInfo={studentInfo}
          setStudentInfo={setStudentInfo}
          startStudentQuiz={startStudentQuiz}
          setStudentView={setStudentView}
          loggedInUser={loggedInUser}
        />
      </AppLayout>
    );
  }

  if (studentView === 'quiz') {
    return (
      <AppLayout title={currentQuiz?.name || 'Quiz'}>
        <QuizView
          currentQuiz={currentQuiz}
          currentQuestion={currentQuestion}
          userAnswers={userAnswers}
          timeLeft={timeLeft}
          questionTimeLeft={questionTimeLefts?.[currentQuestion] ?? (Number(currentQuiz?.questions?.[currentQuestion]?.timeSeconds) || 60)}
          lockedQuestions={lockedQuestions}
          selectOption={selectOption}
          nextQuestion={nextQuestion}
          previousQuestion={previousQuestion}
          showWarning={showWarning}
          warningMessage={warningMessage}
          loggedInUser={loggedInUser}
          API_BASE_URL={API_BASE_URL}
          selectedPassage={selectedPassage}
          setSelectedPassage={setSelectedPassage}
          showPassageModal={showPassageModal}
          setShowPassageModal={setShowPassageModal}
          audioRef={audioRef}
          isAudioPlaying={isAudioPlaying}
          setIsAudioPlaying={setIsAudioPlaying}
          setCurrentQuestion={navigateToQuestion}
        />
      </AppLayout>
    );
  }

  if (studentView === 'result') {
    return (
      <AppLayout title="Quiz Result" showBack>
        <ResultView
          currentQuiz={currentQuiz}
          userAnswers={userAnswers}
          studentInfo={studentInfo}
          loggedInUser={loggedInUser}
        />
      </AppLayout>
    );
  }

  if (studentView === 'waitingForAdmin') {
    return (
      <AppLayout title="Waiting for Admin" showBack>
        <WaitingForAdmin
          loading={loading}
          suspensionMessage={suspensionMessage}
          handleResumeQuiz={handleResumeQuiz}
          loggedInUser={loggedInUser}
        />
      </AppLayout>
    );
  }

  return null;
};

export default Student;
