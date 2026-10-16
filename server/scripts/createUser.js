/**
 * Local-only script to create admin or driver accounts.
 * NEVER expose this as an HTTP endpoint.
 *
 * Usage (from server/ directory):
 *   node scripts/createUser.js admin admin@example.com StrongPass123 "Admin User"
 *   node scripts/createUser.js driver driver@example.com StrongPass123 "Driver One"
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const [, , role, email, password, name] = process.argv;

const ALLOWED_ROLES = ['admin', 'driver'];

if (!role || !email || !password || !name) {
  console.error('Usage: node scripts/createUser.js <role> <email> <password> "<name>"');
  process.exit(1);
}

if (!ALLOWED_ROLES.includes(role)) {
  console.error(`Role must be one of: ${ALLOWED_ROLES.join(', ')}`);
  process.exit(1);
}

if (password.length < 6) {
  console.error('Password must be at least 6 characters');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    const exists = await User.findOne({ email });
    if (exists) {
      console.error(`User with email "${email}" already exists (role: ${exists.role})`);
      process.exit(1);
    }

    const user = await User.create({ name, email, password, role });
    console.log(`✅ ${role} account created:`);
    console.log(`   Name  : ${user.name}`);
    console.log(`   Email : ${user.email}`);
    console.log(`   Role  : ${user.role}`);
    console.log(`   ID    : ${user._id}`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
