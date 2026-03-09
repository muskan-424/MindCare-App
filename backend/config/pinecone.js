const { Pinecone } = require('@pinecone-database/pinecone');

const initPinecone = () => {
  try {
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    
    const index = pc.Index(process.env.PINECONE_INDEX);
    console.log('Pinecone Client Initialized');
    return index;
  } catch (error) {
    console.error('Pinecone initialization error:', error.message);
    throw error;
  }
};

module.exports = { initPinecone };
