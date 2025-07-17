const db = require('../config/db');

// Record health metrics
exports.recordMetrics = async (req, res) => {
  try {
    const { cattle_id, heart_rate, body_temp, respiration_rate, activity_level } = req.body;
    
    // Insert metrics
    const [result] = await db.query(
      `INSERT INTO health_metrics 
       (cattle_id, heart_rate, body_temp, respiration_rate, activity_level) 
       VALUES (?, ?, ?, ?, ?)`,
      [cattle_id, heart_rate, body_temp, respiration_rate, activity_level]
    );

    // Check for abnormal readings
    const alerts = [];
    if (heart_rate < 40 || heart_rate > 100) { // Example thresholds for cattle
      alerts.push({
        cattle_id,
        metric_id: result.insertId,
        alert_type: 'heart_rate',
        severity: heart_rate < 30 || heart_rate > 110 ? 'critical' : 'warning',
        message: `Abnormal heart rate detected: ${heart_rate} bpm`
      });
    }
    
    if (body_temp < 38.0 || body_temp > 39.5) { // Normal cattle temp range
      alerts.push({
        cattle_id,
        metric_id: result.insertId,
        alert_type: 'temperature',
        severity: body_temp < 37.0 || body_temp > 40.0 ? 'critical' : 'warning',
        message: `Abnormal body temperature: ${body_temp}°C`
      });
    }

    // Insert health-specific alerts
    if (alerts.length > 0) {
      await db.query(
        `INSERT INTO health_alerts 
         (cattle_id, metric_id, alert_type, severity, message) 
         VALUES ?`,
        [alerts.map(a => [a.cattle_id, result.insertId, a.type === 'health' ? (a.message.includes('heart rate') ? 'heart_rate' : 'temperature') : 'unknown', a.message.includes('heart rate') && (heart_rate < 30 || heart_rate > 110) ? 'critical' : a.message.includes('body_temp') && (body_temp < 37.0 || body_temp > 40.0) ? 'critical' : 'warning', a.message])]
      );
      
      if (alerts.some(a => a.message.includes('heart rate') && (heart_rate < 30 || heart_rate > 110) || a.message.includes('body_temp') && (body_temp < 37.0 || body_temp > 40.0))) {
        await db.query(
          `UPDATE cattle SET health_status = 'poor' WHERE cattle_id = ?`,
          [cattle_id]
        );
      }
    }

    // Insert any alerts
    if (alerts.length > 0) {
      await db.query(
        `INSERT INTO health_alerts 
         (cattle_id, metric_id, alert_type, severity, message) 
         VALUES ?`,
        [alerts.map(a => [a.cattle_id, a.metric_id, a.alert_type, a.severity, a.message])]
      );
      
      // Update cattle health status if critical alert
      if (alerts.some(a => a.severity === 'critical')) {
        await db.query(
          `UPDATE cattle SET health_status = 'poor' WHERE cattle_id = ?`,
          [cattle_id]
        );
      }
    }

    res.status(201).json({ success: true, metric_id: result.insertId, alerts });
  } catch (err) {
    console.error('Error recording health metrics:', err);
    res.status(500).send('Failed to record health metrics');
  }
};

// Get health metrics for a cattle
exports.getHealthMetrics = async (req, res) => {
  try {
    const { cattle_id } = req.params;
    const [metrics] = await db.query(
      `SELECT * FROM health_metrics 
       WHERE cattle_id = ? 
       ORDER BY timestamp DESC 
       LIMIT 100`,
      [cattle_id]
    );
    res.json(metrics);
  } catch (err) {
    console.error('Error fetching health metrics:', err);
    res.status(500).send('Failed to fetch health metrics');
  }
};

// Get health alerts
exports.getHealthAlerts = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `SELECT a.*, c.name as cattle_name 
                 FROM health_alerts a
                 JOIN cattle c ON a.cattle_id = c.cattle_id`;
    
    const params = [];
    if (status) {
      query += ' WHERE a.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY a.timestamp DESC LIMIT 100';
    
    const [alerts] = await db.query(query, params);
    res.json(alerts);
  } catch (err) {
    console.error('Error fetching health alerts:', err);
    res.status(500).send('Failed to fetch health alerts');
  }
};

// Update alert status
exports.updateAlertStatus = async (req, res) => {
  try {
    const { alert_id } = req.params;
    const { status } = req.body;
    
    await db.query(
      `UPDATE health_alerts SET status = ? WHERE alert_id = ?`,
      [status, alert_id]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating alert status:', err);
    res.status(500).send('Failed to update alert status');
  }
};