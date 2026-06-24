const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  name:    { type: String, required: true },
  phone:   { type: String, required: true },
  email:   { type: String, default: '' },
  service: { type: String, default: '' },
  message: { type: String, required: true },
  status:  { type: String, enum: ['new','read','replied'], default: 'new' },
  source:  { type: String, default: 'website' },
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', enquirySchema);
