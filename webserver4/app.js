const express = require('express');
const redis = require('redis');
const path = require('path');

const app = express();
const port = 3000;

const client = redis.createClient({
  socket: { host: 'redis', port: 6379 },
  legacyMode: true
});
client.on('error', (err) => console.error('Redis error:', err));
client.connect().catch((err) => console.error('Redis connect error:', err));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/test', (req, res) => {
  client.incr('counter:webserver4', (err, newCount) => {
    if (err) {
      console.error('Error incrementing counter:', err);
      res.status(500).send('Error occurred');
    } else {
      client.publish('logs', `Webserver 4 handled a request. Count: ${newCount}`);
      res.send(`Booking request received at Webserver 4, count: ${newCount}`);
    }
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Webserver 4 listening on port ${port}`);
});
