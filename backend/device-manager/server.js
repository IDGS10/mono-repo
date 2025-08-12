const express = require('express');
const dotenv = require('dotenv');
const deviceRoutes = require('./api/apis');
const cors = require('cors');

dotenv.config();
const app = express();
app.use(express.json());

const corsOptions = {
  origin: [
    'http://localhost:5057',
    'http://127.0.0.1:5057',
    'http://127.0.0.1:3000',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use('/api', deviceRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
