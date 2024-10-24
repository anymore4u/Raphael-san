const { MongoClient } = require('mongodb');
require('dotenv').config();
const mongoUrl = process.env.MONGO_URL;
const client = new MongoClient(mongoUrl);

module.exports.connectMongo = async () => {
  const maxAttempts = 5;
  const delay = 5000; // 5 segundos de delay entre tentativas
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      await client.connect();
      console.log('Connected to MongoDB');
      return client;
    } catch (err) {
      attempts += 1;
      console.error(`Failed to connect to MongoDB (attempt ${attempts} of ${maxAttempts})`, err);
      if (attempts < maxAttempts) {
        console.log(`Retrying connection in ${delay / 1000} seconds...`);
        await new Promise(res => setTimeout(res, delay)); // Aguarda antes de tentar novamente
      } else {
        console.error('All attempts to connect to MongoDB failed.');
        throw err; // Lança o erro após atingir o número máximo de tentativas
      }
    }
  }
};
