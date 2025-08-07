const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3001;

// Configuration
const CONFIG = {
  MONGODB_URI: 'mongodb+srv://sanchana:25@cluster.thgduph.mongodb.net/?retryWrites=true&w=majority&appName=cluster',
  FRONTEND_URL: 'http://localhost:3000',
  ADMIN_CODE: 'admin123',
  NODE_ENV: 'development'
};
// Configure multer for audio uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/audio';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.params.sessionId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const audioUpload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check if file is audio
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});
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

   passages: [{
    id: String,
    title: String,
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  passages: [{
  id: String,
  title: String,
  content: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}],

// ADD THIS NEW AUDIO FIELD:
audioFiles: [{
  filename: String,
  originalName: String,
  path: String,
  size: Number,
  uploadedAt: {
    type: Date,
    default: Date.now
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
  isAutoSubmit: {
    type: Boolean,
    default: false
  },
  violationType: {
    type: String,
    enum: ['tab_switch_violation', 'time_expired', 'manual_submit', null],
    default: null
  },
  isResumed: {
    type: Boolean,
    default: false
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const quizViolationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    uppercase: true
  },
  studentName: {
    type: String,
    required: true
  },
  regNo: {
    type: String,
    required: true,
    uppercase: true
  },
  department: {
    type: String,
    required: true
  },
  violationType: {
    type: String,
    required: true,
    enum: ['tab_switch_violation', 'time_expired', 'suspicious_activity']
  },
  currentQuestion: {
    type: Number,
    required: true
  },
  userAnswers: [{
    type: String,
    enum: ['A', 'B', 'C', 'D', null]
  }],
  timeLeft: {
    type: Number,
    required: true
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  tabSwitchCount: {
    type: Number,
    default: 0
  },
  resumeToken: {
    type: String,
    default: null
  },
  restartToken: {
    type: String,
    default: null
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  adminAction: {
    type: String,
    enum: ['resume_approved', 'restart_approved', 'pending'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    required: true,
    enum: ['student', 'admin'],
    default: 'student'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  }
});

// Models
const QuizSession = mongoose.model('QuizSession', quizSessionSchema);
const StudentResult = mongoose.model('StudentResult', studentResultSchema);
const QuizViolation = mongoose.model('QuizViolation', quizViolationSchema);
const User = mongoose.model('User', userSchema);

// Helper function to generate session ID
const generateSessionId = () => {
  return 'QUIZ' + Math.random().toString(36).substr(2, 6).toUpperCase();
};

// Generate secure token for violations
const generateSecureToken = () => {
  return 'TOK_' + Math.random().toString(36).substr(2, 12).toUpperCase() + 
         '_' + Date.now().toString(36).toUpperCase();
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

// User registration
app.post('/api/user/register', async (req, res) => {
  try {
    const { name, email, password, role = 'student' } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Validate role based on email domain
    const domain = email.split('@')[1]?.toLowerCase();
    const adminDomains = [
      'admin.college.edu',
      'faculty.college.edu', 
      'instructor.college.edu',
      'staff.college.edu'
    ];
    
    let finalRole = role;
    if (adminDomains.includes(domain) && role !== 'admin') {
      // If admin domain but student role selected, default to admin
      finalRole = 'admin';
    } else if (!adminDomains.includes(domain) && role === 'admin') {
      // If non-admin domain but admin role selected, default to student
      finalRole = 'student';
    }
    
    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: finalRole
    });
    
    const savedUser = await newUser.save();
    
    // Remove password from response
    const userResponse = savedUser.toObject();
    delete userResponse.password;
    
    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully',
      user: userResponse
    });
    
  } catch (error) {
    console.error('User registration error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

// User login with database authentication
app.post('/api/user/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated. Please contact administrator.' 
      });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ 
      success: true, 
      user: userResponse,
      message: 'Login successful' 
    });
    
  } catch (error) {
    console.error('User login error:', error);
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

// Get specific quiz session
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

// Add question to quiz session
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

// Add CSV questions to quiz session
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

// Start quiz session
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

// End quiz session
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
      percentage,
      isAutoSubmit = false,
      violationType = null,
      isResumed = false,
      timeSpent = 0  
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
      percentage,
      isAutoSubmit,
      violationType,
      isResumed,
      timeSpent
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

// Get results for a specific session
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

// Delete quiz session (admin only)
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
// Upload audio file to a quiz session
app.post('/api/quiz-sessions/:sessionId/audio', audioUpload.single('audio'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No audio file provided' 
      });
    }
    
    // Find the quiz session
    const session = await QuizSession.findOne({ sessionId: sessionId.toUpperCase() });
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Quiz session not found' 
      });
    }
    
    // Create audio file object
    const audioFile = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      uploadedAt: new Date()
    };
    
    // Initialize audioFiles array if it doesn't exist
    if (!session.audioFiles) {
      session.audioFiles = [];
    }
    
    // Add audio file to session
    session.audioFiles.push(audioFile);
    
    // Save the session
    await session.save();
    
    res.json({ 
      success: true, 
      message: 'Audio file uploaded successfully',
      audioFile: audioFile
    });
    
  } catch (error) {
    console.error('Error uploading audio:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});



// Serve audio files
app.get('/api/audio/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'uploads', 'audio', filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Audio file not found' 
      });
    }
  } catch (error) {
    console.error('Error serving audio file:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Delete audio file from a quiz session
app.delete('/api/quiz-sessions/:sessionId/audio/:filename', async (req, res) => {
  try {
    const { sessionId, filename } = req.params;
    
    const session = await QuizSession.findOne({ sessionId: sessionId.toUpperCase() });
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Quiz session not found' 
      });
    }
    
    // Remove audio file from array and delete physical file
    if (session.audioFiles) {
      const audioFile = session.audioFiles.find(af => af.filename === filename);
      if (audioFile) {
        // Delete physical file
        const filePath = path.join(__dirname, 'uploads', 'audio', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        
        // Remove from database
        session.audioFiles = session.audioFiles.filter(af => af.filename !== filename);
        await session.save();
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Audio file deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting audio file:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
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

// Quiz Violation Routes

// Save violation when student violates rules
app.post('/api/quiz-violations', async (req, res) => {
  try {
    const {
      sessionId,
      studentName,
      regNo,
      department,
      violationType,
      currentQuestion,
      userAnswers,
      timeLeft,
      timeSpent,
      tabSwitchCount
    } = req.body;

    if (!sessionId || !studentName || !regNo || !department || !violationType) {
      return res.status(400).json({
        message: 'Required fields missing'
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

    const newViolation = new QuizViolation({
      sessionId: sessionId.toUpperCase(),
      studentName,
      regNo: regNo.toUpperCase(),
      department,
      violationType,
      currentQuestion,
      userAnswers,
      timeLeft,
      timeSpent: timeSpent || 0,
      tabSwitchCount: tabSwitchCount || 0
    });

    const savedViolation = await newViolation.save();

    res.status(201).json({
      message: 'Violation recorded successfully',
      violationId: savedViolation._id,
      violation: savedViolation
    });
  } catch (error) {
    console.error('Save violation error:', error);
    res.status(500).json({
      message: 'Error saving violation',
      error: error.message
    });
  }
});

// Get violations for a session
app.get('/api/quiz-violations/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;

    if (!sessionId) {
      return res.status(400).json({
        message: 'Session ID is required'
      });
    }

    const violations = await QuizViolation.find({
      sessionId: sessionId.toUpperCase()
    })
    .sort({ createdAt: -1 })
    .select('-__v');

    res.json(violations);
  } catch (error) {
    console.error('Get violations error:', error);
    res.status(500).json({
      message: 'Error fetching violations',
      error: error.message
    });
  }
});

// Generate resume token for violation
app.post('/api/quiz-violations/:violationId/resume', async (req, res) => {
  try {
    const violationId = req.params.violationId;

    const violation = await QuizViolation.findById(violationId);

    if (!violation) {
      return res.status(404).json({
        message: 'Violation not found'
      });
    }

    if (violation.isResolved) {
      return res.status(400).json({
        message: 'Violation already resolved'
      });
    }
    const resumeToken = generateSecureToken();
    violation.resumeToken = resumeToken;
    violation.adminAction = 'resume_approved';
    await violation.save();
    res.json({
      message: 'Resume token generated successfully',
      resumeToken: resumeToken,
      violation: violation
    });
  } catch (error) {
    console.error('Generate resume token error:', error);
    res.status(500).json({
      message: 'Error generating resume token',
      error: error.message
    });
  }
});
// POST /api/quiz-violations/:violationId/restart
app.post('/api/quiz-violations/:violationId/restart', async (req, res) => {
  try {
    const violationId = req.params.violationId;
    const violation = await QuizViolation.findById(violationId);
    if (!violation) {
      return res.status(404).json({
        message: 'Violation not found'
      });
    }
    if (violation.isResolved) {
      return res.status(400).json({
        message: 'Violation already resolved'
      });
    }
    const restartToken = generateSecureToken();
    violation.restartToken = restartToken;
    violation.adminAction = 'restart_approved';
    await violation.save();
    res.json({
      success: true,
      message: 'Restart token generated successfully',
      restartToken: restartToken,
      violation: violation
    });
  } catch (error) {
    console.error('Generate restart token error:', error);
    res.status(500).json({
      message: 'Error generating restart token',
      error: error.message
    });
  }
});
// POST /api/quiz-resume
app.post('/api/quiz-resume', async (req, res) => {
  try {
    const { resumeToken } = req.body;
    if (!resumeToken) {
      return res.status(400).json({
        message: 'Resume token is required'
      });
    }
    const violation = await QuizViolation.findOne({
      $or: [
        { resumeToken: resumeToken },
        { restartToken: resumeToken }
      ]
    });
    if (!violation) {
      return res.status(404).json({
        message: 'Invalid or expired token'
      });
    }
    if (violation.isResolved) {
      return res.status(400).json({
        message: 'Token already used'
      });
    }
    const session = await QuizSession.findOne({
      sessionId: violation.sessionId
    });
    if (!session || !session.isActive) {
      return res.status(400).json({
        message: 'Quiz session not active'
      });
    }
    violation.isResolved = true;
    violation.resolvedAt = new Date();
    await violation.save();
    if (violation.resumeToken === resumeToken) {
      res.json({
        success: true,
        actionType: 'resume',
        quizData: session,
        studentInfo: {
          name: violation.studentName,
          regNo: violation.regNo,
          department: violation.department
        },
        currentQuestion: violation.currentQuestion,
        userAnswers: violation.userAnswers,
        timeLeft: violation.timeLeft
      });
    } else if (violation.restartToken === resumeToken) {
      res.json({
        success: true,
        actionType: 'restart',
        quizData: session,
        studentInfo: {
          name: violation.studentName,
          regNo: violation.regNo,
          department: violation.department
        }
      });
    }
  } catch (error) {
    console.error('Resume quiz error:', error);
    res.status(500).json({
      message: 'Error resuming quiz',
      error: error.message
    });
  }
});
// POST /api/quiz-violations/check-pending
app.post('/api/quiz-violations/check-pending', async (req, res) => {
  try {
    const { studentName, regNo, sessionId } = req.body;

    if (!studentName || !regNo || !sessionId) {
      return res.status(400).json({
        message: 'Student name, registration number, and session ID are required'
      });
    }
    const pendingViolation = await QuizViolation.findOne({
      sessionId: sessionId.toUpperCase(),
      regNo: regNo.toUpperCase(),
      isResolved: false
    });
    if (pendingViolation) {
      res.json({
        hasPendingViolation: true,
        violationId: pendingViolation._id,
        violationType: pendingViolation.violationType,
        violation: pendingViolation
      });
    } else {
      res.json({
        hasPendingViolation: false
      });
    }
  } catch (error) {
    console.error('Check pending violation error:', error);
    res.status(500).json({
      message: 'Error checking pending violations',
      error: error.message
    });
  }
});

// Add passage to a quiz session
app.post('/api/quiz-sessions/:sessionId/passages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title, content } = req.body;
    
    // Validation
    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and content are required' 
      });
    }
    
    // Find the quiz session
    const session = await QuizSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Quiz session not found' 
      });
    }
    
    // Create passage object
    const passage = {
      id: Date.now().toString(), // Simple ID generation
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date()
    };
    
    // Initialize passages array if it doesn't exist
    if (!session.passages) {
      session.passages = [];
    }
    
    // Add passage to session
    session.passages.push(passage);
    
    // Save the session
    await session.save();
    
    res.json({ 
      success: true, 
      message: 'Passage added successfully',
      passage: passage
    });
    
  } catch (error) {
    console.error('Error adding passage:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get all passages for a quiz session
app.get('/api/quiz-sessions/:sessionId/passages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await QuizSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Quiz session not found' 
      });
    }
    
    res.json({ 
      success: true, 
      passages: session.passages || [] 
    });
    
  } catch (error) {
    console.error('Error fetching passages:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Delete a passage from a quiz session
app.delete('/api/quiz-sessions/:sessionId/passages/:passageId', async (req, res) => {
  try {
    const { sessionId, passageId } = req.params;
    
    const session = await QuizSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Quiz session not found' 
      });
    }
    
    // Remove passage from array
    if (session.passages) {
      session.passages = session.passages.filter(p => p.id !== passageId);
      await session.save();
    }
    
    res.json({ 
      success: true, 
      message: 'Passage deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting passage:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
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
         // ✅ Serve audio file for a quiz session
         app.get('/api/quiz-sessions/:sessionId/audio', async (req, res) => {
           try {
             const sessionId = req.params.sessionId.toUpperCase();
             console.log(`Audio request for session: ${sessionId}`);
             
             const session = await QuizSession.findOne({ sessionId });

             if (!session || !session.audioFiles || session.audioFiles.length === 0) {
               console.log(`No audio files found for session: ${sessionId}`);
               return res.status(404).json({ message: 'No audio file found for this session' });
             }

             const audioFile = session.audioFiles[0];
             const audioPath = path.resolve(audioFile.path);
             console.log(`Audio file path: ${audioPath}`);

             // Check if file exists
             if (!fs.existsSync(audioPath)) {
               console.error(`Audio file not found at path: ${audioPath}`);
               return res.status(404).json({ message: 'Audio file not found on server' });
             }

             // Get file stats for debugging
             const stats = fs.statSync(audioPath);
             console.log(`Audio file size: ${stats.size} bytes`);

             // Set appropriate headers
             res.setHeader('Content-Type', 'audio/mpeg');
             res.setHeader('Accept-Ranges', 'bytes');
             res.setHeader('Cache-Control', 'public, max-age=3600');
             res.setHeader('Content-Length', stats.size);
             res.setHeader('Access-Control-Allow-Origin', '*');
             res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
             res.setHeader('Access-Control-Allow-Headers', 'Range');

             console.log(`Sending audio file for session: ${sessionId}`);
             // Send the file
             res.sendFile(audioPath, (err) => {
               if (err) {
                 console.error('Error sending audio file:', err);
                 if (!res.headersSent) {
                   res.status(500).json({ message: 'Error serving audio file' });
                 }
               } else {
                 console.log(`Successfully sent audio file for session: ${sessionId}`);
               }
             });
           } catch (error) {
             console.error('Audio fetch error:', error);
             res.status(500).json({ message: 'Error retrieving audio file' });
           }
         });

         // ✅ Check if audio exists for a quiz session (HEAD request)
         app.head('/api/quiz-sessions/:sessionId/audio', async (req, res) => {
           try {
             const sessionId = req.params.sessionId.toUpperCase();
             console.log(`Audio HEAD request for session: ${sessionId}`);
             
             const session = await QuizSession.findOne({ sessionId });

             if (!session || !session.audioFiles || session.audioFiles.length === 0) {
               console.log(`No audio files found for session: ${sessionId} (HEAD request)`);
               return res.status(404).end();
             }

             const audioPath = path.resolve(session.audioFiles[0].path);
             console.log(`Audio file path for HEAD request: ${audioPath}`);
             
             if (!fs.existsSync(audioPath)) {
               console.log(`Audio file not found at path: ${audioPath} (HEAD request)`);
               return res.status(404).end();
             }

             console.log(`Audio file exists for session: ${sessionId} (HEAD request)`);
             res.status(200).end();
           } catch (error) {
             console.error('Audio HEAD request error:', error);
             res.status(500).end();
           }
         });

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl 
  });
});
app.get('/api/quiz-sessions/:sessionId/audio', async (req, res) => {
  const sessionId = req.params.sessionId.toUpperCase();

  try {
    const session = await QuizSession.findOne({ sessionId });

    if (!session || !session.audioFiles || session.audioFiles.length === 0) {
      return res.status(404).json({ message: 'Audio file not found' });
    }

    const audioPath = session.audioFiles[0].path;

    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ message: 'Audio file missing from server' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    fs.createReadStream(audioPath).pipe(res);
  } catch (error) {
    console.error('Error serving audio:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
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