const socket = io();

// Pie Chart for request distribution
const ctxPie = document.getElementById('pieChart').getContext('2d');
const pieChart = new Chart(ctxPie, {
  type: 'pie',
  data: {
    labels: ['Webserver 1', 'Webserver 2'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#FF6384', '#36A2EB']
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  }
});

// Line Chart for requests over time
const ctxLine = document.getElementById('lineChart').getContext('2d');
const lineChart = new Chart(ctxLine, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Webserver 1',
        data: [],
        borderColor: '#FF6384',
        fill: false
      },
      {
        label: 'Webserver 2',
        data: [],
        borderColor: '#36A2EB',
        fill: false
      }
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
  // Update pie chart
  pieChart.data.datasets[0].data = [data.webserver1, data.webserver2];
  pieChart.update();
  
  // Update summary stats
  const total = data.webserver1 + data.webserver2;
  document.getElementById('statsText').textContent =
    `Total Requests: ${total} | Webserver 1: ${data.webserver1} | Webserver 2: ${data.webserver2}`;
  
  // Update line chart with a new data point
  const now = new Date().toLocaleTimeString();
  lineChart.data.labels.push(now);
  lineChart.data.datasets[0].data.push(data.webserver1);
  lineChart.data.datasets[1].data.push(data.webserver2);
  
  // Keep only the latest 20 data points
  if (lineChart.data.labels.length > 20) {
    lineChart.data.labels.shift();
    lineChart.data.datasets[0].data.shift();
    lineChart.data.datasets[1].data.shift();
  }
  lineChart.update();
});

// Listen for log messages and update logs list
socket.on('log', (message) => {
  const logsList = document.getElementById('logsList');
  const li = document.createElement('li');
  li.textContent = message;
  logsList.appendChild(li);
  // Auto-scroll logs container to the bottom
  const logsContainer = document.getElementById('logsContainer');
  logsContainer.scrollTop = logsContainer.scrollHeight;
});
