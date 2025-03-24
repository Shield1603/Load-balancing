const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const redis = require('redis');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Redis client for counters
const redisClient = redis.createClient({ socket: { host: 'redis', port: 6379 } });
redisClient.on('error', (err) => console.error('Redis error:', err));
(async () => {
  try {
    await redisClient.connect();
    console.log('Dashboard: Connected to Redis for counters');
  } catch (error) {
    console.error('Redis connection error:', error);
  }
})();

// Create a separate Redis client for subscribing to logs
const redisSubscriber = redis.createClient({ socket: { host: 'redis', port: 6379 } });
redisSubscriber.on('error', (err) => console.error('Redis Subscriber error:', err));
(async () => {
  try {
    await redisSubscriber.connect();
    console.log('Dashboard: Connected to Redis for logs');
    await redisSubscriber.subscribe('logs', (message) => {
      console.log('Received log:', message);
      io.emit('log', message);
    });
  } catch (error) {
    console.error('Redis subscriber connection error:', error);
  }
})();

// Serve static files from the public folder
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Client connected to dashboard');
  sendCounters(socket);
  socket.on('disconnect', () => {
    console.log('Client disconnected from dashboard');
  });
});

// Function to send counter values
async function sendCounters(socket) {
  try {
    const results = await redisClient.mGet(['counter:webserver1', 'counter:webserver2']);
    const count1 = parseInt(results[0]) || 0;
    const count2 = parseInt(results[1]) || 0;
    socket.emit('update', { webserver1: count1, webserver2: count2 });
  } catch (err) {
    console.error('Error fetching counters:', err);
  }
}

// Poll Redis every 2 seconds for counters and broadcast updates
setInterval(async () => {
  try {
    const results = await redisClient.mGet(['counter:webserver1', 'counter:webserver2']);
    const count1 = parseInt(results[0]) || 0;
    const count2 = parseInt(results[1]) || 0;
    io.emit('update', { webserver1: count1, webserver2: count2 });
  } catch (err) {
    console.error('Error in interval:', err);
  }
}, 2000);

server.listen(4000, () => {
  console.log('Dashboard server listening on port 4000');
});
