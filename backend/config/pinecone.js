const { Pinecone } = require('@pinecone-database/pinecone');

const initPinecone = () => {
  try {
    const apiKey = process.env.PINECONE_API_KEY || "missing_api_key_placeholder";
    const pinecone = new Pinecone({
      apiKey: apiKey,
    });

    // We get the index name from env, or fallback to the one in your .env file
    const indexName = process.env.PINECONE_INDEX || 'mindcare-index';
    return pinecone.Index(indexName);
  } catch (error) {
    console.error('Pinecone initialization failed', error);
    throw error;
  }
};

module.exports = { initPinecone };
