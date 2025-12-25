# Super Admin Setup Guide

## Who Can Login as Super Admin?

**Currently, NO ONE can automatically login as superadmin** because:

1. **Registration System**: The registration endpoint only creates:
   - `student` users (default)
   - `admin` users (if email domain is `staff.college.edu`)

2. **Super Admin Role**: The `superadmin` role must be **manually assigned** in the database.

## How to Create a Super Admin User

### Option 1: Using the Script (Recommended)

**Prerequisites:** Make sure you have a `.env` file in the project root with:
```
MONGODB_URI=your_mongodb_connection_string
```

**Run the script:**
```bash
npm run create-superadmin
```

**Default credentials:**
- Email: `superadmin@college.edu`
- Password: `superadmin123`
- Name: `Super Admin`

**Custom credentials:**
```bash
npm run create-superadmin <email> <password> <name>
```

Example:
```bash
npm run create-superadmin admin@tce.edu mySecurePassword123 "Admin User"
```

**If MONGODB_URI is not set in .env file:**
```bash
# Option 1: Set environment variable (PowerShell)
$env:MONGODB_URI="mongodb://localhost:27017/your-database"
npm run create-superadmin

# Option 2: Pass as 4th argument
npm run create-superadmin <email> <password> <name> <mongodb_uri>
```

### Option 2: Manual Database Update

If you prefer to manually update the database:

1. Connect to your MongoDB database
2. Find or create a user document
3. Update the user's role to `'superadmin'`:

```javascript
// In MongoDB shell or MongoDB Compass
db.users.updateOne(
  { email: "your-email@example.com" },
  { 
    $set: { 
      role: "superadmin",
      isActive: true
    } 
  }
)
```

Or create a new superadmin user:

```javascript
db.users.insertOne({
  name: "Super Admin",
  email: "superadmin@college.edu",
  password: "<hashed_password>", // Use bcrypt to hash password
  role: "superadmin",
  isActive: true,
  isLoggedIn: false,
  loginTime: null,
  createdAt: new Date(),
  lastLogin: null
})
```

## Super Admin Features

Once logged in as superadmin, you can:

1. ✅ **View All Logged-in Users** - See who's currently online
2. ✅ **View All Registered Users** - See total user count and role distribution
3. ✅ **Change User Roles** - Switch users between `student` and `admin` (Super Admin role is protected)
4. ✅ **Force Logout Users** - Manually log out any user

## Security Notes

⚠️ **Important Security Recommendations:**

1. **Change Default Password**: After first login, immediately change the password
2. **Limit Super Admin Accounts**: Only create superadmin accounts for trusted administrators
3. **Protect Credentials**: Never share superadmin credentials publicly
4. **Regular Audits**: Periodically review who has superadmin access

## Login Process

1. Go to: `http://localhost:5173/login`
2. Enter the superadmin email and password
3. You'll be automatically redirected to `/superadmin` dashboard

## Troubleshooting

**Q: I can't login as superadmin**
- Check that the user exists in the database with `role: 'superadmin'`
- Verify the email and password are correct
- Ensure the user's `isActive` field is `true`

**Q: How do I check if a superadmin exists?**
```bash
# In MongoDB shell
db.users.find({ role: "superadmin" })
```

**Q: Can I have multiple superadmins?**
- Yes! You can create multiple superadmin users. Just use different email addresses.

**Q: Can I change an existing user to superadmin?**
- Yes! Run the script with an existing user's email, and it will update their role to superadmin.

