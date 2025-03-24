const express = require('express');
const redis = require('redis');

const app = express();
const port = 3000;

const client = redis.createClient({
  socket: { host: 'redis', port: 6379 },
  legacyMode: true
});
client.on('error', (err) => console.error('Redis error:', err));
client.connect().catch((err) => console.error('Redis connect error:', err));

app.get('/', (req, res) => {
  client.incr('counter:webserver2', (err, newCount) => {
    if (err) {
      console.error('Error incrementing counter:', err);
      res.status(500).send('Error occurred');
    } else {
      client.publish('logs', `Webserver 2 handled a request. Count: ${newCount}`);
      res.send(`Hello from Webserver 2, count: ${newCount}`);
    }
  });
});

app.listen(port, () => {
  console.log(`Webserver 2 listening on port ${port}`);
});
