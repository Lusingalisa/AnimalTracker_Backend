// 

const db = require('../config/db');
const WebSocket = require('../config/websocket'); // Add this line

// Get a single alert by alert_id
const getAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const [result] = await db.query(
      `SELECT alert_id, cattle_id, timestamp, message, status 
       FROM alerts 
       WHERE alert_id = ? AND cattle_id IN (SELECT cattle_id FROM cattle WHERE user_id = ?)`,
      [alertId, req.user.user_id]
    );
    if (!result.length) {
      return res.status(404).send('Alert not found or not authorized');
    }
    res.json(result[0]);
  } catch (err) {
    console.error('Error fetching alert:', err);
    res.status(500).send('Failed to fetch alert');
  }
};

// Get all alerts for the authenticated user's cattle
const getAllAlerts = async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT 
        a.alert_id,
        a.cattle_id,
        a.timestamp,
        a.message,
        a.status,
        c.rfid_tag
      FROM alerts a
      JOIN cattle c ON a.cattle_id = c.cattle_id
      WHERE c.user_id = ?
      ORDER BY a.timestamp DESC`,
      [req.user.user_id]
    );
    res.json(results);
  } catch (err) {
    console.error('Error fetching alerts:', err);
    res.status(500).send('Failed to fetch alerts');
  }
};

// Create a new alert
const createAlert = async (req, res) => {
  try {
    const { cattle_id, message } = req.body;
    const [result] = await db.execute(
      'INSERT INTO alerts (cattle_id, message, status) VALUES (?, ?, "unread")',
      [cattle_id, message]
    );

    // Get the full alert details
    const [[alert]] = await db.query(
      `SELECT a.*, c.rfid_tag 
       FROM alerts a
       JOIN cattle c ON a.cattle_id = c.cattle_id
       WHERE a.alert_id = ?`,
      [result.insertId]
    );

    // Broadcast to WebSocket clients
    WebSocket.broadcast({
      type: 'NEW_ALERT',
      data: alert
    });

    res.status(201).json(alert);
  } catch (err) {
    console.error('Error creating alert:', err);
    res.status(500).send('Failed to create alert');
  }
};

// Update an alert's status
const updateAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { status } = req.body;
    const [result] = await db.execute(
      'UPDATE alerts SET status = ? WHERE alert_id = ? AND cattle_id IN (SELECT cattle_id FROM cattle WHERE user_id = ?)',
      [status, alertId, req.user.user_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).send('Alert not found or not authorized');
    }
    res.send('Alert updated');
  } catch (err) {
    console.error('Error updating alert:', err);
    res.status(500).send('Failed to update alert');
  }
};

// Delete an alert
const deleteAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const [result] = await db.execute(
      'DELETE FROM alerts WHERE alert_id = ? AND cattle_id IN (SELECT cattle_id FROM cattle WHERE user_id = ?)',
      [alertId, req.user.user_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).send('Alert not found or not authorized');
    }
    res.send('Alert deleted');
  } catch (err) {
    console.error('Error deleting alert:', err);
    res.status(500).send('Failed to delete alert');
  }
};

module.exports = { getAlert, getAllAlerts, createAlert, updateAlert, deleteAlert };