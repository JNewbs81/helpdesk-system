// FILE: server/server.js
// DESCRIPTION: Main Express server with database connection and route configuration
// INSTRUCTIONS: Place this file in the server/ directory as server.js

// server.js - Main Express server setup
const express = require('express');
const cors = require('cors');
const sql = require('mssql');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // Use encryption for Azure SQL
        trustServerCertificate: false
    }
};

// Database connection pool
let pool;

async function initDB() {
    try {
        pool = await sql.connect(dbConfig);
        console.log('Connected to Azure SQL Database');
    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
}

// Routes
const ticketRoutes = require('./routes/tickets');
const customerRoutes = require('./routes/customers');
const technicianRoutes = require('./routes/technicians');
const categoryRoutes = require('./routes/categories');

app.use('/api/tickets', ticketRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/categories', categoryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});

module.exports = { pool };