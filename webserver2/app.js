const express = require('express');
const redis = require('redis');
const path = require('path');
const clientProm = require('prom-client');

const app = express();
const port = 3000;

clientProm.collectDefaultMetrics();

const bookingCounter = new clientProm.Counter({
  name: 'booking_requests_total',
  help: 'Total booking requests received',
});

const client = redis.createClient({
  socket: { host: 'redis', port: 6379 },
  legacyMode: true
});
client.on('error', (err) => console.error('Redis error:', err));
client.connect().catch((err) => console.error('Redis connect error:', err));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/test', (req, res) => {
  client.incr('counter:webserver2', (err, newCount) => {
    if (err) {
      console.error('Error incrementing counter:', err);
      res.status(500).send('Error occurred');
    } else {
      bookingCounter.inc();
      client.publish('logs', `Webserver 2 handled a request. Count: ${newCount}`);
      res.send(`Booking request received at Webserver 2, count: ${newCount}`);
    }
  });
});

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', clientProm.register.contentType);
    res.end(await clientProm.register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Webserver 2 listening on port ${port}`);
});
