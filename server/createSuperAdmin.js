import mongoose from 'mongoose';
import { hash } from 'bcrypt';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load .env from multiple locations
const envPaths = [
  resolve(__dirname, '.env'),           // server/.env
  resolve(__dirname, '..', '.env'),    // project root .env
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`📄 Loaded .env from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('⚠️  Warning: No .env file found. Trying default dotenv.config()...');
  dotenv.config(); // Fallback to default behavior
}

// User Schema (same as in api.js)
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
    enum: ['student', 'admin', 'superadmin'],
    default: 'student'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  loginTime: {
    type: Date,
    default: null
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

const User = mongoose.model('User', userSchema);

async function createSuperAdmin() {
  try {
    // Get MongoDB URI from environment or command line
    const args = process.argv.slice(2);
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ Error: MONGODB_URI is not set!');
      console.error('\n💡 Solutions:');
      console.error('   1. Create a .env file in the project root with:');
      console.error('      MONGODB_URI=your_mongodb_connection_string');
      console.error('\n   2. Or pass it as the 4th argument:');
      console.error('      npm run create-superadmin <email> <password> <name> <mongodb_uri>');
      console.error('\n   3. Or set it as an environment variable:');
      console.error('      $env:MONGODB_URI="your_mongodb_connection_string"');
      console.error('      npm run create-superadmin');
      process.exit(1);
    }

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get credentials from command line arguments or use defaults
    const email = args[0] || 'superadmin@college.edu';
    const password = args[1] || 'superadmin123';
    const name = args[2] || 'Super Admin';

    // Check if user with this email already exists
    const existingUser = await User.findOne({ 
      email: email.toLowerCase()
    });

    if (existingUser) {
      if (existingUser.role === 'superadmin') {
        console.log(`⚠️  User with email ${email} already exists as superadmin.`);
        console.log('💡 Updating password and name...');
        existingUser.password = await hash(password, 10);
        existingUser.name = name;
        await existingUser.save();
        console.log('✅ Superadmin updated successfully!');
        console.log(`\n📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log(`👤 Name: ${name}`);
        process.exit(0);
      } else {
        console.log(`⚠️  User with email ${email} already exists with role: ${existingUser.role}`);
        console.log('💡 Updating to superadmin role...');
        existingUser.role = 'superadmin';
        existingUser.password = await hash(password, 10);
        existingUser.name = name;
        await existingUser.save();
        console.log('✅ User updated to superadmin successfully!');
        console.log(`\n📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log(`👤 Name: ${name}`);
        process.exit(0);
      }
    }

    // Create new superadmin
    const hashedPassword = await hash(password, 10);
    const superAdmin = new User({
      name: name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'superadmin',
      isActive: true
    });

    await superAdmin.save();
    
    console.log('\n✅ Super Admin created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Password: ${password}`);
    console.log(`   👤 Name: ${name}`);
    console.log('\n⚠️  Please change the password after first login!');
    console.log('\n🚀 You can now login at: http://localhost:5173/login');

  } catch (error) {
    console.error('❌ Error creating superadmin:', error.message);
    if (error.code === 11000) {
      console.error('   A user with this email already exists.');
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the script
createSuperAdmin();

