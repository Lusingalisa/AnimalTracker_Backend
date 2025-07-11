const db = require('../config/db');
const turf = require('@turf/turf'); // For geospatial calculations

// Create a new geofence zone
exports.createGeofence = async (req, res) => {
  try {
    const { user_id, zone_name, zone_type, zone_color, coordinates } = req.body;
    
    // Validate coordinates
    if (!coordinates || coordinates.length < 3) {
      return res.status(400).send('A geofence requires at least 3 coordinates');
    }

    // Start transaction
    await db.query('START TRANSACTION');

    // Insert zone
    const [zoneResult] = await db.query(
      `INSERT INTO geofence_zones 
       (user_id, zone_name, zone_type, zone_color) 
       VALUES (?, ?, ?, ?)`,
      [user_id, zone_name, zone_type, zone_color]
    );

    // Insert coordinates
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
    res.status(201).json({ 
      success: true, 
      zone_id: zoneResult.insertId 
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

    // Organize zones with their coordinates
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

    // Check each geofence
    for (const [zoneId, zone] of zoneMap) {
      if (zone.coordinates.length < 3) continue;

      const polygon = turf.polygon([zone.coordinates]);
      const isInside = turf.booleanPointInPolygon(point, polygon);

      // Check if we have an existing alert for this cattle+zone
      const [existingAlerts] = await db.query(
        `SELECT * FROM geofence_alerts 
         WHERE cattle_id = ? AND zone_id = ? 
         AND status = 'active' LIMIT 1`,
        [cattle_id, zoneId]
      );

      if (isInside) {
        // If inside and there was an exit alert, resolve it
        if (existingAlerts.length > 0 && existingAlerts[0].alert_type === 'exit') {
          await db.query(
            `UPDATE geofence_alerts SET status = 'resolved' 
             WHERE alert_id = ?`,
            [existingAlerts[0].alert_id]
          );
        }
      } else {
        // If outside and no active alert or was previously inside
        if (existingAlerts.length === 0 || existingAlerts[0].alert_type === 'entry') {
          alerts.push({
            cattle_id,
            zone_id: zoneId,
            alert_type: 'exit',
            message: `${zone.zone_name} violation: Cattle exited ${zone.zone_type} zone`
          });
        }
      }
    }

    // Insert new alerts if any
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

    // Parse coordinates
    const result = zones.map(zone => ({
      ...zone,
      coordinates: zone.coordinates ? JSON.parse(zone.coordinates) : []
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching geofences:', err);
    res.status(500).send('Failed to fetch geofences');
  }
};

// Delete a geofence
exports.deleteGeofence = async (req, res) => {
  try {
    const { zone_id } = req.params;
    
    await db.query('START TRANSACTION');
    
    // Delete coordinates first
    await db.query(
      `DELETE FROM geofence_coordinates WHERE zone_id = ?`,
      [zone_id]
    );
    
    // Then delete zone
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