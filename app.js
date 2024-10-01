const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db1'); // Import the pool from your db1.js file
const cors = require('cors'); // Import CORS

const app = express();
app.use(cors()); // Use CORS middleware
app.use(express.json()); // Middleware to parse JSON request bodies

// Get all users
app.get('/users', (req, res) => {
    const query = 'SELECT * FROM login'; // Query to fetch all data

    pool.query(query, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        return res.json(result); // Send the result as a response
    });
});

// Login API
app.post('/login', (req, res) => {
    const { username, password } = req.body; // Capture username and password from request
    console.log('Received:', { username, password }); // Log incoming data

    const query = 'SELECT * FROM login WHERE USERNAME = ?'; // Query user from MySQL by USERNAME
    pool.query(query, [username], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.length === 0) {
            console.log('User not found.'); // Log if user not found
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = result[0]; // Fetch user data from the query result
        console.log('Found User:', user); // Log found user

        // Compare hashed password
        bcrypt.compare(password, user.PASSWORD, (err, match) => {
            if (err) {
                console.error('Password comparison error:', err);
                return res.status(500).json({ error: 'Password comparison error' });
            }
            if (!match) {
                console.log('Password does not match.'); // Log if passwords do not match
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            // Generate JWT token
            const token = jwt.sign({ userId: user.ID, username: user.USERNAME }, 'your_jwt_secret', { expiresIn: '1h' });
            return res.json({ message: 'Login successful', token });
        });
    });
});

// Update user password: PATCH by username
app.patch('/users/reset-password', (req, res) => {
    const { username, password } = req.body;

    // Hash the new password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).json({ error: 'Hashing error' });
        }

        // Query to update the user's password by username
        const query = 'UPDATE login SET PASSWORD = ? WHERE USERNAME = ?';
        pool.query(query, [hashedPassword, username], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.json({ message: 'Password updated successfully' });
        });
    });
});


// Delete user by username
app.delete('/users/:username', (req, res) => {
    const username = req.params.username; // Get username from request parameters

    // Query to delete the user by username
    const query = 'DELETE FROM login WHERE USERNAME = ?';
    pool.query(query, [username], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({ message: 'User deleted successfully' });
    });
});

// Registration API
app.post('/register', (req, res) => {
    const { username, password } = req.body;
  
    // First, hash the password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ error: 'Hashing error' });
      }
  
      // Insert the new user into the database
      const query = 'INSERT INTO login (USERNAME, PASSWORD) VALUES (?, ?)';
      pool.query(query, [username, hashedPassword], (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }
  
        // Return a success message
        return res.status(201).json({ message: 'User registered successfully' });
      });
    });
  });
  

// Start the server
const port = 8000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
