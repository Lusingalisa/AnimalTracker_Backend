// const db = require('../config/db');

// // Get all cattle locations for the authenticated user
// const getCattleLocations = async (req, res) => {
//   try {
//     const [results] = await db.query(
//       `SELECT 
//         cattle_id,
//         ST_X(gps_location) AS latitude,
//         ST_Y(gps_location) AS longitude,
//         status,
//         last_updated
//       FROM cattle 
//       WHERE user_id = ?`,
//       [req.user.user_id]
//     );
//     res.json(results);
//   } catch (err) {
//     console.error('Error fetching cattle locations:', err);
//     res.status(500).send('Failed to fetch cattle locations');
//   }
// };

// module.exports = {
//   getCattleLocations
// };

const db = require('../config/db');

const getCattleLocations = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const [results] = await db.query(
        `SELECT cattle_id, ST_X(gps_location) AS latitude, ST_Y(gps_location) AS longitude, status, last_updated 
         FROM cattle WHERE user_id = ?`,
        [req.user.user_id]
      );
      res.json(results);
    } else if (req.method === 'POST') {
      const { cattle_id, latitude, longitude, status, last_updated } = req.body;
      await db.query(
        `UPDATE cattle SET gps_location = ST_GeomFromText('POINT(? ?)', 4326), status = ?, last_updated = ? 
         WHERE cattle_id = ? AND user_id = ?`,
        [longitude, latitude, status, last_updated, cattle_id, req.user.user_id]
      );
      res.json({ success: true });
    }
  } catch (err) {
    console.error('Error fetching/updating cattle locations:', err);
    res.status(500).send('Failed to fetch/update cattle locations');
  }
};

module.exports = { getCattleLocations };