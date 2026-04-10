const redis = require('redis');

const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));
client.on('connect', () => console.log('Redis connected'));

const connectRedis = async () => {
  console.log('Skipping Redis locally to prevent hang');
};

module.exports = { client, connectRedis };
