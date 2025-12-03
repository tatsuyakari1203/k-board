/* eslint-disable @typescript-eslint/no-require-imports */
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function fixAdminUser() {
  try {
    const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
    console.log('Connecting to MongoDB...');

    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const result = await mongoose.connection.db.collection('users').updateMany(
      { role: 'admin' },
      { $set: { status: 'approved', isActive: true } }
    );

    console.log('Updated admin users:', result.modifiedCount);

    // Also show current admin users
    const admins = await mongoose.connection.db.collection('users').find({ role: 'admin' }).toArray();
    console.log('Admin users:', admins.map(u => ({
      email: u.email,
      role: u.role,
      status: u.status,
      isActive: u.isActive
    })));

    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixAdminUser();
