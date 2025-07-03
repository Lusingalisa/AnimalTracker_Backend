const db = require('../config/db');

const getAlert = (req, res) => {
  const { alertId } = req.params;
  db.query('SELECT alert_id, cattle_id, timestamp, message, status FROM alerts WHERE alert_id = ?', [alertId], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result[0] || {});
  });
};

const createAlert = (req, res) => {
  const { cattle_id, message } = req.body;
  db.query('INSERT INTO alerts (cattle_id, message) VALUES (?, ?)', [cattle_id, message], (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(201).json({ alert_id: result.insertId, cattle_id, message });
  });
};

const updateAlert = (req, res) => {
  const { alertId } = req.params;
  const { status } = req.body;
  db.query('UPDATE alerts SET status = ? WHERE alert_id = ?', [status, alertId], (err) => {
    if (err) return res.status(500).send(err);
    res.send('Alert updated');
  });
};

const deleteAlert = (req, res) => {
  const { alertId } = req.params;
  db.query('DELETE FROM alerts WHERE alert_id = ?', [alertId], (err) => {
    if (err) return res.status(500).send(err);
    res.send('Alert deleted');
  });
};

module.exports = { getAlert, createAlert, updateAlert, deleteAlert };