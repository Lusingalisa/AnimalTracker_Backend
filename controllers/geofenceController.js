
const db = require('../config/db');
const turf = require('@turf/turf');
const axios = require('axios');

// Create a new geofence zone
exports.createGeofence = async (req, res) => {
  try {
    const { user_id, zone_name, zone_type, zone_color, coordinates } = req.body;
    
    if (!coordinates || coordinates.length < 3) {
      return res.status(400).send('A geofence requires at least 3 coordinates');
    }

    await db.query('START TRANSACTION');

    const [zoneResult] = await db.query(
      `INSERT INTO geofence_zones 
       (user_id, zone_name, zone_type, zone_color) 
       VALUES (?, ?, ?, ?)`,
      [user_id, zone_name, zone_type, zone_color]
    );

    const coordValues = coordinates.map((coord, index) => [
      zoneResult.insertId,
      coord.latitude,
      coord.longitude,
      index
    ]);

    await db.query(
      `INSERT INTO geofence_coordinates 
       (zone_id, latitude, longitude, sequence) 
       VALUES ?`,
      [coordValues]
    );

    await db.query('COMMIT');
    
    // Get the full geofence data to return
    const [newGeofence] = await db.query(
      `SELECT gz.*, 
              JSON_ARRAYAGG(
                JSON_OBJECT(
                  'latitude', gc.latitude,
                  'longitude', gc.longitude,
                  'sequence', gc.sequence
                )
              ) AS coordinates
       FROM geofence_zones gz
       LEFT JOIN geofence_coordinates gc ON gz.zone_id = gc.zone_id
       WHERE gz.zone_id = ?
       GROUP BY gz.zone_id`,
      [zoneResult.insertId]
    );

    res.status(201).json({ 
      success: true, 
      geofence: {
        ...newGeofence[0],
        coordinates: JSON.parse(newGeofence[0].coordinates)
      }
    });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error creating geofence:', err);
    res.status(500).send('Failed to create geofence');
  }
};

// Check cattle position against geofences
exports.checkPosition = async (req, res) => {
  try {
    const { cattle_id, latitude, longitude } = req.body;
    const user_id = req.user.user_id;

    // Get cattle name
    const [cattle] = await db.query(
      `SELECT name FROM cattle WHERE cattle_id = ?`,
      [cattle_id]
    );
    const cattle_name = cattle[0]?.name || `Cattle #${cattle_id}`;

    // Get all geofences for this user
    const [zones] = await db.query(
      `SELECT gz.zone_id, gz.zone_name, gz.zone_type,
              gc.latitude, gc.longitude, gc.sequence
       FROM geofence_zones gz
       JOIN geofence_coordinates gc ON gz.zone_id = gc.zone_id
       WHERE gz.user_id = ?
       ORDER BY gz.zone_id, gc.sequence`,
      [user_id]
    );

    const zoneMap = new Map();
    zones.forEach(row => {
      if (!zoneMap.has(row.zone_id)) {
        zoneMap.set(row.zone_id, {
          zone_id: row.zone_id,
          zone_name: row.zone_name,
          zone_type: row.zone_type,
          coordinates: []
        });
      }
      zoneMap.get(row.zone_id).coordinates.push([row.longitude, row.latitude]);
    });

    const alerts = [];
    const point = turf.point([longitude, latitude]);

    for (const [zoneId, zone] of zoneMap) {
      if (zone.coordinates.length < 3) continue;

      const polygon = turf.polygon([zone.coordinates]);
      const isInside = turf.booleanPointInPolygon(point, polygon);

      const [existingAlerts] = await db.query(
        `SELECT * FROM geofence_alerts 
         WHERE cattle_id = ? AND zone_id = ? 
         AND status = 'active' LIMIT 1`,
        [cattle_id, zoneId]
      );

      if (isInside) {
        if (existingAlerts.length > 0 && existingAlerts[0].alert_type === 'exit') {
          await db.query(
            `UPDATE geofence_alerts SET status = 'resolved' 
             WHERE alert_id = ?`,
            [existingAlerts[0].alert_id]
          );
        }
      } else {
        if (existingAlerts.length === 0 || existingAlerts[0].alert_type === 'entry') {
          alerts.push({
            cattle_id,
            cattle_name,
            zone_id: zoneId,
            alert_type: 'exit',
            message: `${cattle_name} exited ${zone.zone_name} (${zone.zone_type} zone)`
          });
        }
      }
    }

    if (alerts.length > 0) {
      await db.query(
        `INSERT INTO geofence_alerts 
         (cattle_id, zone_id, alert_type, message) 
         VALUES ?`,
        [alerts.map(a => [a.cattle_id, a.zone_id, a.alert_type, a.message])]
      );
    }

    res.json({ success: true, alerts });
  } catch (err) {
    console.error('Error checking position:', err);
    res.status(500).send('Failed to check position');
  }
};

