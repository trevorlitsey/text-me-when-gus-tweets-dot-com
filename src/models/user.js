const { Schema, model } = require('mongoose');
const { db } = require('../connections');

const schema = new Schema({
  name: {
    type: String,
    required: 'name is required to create user',
  },
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
