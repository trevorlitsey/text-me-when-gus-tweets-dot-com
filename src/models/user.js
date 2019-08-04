const { Schema, model } = require('mongoose');
const { db } = require('../connections');

const schema = new Schema({
  name: String,
  phoneNumber: {
    type: String,
    required: 'phoneNumber is required to create user',
    unique: true,
  },
  inserted_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = model('User', schema);
