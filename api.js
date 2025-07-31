const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Configuration
const CONFIG = {
  MONGODB_URI: 'mongodb+srv://roshirose2405:N6t5Plu85Rnuffcf@cluster.tkmxtgf.mongodb.net/quiz_app?retryWrites=true&w=majority',
  FRONTEND_URL: 'http://localhost:3000',
  ADMIN_CODE: 'admin123',
  NODE_ENV: 'development'
};

// Middleware
app.use(cors({
  origin: CONFIG.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(CONFIG.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// MongoDB Schemas
const quizSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  questions: [{
    question: {
      type: String,
      required: true
    },
    options: {
      a: { type: String, required: true },
      b: { type: String, required: true },
      c: { type: String, required: true },
      d: { type: String, required: true }
    },
    correct: {
      type: String,
      required: true,
      enum: ['A', 'B', 'C', 'D']
    }
  }],
  isActive: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    required: true
  }
});

const studentResultSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  regNo: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  answers: [{
    type: String,
    enum: ['A', 'B', 'C', 'D', null]
  }],
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Models
const QuizSession = mongoose.model('QuizSession', quizSessionSchema);
const StudentResult = mongoose.model('StudentResult', studentResultSchema);

// Helper function to generate session ID
const generateSessionId = () => {
  return 'QUIZ' + Math.random().toString(36).substr(2, 6).toUpperCase();
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { adminCode } = req.body;
    
    if (!adminCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin code is required' 
      });
    }
    
    if (adminCode === CONFIG.ADMIN_CODE) {
      res.json({ 
        success: true, 
        message: 'Login successful' 
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid admin code' 
      });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// Get all quiz sessions
app.get('/api/quiz-sessions', async (req, res) => {
  try {
    const sessions = await QuizSession.find()
      .sort({ createdAt: -1 })
      .select('-__v');
    
    res.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ 
      message: 'Error fetching quiz sessions',
      error: error.message 
    });
  }
});

// Get specific quiz session - FIXED ROUTE
app.get('/api/quiz-sessions/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    if (!sessionId) {
      return res.status(400).json({ 
        message: 'Session ID is required' 
      });
    }
    
    const session = await QuizSession.findOne({ 
      sessionId: sessionId.toUpperCase() 
    }).select('-__v');
    
    if (!session) {
      return res.status(404).json({ 
        message: 'Quiz session not found' 
      });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ 
      message: 'Error fetching quiz session',
      error: error.message 
    });
  }
});

// Create new quiz session
app.post('/api/quiz-sessions', async (req, res) => {
  try {
    const { name, createdBy } = req.body;
    
    if (!name || !createdBy) {
      return res.status(400).json({ 
        message: 'Name and createdBy are required' 
      });
    }
    
    let sessionId;
    let isUnique = false;
    
    // Ensure unique session ID
    while (!isUnique) {
      sessionId = generateSessionId();
      const existing = await QuizSession.findOne({ sessionId });
      if (!existing) {
        isUnique = true;
      }
    }
    
    const newSession = new QuizSession({
      sessionId,
      name,
      createdBy,
      questions: [],
      isActive: false
    });
    
    const savedSession = await newSession.save();
    
    res.status(201).json({
      message: 'Quiz session created successfully',
      sessionId: savedSession.sessionId,
      session: savedSession
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ 
      message: 'Error creating quiz session',
      error: error.message 
    });
  }
});

// Add question to quiz session - FIXED ROUTE
app.post('/api/quiz-sessions/:sessionId/questions', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const { question, options, correct } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ 
        message: 'Session ID is required' 
      });
    }
    
    // Validation
    if (!question || !options || !correct) {
      return res.status(400).json({ 
        message: 'Question, options, and correct answer are required' 
      });
    }
    
    if (!options.a || !options.b || !options.c || !options.d) {
      return res.status(400).json({ 
        message: 'All four options (a, b, c, d) are required' 
      });
    }
    
    if (!['A', 'B', 'C', 'D'].includes(correct.toUpperCase())) {
      return res.status(400).json({ 
        message: 'Correct answer must be A, B, C, or D' 
      });
    }
    
    const session = await QuizSession.findOne({ 
      sessionId: sessionId.toUpperCase() 
    });
    
    if (!session) {
      return res.status(404).json({ 
        message: 'Quiz session not found' 
      });
    }
    
    const newQuestion = {
      question,
      options: {
        a: options.a,
        b: options.b,
        c: options.c,
        d: options.d
      },
      correct: correct.toUpperCase()
    };
    
    session.questions.push(newQuestion);
    await session.save();
    
    res.json({
      message: 'Question added successfully',
      questionCount: session.questions.length,
      session: session
    });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ 
      message: 'Error adding question',
      error: error.message 
    });
  }
});

