// const db = require('../config/db');

// // Get location with promises
// const getLocation = async (req, res) => {
//   try {
//     const { cattleId } = req.params;
//     const [result] = await db.query(
//       'SELECT gps_location FROM cattle WHERE cattle_id = ?', 
//       [cattleId]
//     );
//     res.json(result[0] || {});
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// };

// // Get all cattle with promises
// const getAllCattle = async (req, res) => {
//   try {
//     const [results] = await db.query(`
//       SELECT 
//         cattle_id as id,
//         name, 
//         breed, 
//         location 
//       FROM cattle`
//     );
//     res.json(results);
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// };

// module.exports = { 
//   getLocation,
//   getAllCattle
// };

const db = require('../config/db');

// Get location for a specific cattle
const getLocation = async (req, res) => {
  try {
    const { cattleId } = req.params;
    const [result] = await db.query(
      `SELECT 
        cattle_id,
        user_id,
        ST_X(gps_location) AS latitude,
        ST_Y(gps_location) AS longitude
      FROM cattle 
      WHERE cattle_id = ? AND user_id = ?`,
      [cattleId, req.user.user_id]
    );
    if (!result.length) {
      return res.status(404).send('Cattle not found or not authorized');
    }
    res.json(result[0]);
  } catch (err) {
    console.error('Error fetching cattle location:', err);
    res.status(500).send('Failed to fetch cattle location');
  }
};

// Get all cattle for the authenticated user
const getAllCattle = async (req, res) => {
  try {
    console.log('Fetching cattle for user_id:', req.user.user_id);
    const [results] = await db.query(
      `SELECT 
        cattle_id,
        user_id,
        ST_X(gps_location) AS latitude,
        ST_Y(gps_location) AS longitude,
        status,
        rfid_tag,
        last_updated
      FROM cattle 
      WHERE user_id = ?`,
      [req.user.user_id]
    );
    res.json(results);
  } catch (err) {
    console.error('Error fetching cattle:', err);
    res.status(500).send('Failed to fetch cattle data');
  }
};

module.exports = { 
  getLocation,
  getAllCattle
};