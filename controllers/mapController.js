const db = require('../config/db');

// Get all cattle locations for the authenticated user
const getCattleLocations = async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT 
        cattle_id,
        ST_X(gps_location) AS latitude,
        ST_Y(gps_location) AS longitude,
        status,
        last_updated
      FROM cattle 
      WHERE user_id = ?`,
      [req.user.user_id]
    );
    res.json(results);
  } catch (err) {
    console.error('Error fetching cattle locations:', err);
    res.status(500).send('Failed to fetch cattle locations');
  }
};

module.exports = {
  getCattleLocations
};