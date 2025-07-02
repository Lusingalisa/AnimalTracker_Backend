const db = require('../config/db');

const getUser = (req, res) => {
  const { userId } = req.params;
  db.query('SELECT user_id, name, phone, branch_id FROM users WHERE user_id = ?', [userId], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result[0] || {});
  });
};

const createUser = (req, res) => {
  const { name, phone, branch_id } = req.body;
  db.query('INSERT INTO users (name, phone, branch_id) VALUES (?, ?, ?)', [name, phone, branch_id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(201).json({ user_id: result.insertId, name, phone, branch_id });
  });
};

const updateUser = (req, res) => {
  const { userId } = req.params;
  const { name, phone, branch_id } = req.body;
  db.query('UPDATE users SET name = ?, phone = ?, branch_id = ? WHERE user_id = ?', [name, phone, branch_id, userId], (err) => {
    if (err) return res.status(500).send(err);
    res.send('User updated');
  });
};

const deleteUser = (req, res) => {
  const { userId } = req.params;
  db.query('DELETE FROM users WHERE user_id = ?', [userId], (err) => {
    if (err) return res.status(500).send(err);
    res.send('User deleted');
  });
};

module.exports = { getUser, createUser, updateUser, deleteUser };