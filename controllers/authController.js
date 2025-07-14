const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

// const register = (req, res) => {
//   const { name, phone, password, branch_id } = req.body;
//   if (!name || !phone || !password) return res.status(400).send('All fields are required');

//   bcrypt.hash(password, 10, (err, hash) => {
//     if (err) return res.status(500).send(err);
//     db.query('INSERT INTO users (name, phone, password, branch_id) VALUES (?, ?, ?, ?)', 
//       [name, phone, hash, branch_id], (err, result) => {
//         if (err) return res.status(500).send(err);
//         res.status(201).json({ user_id: result.insertId, name, phone, branch_id });
//       });
//   });
// };


const register = async (req, res) => {
  const { name, phone, password, branch_id } = req.body;
  if (!name || !phone || !password) return res.status(400).send('All fields are required');

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.execute('INSERT INTO users (name, phone, password, branch_id) VALUES (?, ?, ?, ?)', 
      [name, phone, hash, branch_id]);
    res.status(201).json({ user_id: result.insertId, name, phone, branch_id });
  } catch (err) {
    res.status(500).send(err);
  }
};

// const login = (req, res) => {
//   const { phone, password } = req.body;
//   if (!phone || !password) return res.status(400).send('Phone and password are required');

//   db.query('SELECT user_id, name, phone, password, branch_id FROM users WHERE phone = ?', [phone], (err, result) => {
//     if (err) return res.status(500).send(err);
//     if (!result.length) return res.status(404).send('User not found');

//     const user = result[0];
//     bcrypt.compare(password, user.password, (err, match) => {
//       if (err || !match) return res.status(401).send('Invalid credentials');
//       const token = jwt.sign({ user_id: user.user_id, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '1h' });
//       res.json({ token, user: { user_id: user.user_id, name: user.name, phone: user.phone, branch_id: user.branch_id } });
//     });
//   });
// };

const login = async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).send('Phone and password are required');

  try {
    const [result] = await db.execute('SELECT user_id, name, phone, password, branch_id FROM users WHERE phone = ?', [phone]);
    if (!result.length) return res.status(404).send('User not found');

    const user = result[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).send('Invalid credentials');
    const token = jwt.sign({ user_id: user.user_id, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { user_id: user.user_id, name: user.name, phone: user.phone, branch_id: user.branch_id } });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const logout = (req, res) => {
  // Note: JWT logout is client-side; server can't invalidate tokens directly without a blacklist
  res.send('Logged out. Please clear the token on the client side.');
  // For server-side logout, you'd need a token blacklist (e.g., using Redis), which is optional here
};

const verify = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('No token provided');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [result] = await db.execute(
      'SELECT user_id, name, phone, branch_id FROM users WHERE user_id = ?',
      [decoded.user_id]
    );
    if (!result.length) return res.status(404).send('User not found');
    res.json({ user: result[0] });
  } catch (err) {
    res.status(401).send('Invalid token');
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const { user_id } = req.user;

  if (!currentPassword || !newPassword) {
    return res.status(400).send('Current and new password are required');
  }

  try {
    // Get current password hash
    const [result] = await db.execute('SELECT password FROM users WHERE user_id = ?', [user_id]);
    if (!result.length) return res.status(404).send('User not found');

    // Verify current password
    const match = await bcrypt.compare(currentPassword, result[0].password);
    if (!match) return res.status(401).send('Current password is incorrect');

    // Hash new password
    const hash = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await db.execute('UPDATE users SET password = ? WHERE user_id = ?', [hash, user_id]);
    
    res.send('Password changed successfully');
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = { register, login, logout, verify, changePassword };