// db.js
const { createPool } = require('mysql2');

// Create a connection pool
const pool = createPool({
  host: "localhost",
  user: "root",
  password: "Pragati@123",  // Make sure this is secure in production
  database: "db",
  connectionLimit: 10
});

// Test the connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to the MySQL database");
  connection.release();  // Release the connection back to the pool
});

// Export the pool
module.exports = pool;
