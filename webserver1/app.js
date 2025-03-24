const express = require('express');
const redis = require('redis');

const app = express();
const port = 3000;

// Create a Redis client in legacy mode.
const client = redis.createClient({
  socket: { host: 'redis', port: 6379 },
  legacyMode: true
});
client.on('error', (err) => console.error('Redis error:', err));
client.connect().catch((err) => console.error('Redis connect error:', err));

app.get('/', (req, res) => {
  client.incr('counter:webserver1', (err, newCount) => {
    if (err) {
      console.error('Error incrementing counter:', err);
      res.status(500).send('Error occurred');
    } else {
      // Publish a log message to the "logs" channel.
      client.publish('logs', `Webserver 1 handled a request. Count: ${newCount}`);
      res.send(`Hello from Webserver 1, count: ${newCount}`);
    }
  });
});

app.listen(port, () => {
  console.log(`Webserver 1 listening on port ${port}`);
});
