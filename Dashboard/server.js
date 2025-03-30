const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const redis = require('redis');
const path = require('path');

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

// Redis subscriber for logs
const redisSubscriber = redis.createClient({ socket: { host: 'redis', port: 6379 } });
redisSubscriber.on('error', (err) => console.error('Redis Subscriber error:', err));
(async () => {
  try {
    await redisSubscriber.connect();
    console.log('Dashboard: Connected to Redis for logs');
    await redisSubscriber.subscribe('logs', (message) => {
      io.emit('log', message);
    });
  } catch (error) {
    console.error('Redis subscriber connection error:', error);
  }
})();

// Serve static files from the public folder.
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  sendCounters(socket);
  socket.on('disconnect', () => {
    console.log('Client disconnected from dashboard');
  });
});

async function sendCounters(socket) {
  try {
    const results = await redisClient.mGet(['counter:webserver1', 'counter:webserver2', 'counter:webserver3', 'counter:webserver4']);
    const count1 = parseInt(results[0]) || 0;
    const count2 = parseInt(results[1]) || 0;
    const count3 = parseInt(results[2]) || 0;
    const count4 = parseInt(results[3]) || 0;
    socket.emit('update', { webserver1: count1, webserver2: count2, webserver3: count3, webserver4: count4 });
  } catch (err) {
    console.error('Error fetching counters:', err);
  }
}

// Poll Redis every 2 seconds and broadcast updates.
setInterval(async () => {
  try {
    const results = await redisClient.mGet(['counter:webserver1', 'counter:webserver2', 'counter:webserver3', 'counter:webserver4']);
    const count1 = parseInt(results[0]) || 0;
    const count2 = parseInt(results[1]) || 0;
    const count3 = parseInt(results[2]) || 0;
    const count4 = parseInt(results[3]) || 0;
    io.emit('update', { webserver1: count1, webserver2: count2, webserver3: count3, webserver4: count4 });
  } catch (err) {
    console.error('Error in interval:', err);
  }
}, 2000);

server.listen(4000, () => {
  console.log('Dashboard server listening on port 4000');
});
