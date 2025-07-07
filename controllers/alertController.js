// const db = require('../config/db');
// const textbelt = require('textbelt');

// const getAlert = (req, res) => {
//   const { alertId } = req.params;
//   db.query('SELECT alert_id, cattle_id, timestamp, message, status FROM alerts WHERE alert_id = ?', [alertId], (err, result) => {
//     if (err) return res.status(500).send(err);
//     res.json(result[0] || {});
//   });
// };

// // const createAlert = (req, res) => {
// //   const { cattle_id, message } = req.body;
// //   db.query('INSERT INTO alerts (cattle_id, message) VALUES (?, ?)', [cattle_id, message], (err, result) => {
// //     if (err) return res.status(500).send(err);
// //     res.status(201).json({ alert_id: result.insertId, cattle_id, message });
// //   });
// // };

// const createAlert = async (req, res) => {
//   try {
//     const { cattle_id, message } = req.body;
//     const [result] = await db.execute('INSERT INTO alerts (cattle_id, message) VALUES (?, ?)', [cattle_id, message]);

//     // Get the user's phone number
//     const [[user]] = await db.execute('SELECT phone FROM users WHERE user_id = (SELECT user_id FROM cattle WHERE cattle_id = ?)', [cattle_id]);
//     if (user) {
//       // Send SMS using Textbelt (free tier limited to 1 SMS/day)
//       await textbelt.sendText(user.phone, `Alert: ${message}`, { apikey: 'textbelt' });
//     }

//     res.status(201).json({ alert_id: result.insertId, cattle_id, message });
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// };

// const updateAlert = (req, res) => {
//   const { alertId } = req.params;
//   const { status } = req.body;
//   db.query('UPDATE alerts SET status = ? WHERE alert_id = ?', [status, alertId], (err) => {
//     if (err) return res.status(500).send(err);
//     res.send('Alert updated');
//   });
// };

// const deleteAlert = (req, res) => {
//   const { alertId } = req.params;
//   db.query('DELETE FROM alerts WHERE alert_id = ?', [alertId], (err) => {
//     if (err) return res.status(500).send(err);
//     res.send('Alert deleted');
//   });
// };

// module.exports = { getAlert, createAlert, updateAlert, deleteAlert };

const db = require('../config/db');
const textbelt = require('textbelt');

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
    console.log('Fetching alerts for user_id:', req.user.user_id);
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
      WHERE c.user_id = ?`,
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
    const [result] = await db.execute('INSERT INTO alerts (cattle_id, message) VALUES (?, ?)', [cattle_id, message]);

    // Get the user's phone number
    const [[user]] = await db.execute('SELECT phone FROM users WHERE user_id = (SELECT user_id FROM cattle WHERE cattle_id = ?)', [cattle_id]);
    if (user) {
      // Send SMS using Textbelt (free tier limited to 1 SMS/day)
      await textbelt.sendText(user.phone, `Alert: ${message}`, { apikey: 'textbelt' });
    }

    res.status(201).json({ alert_id: result.insertId, cattle_id, message });
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