const axios = require('axios');
const { faker } = require('@faker-js/faker');
const { JWT_SECRET } = process.env;

const BASE_URL = 'http://localhost:3000/api'; // Updated to include /api prefix
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJwaG9uZSI6IjA3NzMyNjU1MzAiLCJpYXQiOjE3NTI5MjA2NzEsImV4cCI6MTc1MjkyNDI3MX0.OVnSlMo7Bc4Rj14q7VEnJr5ILdbbx3LgQJiuV3ZHQ3A'; // Your valid token

const cattleIds = ['1', '2', '3', '4', '5']; // Match your inventory
const statuses = ['safe', 'alerted', 'stolen'];

function generateGpsData(cattleId) {
  return {
    cattle_id: cattleId,
    latitude: faker.address.latitude(),
    longitude: faker.address.longitude(),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    last_updated: new Date().toISOString()
  };
}

function generateRfidScan(cattleId) {
  return {
    cattle_id: cattleId,
    rfid_tag: `RFID${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString()
  };
}

async function simulate() {
  while (true) {
    for (const cattleId of cattleIds) {
      const gpsData = generateGpsData(cattleId);
      const rfidData = generateRfidScan(cattleId);

      // Update location
      await axios.get(`${BASE_URL}/cattle/map-data`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
        params: gpsData
      }).catch(err => console.log(`GPS update failed for ${cattleId}:`, err));

      // Check geofence
      await axios.post(`${BASE_URL}/geofences/check-position`, {
        cattle_id: cattleId,
        latitude: gpsData.latitude,
        longitude: gpsData.longitude
      }, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      }).catch(err => console.log(`Geofence check failed for ${cattleId}:`, err));

      // Simulate alert if status is alerted or stolen
      if (gpsData.status !== 'safe') {
        await axios.post(`${BASE_URL}/alerts`, {
          cattle_id: cattleId,
          message: `${gpsData.status} detected for ${cattleId}`
        }, {
          headers: { Authorization: `Bearer ${TOKEN}` }
        }).catch(err => console.log(`Alert creation failed for ${cattleId}:`, err));
      }
    }
    console.log('Simulation cycle completed');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Run every 5 seconds
  }
}

simulate().catch(err => console.error('Simulation error:', err));