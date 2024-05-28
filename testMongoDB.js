const { MongoClient } = require('mongodb');

class TestMongoDB {
  constructor() {
    this.client = new MongoClient("mongodb://user:pass@172.17.240.1:27017");
    this.db = null;
    this.collection = null;
  }

  async connect() {
    try {
      await this.client.connect();
      console.log("Conectado ao MongoDB!");
      this.db = this.client.db("my_database");
      this.collection = this.db.collection("my_collection");
    } catch (error) {
      console.error("Erro ao conectar ao MongoDB:", error);
    }
  }

  async insertDocument(document) {
    try {
      const result = await this.collection.insertOne(document);
      console.log(`Documento inserido com o _id: ${result.insertedId}`);
    } catch (error) {
      console.error("Erro ao inserir documento:", error);
    }
  }

  async findDocument() {
    try {
      const document = await this.collection.findOne();
      console.log("Documento encontrado:", document);
    } catch (error) {
      console.error("Erro ao encontrar documento:", error);
    }
  }

  async close() {
    await this.client.close();
    console.log("Conexão com o MongoDB fechada.");
  }
}

async function main() {
  const testMongoDB = new TestMongoDB();
  await testMongoDB.connect();
  await testMongoDB.insertDocument({
    name: "John Doe",
    age: 30,
    city: "São Paulo",
  });
  await testMongoDB.findDocument();
  await testMongoDB.close();
}

main();
