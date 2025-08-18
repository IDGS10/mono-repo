const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

const configPath = path.join(__dirname, '../config/.env');
dotenv.config({ path: configPath });  

console.log('DB_USER:', `"${process.env.DB_USER}"`);
console.log('DB_PASSWORD:', `"${process.env.DB_PASSWORD}"`);
console.log('DB_HOST:', `"${process.env.DB_HOST}"`);
console.log('DB_PORT:', `"${process.env.DB_PORT}"`);
console.log('DB_NAME:', `"${process.env.DB_NAME}"`);

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

client.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Connection error:', err.stack));

module.exports = client;
