import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Get User model (assuming it's already defined in api.js)
// We'll need to import it or pass it as parameter
let User;

export const initSuperAdminRoutes = (app, userModel, quizSessionModel) => {
  User = userModel;
  const QuizSession = quizSessionModel;

  // Middleware to verify Super Admin access
  const verifySuperAdmin = async (req, res, next) => {
    try {
      // Get user from request (you may need to adjust this based on your auth system)
      const { userEmail } = req.query;
      
      if (!userEmail) {
        return res.status(401).json({ message: 'User email is required' });
      }

      const user = await User.findOne({ email: userEmail.toLowerCase() });
      
      if (!user || user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Access denied. Super Admin privileges required.' });
      }
      
      req.user = user;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error verifying access', error: error.message });
    }
  };

  // 1. Get Logged-in Users
  router.get('/logged-in-users', verifySuperAdmin, async (req, res) => {
    try {
      const loggedInUsers = await User.find({ isLoggedIn: true })
        .select('name email role loginTime')
        .sort({ loginTime: -1 });

      const formattedUsers = loggedInUsers.map(user => {
        const loginTime = user.loginTime 
          ? new Date(user.loginTime).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })
          : 'N/A';

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
          loginTime: loginTime,
          status: 'Online'
        };
      });

      res.json(formattedUsers);
    } catch (error) {
      console.error('Get logged-in users error:', error);
      res.status(500).json({ message: 'Error fetching logged-in users', error: error.message });
    }
  });

  // 2. Get All Users
  router.get('/users', verifySuperAdmin, async (req, res) => {
    try {
      const users = await User.find()
        .select('name email role isLoggedIn loginTime createdAt')
        .sort({ createdAt: -1 });

      const totalUsers = users.length;
      const roleCounts = {
        student: users.filter(u => u.role === 'student').length,
        admin: users.filter(u => u.role === 'admin').length,
        superadmin: users.filter(u => u.role === 'superadmin').length
      };

      const formattedUsers = users.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isLoggedIn: user.isLoggedIn,
        loginTime: user.loginTime,
        createdAt: user.createdAt
      }));

      res.json({
        totalUsers,
        roleCounts,
        users: formattedUsers
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
  });

  // 3. Change User Role
  router.put('/users/:id/role', verifySuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ message: 'Role is required' });
      }

      if (!['student', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Can only change to student or admin.' });
      }

      const user = await User.findById(id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Prevent changing superadmin role
      if (user.role === 'superadmin') {
        return res.status(403).json({ message: 'Cannot change Super Admin role' });
      }

      user.role = role;
      await user.save();

      res.json({
        success: true,
        message: `User role updated to ${role}`,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Change user role error:', error);
      res.status(500).json({ message: 'Error changing user role', error: error.message });
    }
  });

  // 4. Force Logout User
  router.post('/logout/:id', verifySuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.isLoggedIn = false;
      user.loginTime = null;
      await user.save();

      res.json({
        success: true,
        message: `User ${user.name} has been logged out successfully`,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          isLoggedIn: user.isLoggedIn
        }
      });
    } catch (error) {
      console.error('Force logout error:', error);
      res.status(500).json({ message: 'Error logging out user', error: error.message });
    }
  });

  // 5. Get Admin Sessions (View which admin is working on which quiz session)
  router.get('/admin-sessions', verifySuperAdmin, async (req, res) => {
    try {
      // Get all admins (both logged in and logged out to show all sessions)
      const allAdmins = await User.find({ 
        role: 'admin'
      }).select('_id name email isLoggedIn');

      const adminIds = allAdmins.map(admin => admin._id);
      const adminEmails = allAdmins.map(admin => admin.email.toLowerCase());
      
      // Get all quiz sessions created by admins (by userId or email)
      const sessions = await QuizSession.find({
        $or: [
          { createdByUserId: { $in: adminIds } },
          { createdBy: { $in: adminEmails } }
        ]
      })
      .select('sessionId name isActive createdAt createdBy createdByUserId')
      .sort({ createdAt: -1 });

      // Format the response
      const formattedSessions = sessions.map(session => {
        // Try to find admin by userId first, then by email
        let admin = null;
        if (session.createdByUserId) {
          const userIdStr = session.createdByUserId.toString();
          admin = allAdmins.find(a => a._id.toString() === userIdStr);
        }
        
        if (!admin && session.createdBy) {
          admin = allAdmins.find(a => a.email.toLowerCase() === session.createdBy.toLowerCase());
        }
        
        return {
          _id: session._id,
          sessionId: session.sessionId,
          sessionName: session.name,
          adminName: admin ? admin.name : (session.createdBy || 'Unknown Admin'),
          adminEmail: admin ? admin.email : (session.createdBy || 'Unknown'),
          adminId: admin ? admin._id : (session.createdByUserId || null),
          adminIsLoggedIn: admin ? admin.isLoggedIn : false,
          status: session.isActive ? 'Active' : 'Inactive',
          createdAt: session.createdAt
        };
      });

      res.json(formattedSessions);
    } catch (error) {
      console.error('Get admin sessions error:', error);
      res.status(500).json({ message: 'Error fetching admin sessions', error: error.message });
    }
  });

  // 6. Force End Admin Session
  router.put('/sessions/:sessionId/end', verifySuperAdmin, async (req, res) => {
    try {
      const { sessionId } = req.params;

      const session = await QuizSession.findOne({ sessionId: sessionId.toUpperCase() });
      
      if (!session) {
        return res.status(404).json({ message: 'Quiz session not found' });
      }

      session.isActive = false;
      await session.save();

      res.json({
        success: true,
        message: `Session ${sessionId} has been ended successfully`,
        session: {
          sessionId: session.sessionId,
          name: session.name,
          isActive: session.isActive
        }
      });
    } catch (error) {
      console.error('Force end session error:', error);
      res.status(500).json({ message: 'Error ending session', error: error.message });
    }
  });

  // Mount routes
  app.use('/api/superadmin', router);
};

export default router;

