const { Schema, model } = require('mongoose');
const { db } = require('../connections');

const schema = new Schema({
  id: {
    type: String,
    required: 'id is required to create tweet',
    unique: true,
  },
  text: {
    type: String,
    required: 'text is required to create tweet',
  },
  created_at: {
    type: String,
    required: 'created_at is required to create tweet',
  },
  inserted_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = model('Tweet', schema);
