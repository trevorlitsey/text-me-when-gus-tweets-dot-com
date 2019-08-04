const mongoose = require('mongoose');

exports.createMongooseConnection = () => {
  return mongoose.connect(
    process.env.MONGO_DB_URL,
    { useNewUrlParser: true }
  );
};
