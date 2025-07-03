const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const register = (req, res) => {
  const { name, phone, password, branch_id } = req.body;
  if (!name || !phone || !password) return res.status(400).send('All fields are required');

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).send(err);
    db.query('INSERT INTO users (name, phone, password, branch_id) VALUES (?, ?, ?, ?)', 
      [name, phone, hash, branch_id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.status(201).json({ user_id: result.insertId, name, phone, branch_id });
      });
  });
};

const login = (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).send('Phone and password are required');

  db.query('SELECT user_id, name, phone, password, branch_id FROM users WHERE phone = ?', [phone], (err, result) => {
    if (err) return res.status(500).send(err);
    if (!result.length) return res.status(404).send('User not found');

    const user = result[0];
    bcrypt.compare(password, user.password, (err, match) => {
      if (err || !match) return res.status(401).send('Invalid credentials');
      const token = jwt.sign({ user_id: user.user_id, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token, user: { user_id: user.user_id, name: user.name, phone: user.phone, branch_id: user.branch_id } });
    });
  });
};

const logout = (req, res) => {
  // Note: JWT logout is client-side; server can't invalidate tokens directly without a blacklist
  res.send('Logged out. Please clear the token on the client side.');
  // For server-side logout, you'd need a token blacklist (e.g., using Redis), which is optional here
};

module.exports = { register, login, logout };