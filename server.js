const express = require('express');
const app = express();
const cors = require('cors');
const cattleRoutes = require('./routes/cattleRoutes');
require('dotenv').config();

// Middleware
app.use(express.json());
app.use(cors());

app.use('/api/cattle', cattleRoutes);

// Routes (to be implemented)
app.get('/', (req, res) => res.send('Cattle Rustling Backend is running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});