// Start quiz session - FIXED ROUTE
app.put('/api/quiz-sessions/:sessionId/start', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    if (!sessionId) {
      return res.status(400).json({ 
        message: 'Session ID is required' 
      });
    }
    
    const session = await QuizSession.findOne({ 
      sessionId: sessionId.toUpperCase() 
    });
    
    if (!session) {
      return res.status(404).json({ 
        message: 'Quiz session not found' 
      });
    }
    
    if (session.questions.length === 0) {
      return res.status(400).json({ 
        message: 'Cannot start quiz with no questions' 
      });
    }
    
    session.isActive = true;
    await session.save();
    
    res.json({
      message: 'Quiz started successfully',
      session: session
    });
  } catch (error) {
    console.error('Start quiz error:', error);
    res.status(500).json({ 
      message: 'Error starting quiz',
      error: error.message 
    });
  }
});

// End quiz session - FIXED ROUTE
app.put('/api/quiz-sessions/:sessionId/end', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    if (!sessionId) {
      return res.status(400).json({ 
        message: 'Session ID is required' 
      });
    }
    
    const session = await QuizSession.findOne({ 
      sessionId: sessionId.toUpperCase() 
    });
    
    if (!session) {
      return res.status(404).json({ 
        message: 'Quiz session not found' 
      });
    }
    
    session.isActive = false;
    await session.save();
    
    res.json({
      message: 'Quiz ended successfully',
      session: session
    });
  } catch (error) {
    console.error('End quiz error:', error);
    res.status(500).json({ 
      message: 'Error ending quiz',
      error: error.message 
    });
  }
});

// Submit quiz results
app.post('/api/quiz-results', async (req, res) => {
  try {
    const { 
      sessionId, 
      studentName, 
      regNo, 
      department, 
      answers, 
      score, 
      totalQuestions, 
      percentage 
    } = req.body;
    
    // Validation
    if (!sessionId || !studentName || !regNo || !department || !answers) {
      return res.status(400).json({ 
        message: 'All fields are required' 
      });
    }
    
    // Check if session exists
    const session = await QuizSession.findOne({ 
      sessionId: sessionId.toUpperCase() 
    });
    
    if (!session) {
      return res.status(404).json({ 
        message: 'Quiz session not found' 
      });
    }
    
    // Check for duplicate submission
    const existingResult = await StudentResult.findOne({ 
      sessionId: sessionId.toUpperCase(), 
      regNo: regNo.toUpperCase() 
    });
    
    if (existingResult) {
      return res.status(409).json({ 
        message: 'Student has already submitted results for this quiz' 
      });
    }
    
    const newResult = new StudentResult({
      sessionId: sessionId.toUpperCase(),
      studentName,
      regNo: regNo.toUpperCase(),
      department,
      answers,
      score,
      totalQuestions,
      percentage
    });
    
    const savedResult = await newResult.save();
    
    res.status(201).json({
      message: 'Quiz results submitted successfully',
      result: savedResult
    });
  } catch (error) {
    console.error('Submit results error:', error);
    res.status(500).json({ 
      message: 'Error submitting quiz results',
      error: error.message 
    });
  }
});

// Get results for a specific session - FIXED ROUTE
app.get('/api/quiz-results/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    if (!sessionId) {
      return res.status(400).json({ 
        message: 'Session ID is required' 
      });
    }
    
    const results = await StudentResult.find({ 
      sessionId: sessionId.toUpperCase() 
    })
    .sort({ submittedAt: -1 })
    .select('-__v');
    
    res.json(results);
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ 
      message: 'Error fetching quiz results',
      error: error.message 
    });
  }
});

