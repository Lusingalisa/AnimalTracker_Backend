const db = require('../config/db');

const getLocation = (req, res) => {
  const { cattleId } = req.params;
  db.query('SELECT gps_location FROM cattle WHERE cattle_id = ?', [cattleId], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json(result[0] || {});
  });
};

module.exports = { getLocation };