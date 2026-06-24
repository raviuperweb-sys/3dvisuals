const mongoose = require('mongoose');
const bcrypt    = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name:     { type: String, default: 'Admin' },
}, { timestamps: true });

adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

// Creates default admin on first run if none exists
adminSchema.statics.ensureDefaultAdmin = async function() {
  const count = await this.countDocuments();
  if (count === 0) {
    await this.create({ email: 'admin@3dvisual.in', password: 'Admin@123', name: 'Admin' });
    console.log('✅ Default admin created → email: admin@3dvisual.in  password: Admin@123');
  }
};

module.exports = mongoose.model('Admin', adminSchema);
