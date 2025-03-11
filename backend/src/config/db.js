const { Pool } = require('pg');

const pool = new Pool({
  user: 'your-username', // Reemplaza con tu usuario de PostgreSQL
  host: 'your-host', // Reemplaza con tu host de PostgreSQL
  database: 'your-database', // Reemplaza con tu nombre de base de datos
  password: 'your-password', // Reemplaza con tu contraseña de PostgreSQL
  port: 5432, // Puerto por defecto de PostgreSQL
});

pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database');
});

module.exports = pool;