// Get all geofences for user
exports.getGeofences = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    
    const [zones] = await db.query(
      `SELECT gz.*, 
              JSON_ARRAYAGG(
                JSON_OBJECT(
                  'latitude', gc.latitude,
                  'longitude', gc.longitude,
                  'sequence', gc.sequence
                )
              ) AS coordinates
       FROM geofence_zones gz
       LEFT JOIN geofence_coordinates gc ON gz.zone_id = gc.zone_id
       WHERE gz.user_id = ?
       GROUP BY gz.zone_id`,
      [user_id]
    );

    console.log('Raw zones:', zones);
    console.log('Type of coordinates:', zones[0]?.coordinates, typeof zones[0]?.coordinates);

    const result = zones.map(zone => ({
      ...zone,
      coordinates: zone.coordinates || []
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching geofences:', err);
    res.status(500).send('Failed to fetch geofences');
  }
};

// Get geofence alerts
exports.getGeofenceAlerts = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { status } = req.query;
    
    let query = `
      SELECT ga.*, gz.zone_name, c.name as cattle_name
      FROM geofence_alerts ga
      JOIN cattle c ON ga.cattle_id = c.cattle_id
      JOIN geofence_zones gz ON ga.zone_id = gz.zone_id
      WHERE c.user_id = ?
    `;
    
    const params = [user_id];
    
    if (status) {
      query += ` AND ga.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY ga.timestamp DESC`;
    
    const [alerts] = await db.query(query, params);
    res.json(alerts);
  } catch (err) {
    console.error('Error fetching geofence alerts:', err);
    res.status(500).send('Failed to fetch geofence alerts');
  }
};

// Update alert status
exports.updateAlertStatus = async (req, res) => {
  try {
    const { alert_id } = req.params;
    const { status } = req.body;
    
    await db.query(
      `UPDATE geofence_alerts 
       SET status = ? 
       WHERE alert_id = ?`,
      [status, alert_id]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating alert status:', err);
    res.status(500).send('Failed to update alert status');
  }
  
};

// Delete a geofence
exports.deleteGeofence = async (req, res) => {
  try {
    const { zone_id } = req.params;
    
    await db.query('START TRANSACTION');
    
    await db.query(
      `DELETE FROM geofence_coordinates WHERE zone_id = ?`,
      [zone_id]
    );
    
    await db.query(
      `DELETE FROM geofence_zones WHERE zone_id = ?`,
      [zone_id]
    );
    
    await db.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error deleting geofence:', err);
    res.status(500).send('Failed to delete geofence');
  }
};

// Function to send SMS via TextBelt
async function sendTextBeltSMS(phoneNumber, message) {
  try {
    const response = await axios.post('http://textbelt.com/text', {
      phone: phoneNumber,
      message: message,
      key: 'textbelt', // Free tier key
    });
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to send SMS');
    }
    
    return response.data;
  } catch (error) {
    console.error('TextBelt error:', error.message);
    throw error;
  }
}