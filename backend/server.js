const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');

const pool = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Calmia backend is running' });
});

app.use('/auth', authRoutes);

const PORT = process.env.PORT || 5000;

pool.query('SELECT NOW()')
  .then(() => {
    console.log('Connected to Neon database');
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});