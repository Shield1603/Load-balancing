const socket = io();

// Pie Chart for request distribution
const ctxPie = document.getElementById('pieChart').getContext('2d');
const pieChart = new Chart(ctxPie, {
  type: 'pie',
  data: {
    labels: ['Webserver 1', 'Webserver 2', 'Webserver 3', 'Webserver 4'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  }
});

// Line Chart for requests over time
const ctxLine = document.getElementById('lineChart').getContext('2d');
const lineChart = new Chart(ctxLine, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: 'Webserver 1', data: [], borderColor: '#FF6384', fill: false },
      { label: 'Webserver 2', data: [], borderColor: '#36A2EB', fill: false },
      { label: 'Webserver 3', data: [], borderColor: '#FFCE56', fill: false },
      { label: 'Webserver 4', data: [], borderColor: '#4BC0C0', fill: false }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: 'Time' } },
      y: { title: { display: true, text: 'Requests' }, beginAtZero: true }
    }
  }
});

// Update charts and stats when new counter data arrives
socket.on('update', (data) => {
  pieChart.data.datasets[0].data = [data.webserver1, data.webserver2, data.webserver3, data.webserver4];
  pieChart.update();

  const total = data.webserver1 + data.webserver2 + data.webserver3 + data.webserver4;
  document.getElementById('statsText').textContent =
    `Total Requests: ${total} | WS1: ${data.webserver1} | WS2: ${data.webserver2} | WS3: ${data.webserver3} | WS4: ${data.webserver4}`;

  const now = new Date().toLocaleTimeString();
  lineChart.data.labels.push(now);
  lineChart.data.datasets[0].data.push(data.webserver1);
  lineChart.data.datasets[1].data.push(data.webserver2);
  lineChart.data.datasets[2].data.push(data.webserver3);
  lineChart.data.datasets[3].data.push(data.webserver4);
  if (lineChart.data.labels.length > 20) {
    lineChart.data.labels.shift();
    lineChart.data.datasets.forEach((dataset) => dataset.data.shift());
  }
  lineChart.update();
});

// Listen for log messages and update the logs list
socket.on('log', (message) => {
  const logsList = document.getElementById('logsList');
  const li = document.createElement('li');
  li.textContent = message;
  logsList.appendChild(li);
  const logsContainer = document.getElementById('logsContainer');
  logsContainer.scrollTop = logsContainer.scrollHeight;
});
