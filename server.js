const express = require('express');
const app = express();
const cors = require('cors');
const cattleRoutes = require('./routes/cattleRoutes');
const userRoutes = require('./routes/userRoutes');
const alertRoutes = require('./routes/alertRoutes');
const authRoutes = require('./routes/authRoutes');
const branchRoutes = require('./routes/branchRoutes')
const healthRoutes = require('./routes/healthRoutes');
const geofenceRoutes = require('./routes/geofenceRoutes');
const WebSocket = require('ws');

require('dotenv').config();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // Serve files from the public folder

app.use('/api/cattle', cattleRoutes);
app.use('/api/users',userRoutes);
app.use('/api/alerts',alertRoutes);
app.use('/api/auth',authRoutes);
app.use('/api/branches',branchRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/geofences', geofenceRoutes);


// Routes (to be implemented)
app.get('/', (req, res) => res.send('Cattle Rustling Backend is running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocket.Server({ 
  port: 5000,
  path: '/ws' // Explicit path
});

console.log('WebSocket server running on ws://localhost:5000/ws');
// Broadcast new alerts
function broadcastAlert(alert) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'geofence_breach', ...alert }));
    }
  });
}