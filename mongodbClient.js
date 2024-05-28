const { MongoClient } = require('mongodb');
require('dotenv').config();
const mongoUrl = process.env.MONGO_URL;
const client = new MongoClient(mongoUrl);

module.exports.connectMongo = async () => {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client;
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
  }
};
