const db = require('../config/db');

// const getBranch = (req, res) => {
//   const { branchId } = req.params;
//   db.query('SELECT branch_id, location, gateway_id FROM branches WHERE branch_id = ?', [branchId], (err, result) => {
//     if (err) return res.status(500).send(err);
//     res.json(result[0] || {});
//   });
// };

// const createBranch = (req, res) => {
//   const { location, gateway_id } = req.body;
//   db.query('INSERT INTO branches (location, gateway_id) VALUES (?, ?)', [location, gateway_id], (err, result) => {
//     if (err) return res.status(500).send(err);
//     res.status(201).json({ branch_id: result.insertId, location, gateway_id });
//   });
// };

// const updateBranch = (req, res) => {
//   const { branchId } = req.params;
//   const { location, gateway_id } = req.body;
//   db.query('UPDATE branches SET location = ?, gateway_id = ? WHERE branch_id = ?', [location, gateway_id, branchId], (err) => {
//     if (err) return res.status(500).send(err);
//     res.send('Branch updated');
//   });
// };

// const deleteBranch = (req, res) => {
//   const { branchId } = req.params;
//   db.query('DELETE FROM branches WHERE branch_id = ?', [branchId], (err) => {
//     if (err) return res.status(500).send(err);
//     res.send('Branch deleted');
//   });
// };

const getBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const [result] = await db.execute('SELECT branch_id, location, gateway_id FROM branches WHERE branch_id = ?', [branchId]);
    res.json(result[0] || {});
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const createBranch = async (req, res) => {
  try {
    const { location, gateway_id } = req.body;
    const [result] = await db.execute('INSERT INTO branches (location, gateway_id) VALUES (?, ?)', [location, gateway_id]);
    res.status(201).json({ branch_id: result.insertId, location, gateway_id });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const updateBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { location, gateway_id } = req.body;
    await db.execute('UPDATE branches SET location = ?, gateway_id = ? WHERE branch_id = ?', [location, gateway_id, branchId]);
    res.send('Branch updated');
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const deleteBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    await db.execute('DELETE FROM branches WHERE branch_id = ?', [branchId]);
    res.send('Branch deleted');
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const getAllBranches = async (req, res) => {
  try {
    const [results] = await db.execute('SELECT branch_id, location, gateway_id');
    res.json(results);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = { getBranch, createBranch, updateBranch, deleteBranch, getAllBranches };