// Get all results (admin only)
app.get('/api/quiz-results', async (req, res) => {
  try {
    const results = await StudentResult.find()
      .sort({ submittedAt: -1 })
      .select('-__v');
    
    res.json(results);
  } catch (error) {
    console.error('Get all results error:', error);
    res.status(500).json({ 
      message: 'Error fetching all quiz results',
      error: error.message 
    });
  }
});

// Delete quiz session (admin only) - FIXED ROUTE
app.delete('/api/quiz-sessions/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    if (!sessionId) {
      return res.status(400).json({ 
        message: 'Session ID is required' 
      });
    }
    
    const session = await QuizSession.findOneAndDelete({ 
      sessionId: sessionId.toUpperCase() 
    });
    
    if (!session) {
      return res.status(404).json({ 
        message: 'Quiz session not found' 
      });
    }
    
    // Also delete related results
    await StudentResult.deleteMany({ 
      sessionId: sessionId.toUpperCase() 
    });
    
    res.json({
      message: 'Quiz session and related results deleted successfully'
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ 
      message: 'Error deleting quiz session',
      error: error.message 
    });
  }
});

// Get quiz statistics
app.get('/api/stats', async (req, res) => {
  try {
    const totalSessions = await QuizSession.countDocuments();
    const activeSessions = await QuizSession.countDocuments({ isActive: true });
    const totalSubmissions = await StudentResult.countDocuments();
    
    // Average score calculation
    const avgScore = await StudentResult.aggregate([
      {
        $group: {
          _id: null,
          averagePercentage: { $avg: '$percentage' }
        }
      }
    ]);
    
    res.json({
      totalSessions,
      activeSessions,
      totalSubmissions,
      averageScore: avgScore.length > 0 ? Math.round(avgScore[0].averagePercentage) : 0
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      message: 'Error fetching statistics',
      error: error.message 
    });
  }
});

// Add this route after your existing question routes - DON'T remove the existing /questions route
app.post('/api/quiz-sessions/:sessionId/questions/csv', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const { questions } = req.body; // Array of questions from CSV
    
    if (!sessionId) {
      return res.status(400).json({ 
        message: 'Session ID is required' 
      });
    }
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ 
        message: 'Questions array is required' 
      });
    }
    
    const session = await QuizSession.findOne({ 
      sessionId: sessionId.toUpperCase() 
    });
    
    if (!session) {
      return res.status(404).json({ 
        message: 'Quiz session not found' 
      });
    }
    
    // Validate all questions before adding any
    const validationErrors = [];
    questions.forEach((q, index) => {
      if (!q.question || !q.options || !q.correct) {
        validationErrors.push(`Row ${index + 2}: Missing required fields`);
      }
      if (!q.options.a || !q.options.b || !q.options.c || !q.options.d) {
        validationErrors.push(`Row ${index + 2}: All four options required`);
      }
      if (!['A', 'B', 'C', 'D'].includes(q.correct.toUpperCase())) {
        validationErrors.push(`Row ${index + 2}: Correct answer must be A, B, C, or D`);
      }
    });
    
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation errors found',
        errors: validationErrors
      });
    }
    
    // Add all questions to session
    const formattedQuestions = questions.map(q => ({
      question: q.question.trim(),
      options: {
        a: q.options.a.trim(),
        b: q.options.b.trim(),
        c: q.options.c.trim(),
        d: q.options.d.trim()
      },
      correct: q.correct.toUpperCase()
    }));
    
    session.questions.push(...formattedQuestions);
    await session.save();
    
    res.json({
      message: `Successfully added ${questions.length} questions`,
      totalQuestions: session.questions.length,
      session: session
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({ 
      message: 'Error uploading CSV questions',
      error: error.message 
    });
  }
});



// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: CONFIG.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Quiz API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${CONFIG.NODE_ENV}`);
  console.log(`📝 Admin Code: ${CONFIG.ADMIN_CODE}`);
  console.log(`🔗 Frontend URL: ${CONFIG.FRONTEND_URL}`);
  console.log(`💾 MongoDB URI: ${CONFIG.MONGODB_URI}`);
});

module.exports = app;
