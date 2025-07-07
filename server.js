const express = require('express');
const app = express();
const cors = require('cors');
const cattleRoutes = require('./routes/cattleRoutes');
const userRoutes = require('./routes/userRoutes');
const alertRoutes = require('./routes/alertRoutes');
const authRoutes = require('./routes/authRoutes');
const branchRoutes = require('./routes/branchRoutes')

require('dotenv').config();

// Middleware
app.use(express.json());
app.use(cors());

app.use('/api/cattle', cattleRoutes);
app.use('/api/users',userRoutes);
app.use('/api/alerts',alertRoutes);
app.use('/api/auth',authRoutes);
app.use('/api/branches',branchRoutes);

// Routes (to be implemented)
app.get('/', (req, res) => res.send('Cattle Rustling Backend is running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});