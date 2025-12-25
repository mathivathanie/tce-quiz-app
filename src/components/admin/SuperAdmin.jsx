import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminStyles } from './adminStyles';
import LoadingError from '../common/LoadingError';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SuperAdmin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loggedInUsers, setLoggedInUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [roleCounts, setRoleCounts] = useState({ student: 0, admin: 0, superadmin: 0 });
  const [adminSessions, setAdminSessions] = useState([]);
  const [searchLoggedIn, setSearchLoggedIn] = useState('');
  const [searchAllUsers, setSearchAllUsers] = useState('');
  const [searchAdminSessions, setSearchAdminSessions] = useState('');
  const [activeSection, setActiveSection] = useState('logged-in'); // 'logged-in', 'all-users', 'admin-sessions'

  const API_BASE_URL = 'http://localhost:3001';
  const s = adminStyles;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'superadmin') {
          navigate('/login', { replace: true });
          return;
        }
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        navigate('/login', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Load data when user is set
  useEffect(() => {
    if (user && user.role === 'superadmin' && user.email) {
      loadData();
      // Auto-refresh every 10 seconds
      const interval = setInterval(() => {
        if (user && user.email) {
          loadData();
        }
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const apiCall = async (endpoint, method = 'GET', data = null) => {
    // Get current user from state or localStorage
    const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!currentUser || !currentUser.email) {
      throw new Error('User not authenticated. Please login again.');
    }

    setLoading(true);
    setError('');
    try {
      const config = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (data) config.body = JSON.stringify(data);
      
      const url = `${API_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}userEmail=${encodeURIComponent(currentUser.email)}`;
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
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

  const loadData = async () => {
    // Check if user exists before loading data
    const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');
    if (!currentUser || !currentUser.email || currentUser.role !== 'superadmin') {
      console.warn('Cannot load data: User not authenticated or not superadmin');
      return;
    }

    try {
      const [loggedInData, allUsersData, adminSessionsData] = await Promise.all([
        apiCall('/api/superadmin/logged-in-users'),
        apiCall('/api/superadmin/users'),
        apiCall('/api/superadmin/admin-sessions')
      ]);
      
      setLoggedInUsers(loggedInData);
      setAllUsers(allUsersData.users);
      setTotalUsers(allUsersData.totalUsers);
      setRoleCounts(allUsersData.roleCounts);
      setAdminSessions(adminSessionsData);
    } catch (error) {
      toast.error('Failed to load data: ' + error.message);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await apiCall(`/api/superadmin/users/${userId}/role`, 'PUT', { role: newRole });
      toast.success('User role updated successfully!');
      await loadData();
    } catch (error) {
      toast.error('Failed to change role: ' + error.message);
    }
  };

  const handleForceLogout = async (userId) => {
    try {
      await apiCall(`/api/superadmin/logout/${userId}`, 'POST');
      toast.success('User logged out successfully!');
      await loadData();
    } catch (error) {
      toast.error('Failed to logout user: ' + error.message);
    }
  };

  const handleEndSession = async (sessionId) => {
    try {
      await apiCall(`/api/superadmin/sessions/${sessionId}/end`, 'PUT');
      toast.success('Session ended successfully!');
      await loadData();
    } catch (error) {
      toast.error('Failed to end session: ' + error.message);
    }
  };

  // Filter functions
  const filteredLoggedInUsers = loggedInUsers.filter(user => 
    user.name.toLowerCase().includes(searchLoggedIn.toLowerCase()) ||
    user.email.toLowerCase().includes(searchLoggedIn.toLowerCase()) ||
    user.role.toLowerCase().includes(searchLoggedIn.toLowerCase())
  );

  const filteredAllUsers = allUsers.filter(user => 
    user.name.toLowerCase().includes(searchAllUsers.toLowerCase()) ||
    user.email.toLowerCase().includes(searchAllUsers.toLowerCase()) ||
    user.role.toLowerCase().includes(searchAllUsers.toLowerCase())
  );

  const filteredAdminSessions = adminSessions.filter(session =>
    session.sessionName.toLowerCase().includes(searchAdminSessions.toLowerCase()) ||
    session.adminName.toLowerCase().includes(searchAdminSessions.toLowerCase()) ||
    session.sessionId.toLowerCase().includes(searchAdminSessions.toLowerCase()) ||
    session.status.toLowerCase().includes(searchAdminSessions.toLowerCase())
  );

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (!user || user.role !== 'superadmin') {
    return null;
  }

  return (
    <div style={s.pageContainer}>
      <div style={s.contentContainer}>
        <ToastContainer />
        <LoadingError loading={loading} error={error} />
        
        <button 
          style={s.backButton}
          onClick={() => {
            localStorage.removeItem('user');
            navigate('/login', { replace: true });
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateX(-5px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          ← Logout
        </button>

        <div style={s.header}>
          <h1 style={s.headerTitle}>
            <span style={s.headerIcon}>👑</span>
            Super Admin Dashboard
          </h1>
          <p style={s.headerSubtitle}>Manage users and monitor system activity</p>
          <button
            style={{
              ...s.button,
              ...s.buttonInfo,
              marginTop: '20px'
            }}
            onClick={loadData}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, s.buttonHover);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = s.buttonInfo.boxShadow;
            }}
          >
            🔄 Refresh Data
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '25px', 
          marginBottom: '40px' 
        }}>
          <div style={{
            ...s.card,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>👥</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>
                {totalUsers}
              </div>
              <div style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.9)' }}>Total Users</div>
            </div>
          </div>

          <div style={{
            ...s.card,
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🟢</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>
                {loggedInUsers.length}
              </div>
              <div style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.9)' }}>Online Users</div>
            </div>
          </div>
        </div>

        {/* Role Distribution */}
        <div style={s.card}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: 'white', 
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            📊 User Role Distribution
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '20px' 
          }}>
            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎓</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>{roleCounts.student}</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Students</div>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>👨‍💼</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>{roleCounts.admin}</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Admins</div>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>👑</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>{roleCounts.superadmin}</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Super Admins</div>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '25px', 
          marginBottom: '40px' 
        }}>
          <div
            onClick={() => setActiveSection('logged-in')}
            style={{
              ...s.card,
              background: activeSection === 'logged-in' 
                ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                : 'rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: activeSection === 'logged-in' 
                ? '2px solid rgba(79, 172, 254, 0.6)'
                : '2px solid rgba(255, 255, 255, 0.2)',
              transform: activeSection === 'logged-in' ? 'translateY(-5px)' : 'none',
              boxShadow: activeSection === 'logged-in' 
                ? '0 8px 32px rgba(79, 172, 254, 0.4)'
                : '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (activeSection !== 'logged-in') {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSection !== 'logged-in') {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
              }
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🟢</div>
              <h3 style={{ 
                fontSize: '22px', 
                fontWeight: 'bold', 
                color: 'white', 
                marginBottom: '10px' 
              }}>
                Logged-in Users
              </h3>
              <div style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.9)' }}>
                {loggedInUsers.length} Online
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveSection('all-users')}
            style={{
              ...s.card,
              background: activeSection === 'all-users' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: activeSection === 'all-users' 
                ? '2px solid rgba(102, 126, 234, 0.6)'
                : '2px solid rgba(255, 255, 255, 0.2)',
              transform: activeSection === 'all-users' ? 'translateY(-5px)' : 'none',
              boxShadow: activeSection === 'all-users' 
                ? '0 8px 32px rgba(102, 126, 234, 0.4)'
                : '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (activeSection !== 'all-users') {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSection !== 'all-users') {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
              }
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>👥</div>
              <h3 style={{ 
                fontSize: '22px', 
                fontWeight: 'bold', 
                color: 'white', 
                marginBottom: '10px' 
              }}>
                All Registered Users
              </h3>
              <div style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.9)' }}>
                {totalUsers} Total
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveSection('admin-sessions')}
            style={{
              ...s.card,
              background: activeSection === 'admin-sessions' 
                ? 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
                : 'rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: activeSection === 'admin-sessions' 
                ? '2px solid rgba(250, 112, 154, 0.6)'
                : '2px solid rgba(255, 255, 255, 0.2)',
              transform: activeSection === 'admin-sessions' ? 'translateY(-5px)' : 'none',
              boxShadow: activeSection === 'admin-sessions' 
                ? '0 8px 32px rgba(250, 112, 154, 0.4)'
                : '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (activeSection !== 'admin-sessions') {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSection !== 'admin-sessions') {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
              }
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
              <h3 style={{ 
                fontSize: '22px', 
                fontWeight: 'bold', 
                color: 'white', 
                marginBottom: '10px' 
              }}>
                Admin Sessions
              </h3>
              <div style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.9)' }}>
                {adminSessions.length} Sessions
              </div>
            </div>
          </div>
        </div>

        {/* Logged-in Users Table */}
        {activeSection === 'logged-in' && (
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: 'white',
              margin: 0
            }}>
              🟢 Logged-in Users
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="text"
                placeholder="🔍 Search by name, email, or role..."
                value={searchLoggedIn}
                onChange={(e) => setSearchLoggedIn(e.target.value)}
                style={{
                  ...s.input,
                  padding: '10px 15px',
                  fontSize: '14px',
                  minWidth: '250px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  margin: 0
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = '2px solid rgba(187, 134, 252, 0.6)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = '2px solid rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              />
            </div>
          </div>
          
          {filteredLoggedInUsers.length === 0 ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>😴</div>
              <h4 style={s.emptyTitle}>No users currently logged in</h4>
              <p style={s.emptyText}>All users are offline</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                color: 'white'
              }}>
                <thead>
                  <tr style={{ background: 'rgba(102, 126, 234, 0.3)' }}>
                    <th style={{ ...s.tableHeaderCell, padding: '15px', textAlign: 'left' }}>Name</th>
                    <th style={{ ...s.tableHeaderCell, padding: '15px', textAlign: 'left' }}>Email</th>
                    <th style={{ ...s.tableHeaderCell, padding: '15px', textAlign: 'left' }}>Role</th>
                    <th style={{ ...s.tableHeaderCell, padding: '15px', textAlign: 'left' }}>Login Time</th>
                    <th style={{ ...s.tableHeaderCell, padding: '15px', textAlign: 'left' }}>Status</th>
                    <th style={{ ...s.tableHeaderCell, padding: '15px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoggedInUsers.map((user) => (
                    <tr 
                      key={user._id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '';
                      }}
                    >
                      <td style={{ padding: '15px', color: 'white' }}>{user.name}</td>
                      <td style={{ padding: '15px', color: 'rgba(255, 255, 255, 0.9)' }}>{user.email}</td>
                      <td style={{ padding: '15px', color: 'rgba(255, 255, 255, 0.9)' }}>{user.role}</td>
                      <td style={{ padding: '15px', color: 'rgba(255, 255, 255, 0.9)' }}>{user.loginTime}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          color: 'white',
                          boxShadow: '0 2px 8px rgba(79, 172, 254, 0.4)'
                        }}>
                          🟢 {user.status}
                        </span>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <button
                          style={{
                            ...s.button,
                            ...s.buttonDanger,
                            padding: '8px 16px',
                            fontSize: '14px'
                          }}
                          onClick={() => handleForceLogout(user._id)}
                          onMouseEnter={(e) => {
                            Object.assign(e.currentTarget.style, s.buttonHover);
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = '';
                            e.currentTarget.style.boxShadow = s.buttonDanger.boxShadow;
                          }}
                        >
                          🚪 Logout
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}

        {/* All Users Table */}
        {activeSection === 'all-users' && (
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: 'white',
              margin: 0
            }}>
              📋 All Registered Users
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="text"
                placeholder="🔍 Search by name, email, or role..."
                value={searchAllUsers}
                onChange={(e) => setSearchAllUsers(e.target.value)}
                style={{
                  ...s.input,
                  padding: '10px 15px',
                  fontSize: '14px',
                  minWidth: '250px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  margin: 0
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = '2px solid rgba(187, 134, 252, 0.6)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = '2px solid rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              />
            </div>
          </div>
          
          {filteredAllUsers.length === 0 ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>📭</div>
              <h4 style={s.emptyTitle}>No users found</h4>
              <p style={s.emptyText}>No users have been registered yet</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                color: 'white'
              }}>
                <thead>
                  <tr style={{ background: 'rgba(102, 126, 234, 0.3)' }}>
                    <th style={{ ...s.tableHeaderCell, padding: '15px', textAlign: 'left' }}>Name</th>
                    <th style={{ ...s.tableHeaderCell, padding: '15px', textAlign: 'left' }}>Email</th>
                    <th style={{ ...s.tableHeaderCell, padding: '15px', textAlign: 'left' }}>Role</th>
                    <th style={{ ...s.tableHeaderCell, padding: '15px', textAlign: 'left' }}>Status</th>
                    <th style={{ ...s.tableHeaderCell, padding: '15px', textAlign: 'center' }}>Change Role</th>
                    <th style={{ ...s.tableHeaderCell, padding: '15px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllUsers.map((userItem) => (
                    <tr 
                      key={userItem._id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '';
                      }}
                    >
                      <td style={{ padding: '15px', color: 'white' }}>{userItem.name}</td>
                      <td style={{ padding: '15px', color: 'rgba(255, 255, 255, 0.9)' }}>{userItem.email}</td>
                      <td style={{ padding: '15px', color: 'rgba(255, 255, 255, 0.9)' }}>
                        {userItem.role.charAt(0).toUpperCase() + userItem.role.slice(1)}
                      </td>
                      <td style={{ padding: '15px' }}>
                        {userItem.isLoggedIn ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            color: 'white',
                            boxShadow: '0 2px 8px rgba(79, 172, 254, 0.4)'
                          }}>
                            🟢 Online
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: 'rgba(255, 255, 255, 0.7)'
                          }}>
                            ⚫ Offline
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        {userItem.role !== 'superadmin' ? (
                          <select
                            value={userItem.role}
                            onChange={(e) => handleChangeRole(userItem._id, e.target.value)}
                            style={{
                              ...s.select,
                              padding: '8px 12px',
                              fontSize: '14px',
                              minWidth: '120px'
                            }}
                          >
                            <option value="student" style={s.selectOption}>Student</option>
                            <option value="admin" style={s.selectOption}>Admin</option>
                          </select>
                        ) : (
                          <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
                            Fixed
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        {userItem.isLoggedIn && (
                          <button
                            style={{
                              ...s.button,
                              ...s.buttonDanger,
                              padding: '8px 16px',
                              fontSize: '14px'
                            }}
                            onClick={() => handleForceLogout(userItem._id)}
                            onMouseEnter={(e) => {
                              Object.assign(e.currentTarget.style, s.buttonHover);
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = '';
                              e.currentTarget.style.boxShadow = s.buttonDanger.boxShadow;
                            }}
                          >
                            🚪 Logout
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}

        {/* Admin Sessions Table */}
        {activeSection === 'admin-sessions' && (
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: 'white',
              margin: 0
            }}>
              📊 Admin Sessions
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="text"
                placeholder="🔍 Search by admin, session, or status..."
                value={searchAdminSessions}
                onChange={(e) => setSearchAdminSessions(e.target.value)}
                style={{
                  ...s.input,
                  padding: '10px 15px',
                  fontSize: '14px',
                  minWidth: '250px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  margin: 0
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = '2px solid rgba(187, 134, 252, 0.6)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = '2px solid rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              />
            </div>
          </div>
          
          {filteredAdminSessions.length === 0 ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>📭</div>
              <h4 style={s.emptyTitle}>No admin sessions found</h4>
              <p style={s.emptyText}>
                {adminSessions.length === 0 
                  ? 'No quiz sessions have been created by admins yet' 
                  : 'No sessions match your search criteria'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                color: 'white'
              }}>
                <thead>
                  <tr style={{ background: 'rgba(102, 126, 234, 0.3)' }}>
                    <th style={{ ...s.tableHeaderCell, padding: '15px', textAlign: 'left' }}>Admin Name</th>
                    <th style={{ ...s.tableHeaderCell, padding: '15px', textAlign: 'left' }}>Admin Email</th>
                    <th style={{ ...s.tableHeaderCell, padding: '15px', textAlign: 'left' }}>Quiz Session</th>
                    <th style={{ ...s.tableHeaderCell, padding: '15px', textAlign: 'left' }}>Session ID</th>
                    <th style={{ ...s.tableHeaderCell, padding: '15px', textAlign: 'left' }}>Status</th>
                    <th style={{ ...s.tableHeaderCell, padding: '15px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdminSessions.map((session) => (
                    <tr 
                      key={session._id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '';
                      }}
                    >
                      <td style={{ padding: '15px', color: 'white' }}>
                        {session.adminName}
                        {session.adminIsLoggedIn && (
                          <span style={{
                            marginLeft: '8px',
                            fontSize: '10px',
                            color: '#4facfe'
                          }}>🟢</span>
                        )}
                      </td>
                      <td style={{ padding: '15px', color: 'rgba(255, 255, 255, 0.9)' }}>{session.adminEmail}</td>
                      <td style={{ padding: '15px', color: 'rgba(255, 255, 255, 0.9)' }}>{session.sessionName}</td>
                      <td style={{ padding: '15px', color: 'rgba(255, 255, 255, 0.9)', fontFamily: 'monospace' }}>{session.sessionId}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: session.status === 'Active' 
                            ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                            : 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          boxShadow: session.status === 'Active' 
                            ? '0 2px 8px rgba(79, 172, 254, 0.4)' 
                            : 'none'
                        }}>
                          {session.status === 'Active' ? '🟢 Active' : '⚫ Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        {session.status === 'Active' && (
                          <button
                            style={{
                              ...s.button,
                              ...s.buttonWarning,
                              padding: '8px 16px',
                              fontSize: '14px'
                            }}
                            onClick={() => handleEndSession(session.sessionId)}
                            onMouseEnter={(e) => {
                              Object.assign(e.currentTarget.style, s.buttonHover);
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = '';
                              e.currentTarget.style.boxShadow = s.buttonWarning.boxShadow;
                            }}
                          >
                            🛑 End Session
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdmin;

