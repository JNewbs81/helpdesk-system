// routes/technicians.js - Technician management endpoints
const express = require('express');
const sql = require('mssql');
const { pool } = require('../server');
const router = express.Router();

// GET /api/technicians/workload/summary - Get workload summary for all technicians
router.get('/workload/summary', async (req, res) => {
    try {
        const request = pool.request();
        
        const summaryQuery = `
            SELECT 
                t.technician_id,
                t.first_name + ' ' + t.last_name as technician_name,
                t.email,
                t.is_active,
                COUNT(tk.ticket_id) as total_assigned_tickets,
                COUNT(CASE WHEN tk.status NOT IN ('Resolved', 'Closed') THEN 1 END) as active_tickets,
                COUNT(CASE WHEN tk.priority = 'Critical' THEN 1 END) as critical_tickets,
                COUNT(CASE WHEN tk.priority = 'High' THEN 1 END) as high_priority_tickets,
                AVG(CASE 
                    WHEN tk.resolved_at IS NOT NULL 
                    THEN DATEDIFF(HOUR, tk.created_at, tk.resolved_at) 
                    END) as avg_resolution_time_hours
            FROM Technicians t
            LEFT JOIN Tickets tk ON t.technician_id = tk.assigned_technician_id
            WHERE t.is_active = 1
            GROUP BY t.technician_id, t.first_name, t.last_name, t.email, t.is_active
            ORDER BY active_tickets DESC, critical_tickets DESC, high_priority_tickets DESC
        `;
        
        const result = await request.query(summaryQuery);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching workload summary:', err);
        res.status(500).json({ error: 'Failed to fetch workload summary' });
    }
});

// GET /api/technicians - Get all technicians with pagination and search
router.get('/', async (req, res) => {
    try {
        const { search, active_only = 'true', page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT 
                technician_id,
                first_name,
                last_name,
                email,
                phone,
                is_active,
                created_at,
                updated_at
            FROM Technicians
            WHERE 1=1
        `;
        
        const request = pool.request();
        
        if (active_only === 'true') {
            query += ' AND is_active = 1';
        }
        
        if (search) {
            query += ` AND (
                first_name LIKE @search OR 
                last_name LIKE @search OR 
                email LIKE @search
            )`;
            request.input('search', sql.NVarChar, `%${search}%`);
        }
        
        query += ` ORDER BY first_name ASC, last_name ASC 
                   OFFSET @offset ROWS 
                   FETCH NEXT @limit ROWS ONLY`;
                   
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, parseInt(limit));
        
        const result = await request.query(query);
        
        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM Technicians WHERE 1=1';
        const countRequest = pool.request();
        
        if (active_only === 'true') {
            countQuery += ' AND is_active = 1';
        }
        
        if (search) {
            countQuery += ` AND (
                first_name LIKE @search OR 
                last_name LIKE @search OR 
                email LIKE @search
            )`;
            countRequest.input('search', sql.NVarChar, `%${search}%`);
        }
        
        const countResult = await countRequest.query(countQuery);
        const total = countResult.recordset[0].total;
        
        res.json({
            technicians: result.recordset,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Error fetching technicians:', err);
        res.status(500).json({ error: 'Failed to fetch technicians' });
    }
});

// GET /api/technicians/:id - Get specific technician with their assigned tickets
router.get('/:id', async (req, res) => {
    try {
        const technicianId = req.params.id;
        const request = pool.request();
        
        // Get technician details
        const technicianQuery = `
            SELECT * FROM Technicians 
            WHERE technician_id = @technicianId
        `;
        
        request.input('technicianId', sql.Int, technicianId);
        const technicianResult = await request.query(technicianQuery);
        
        if (technicianResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Technician not found' });
        }
        
        // Get technician's assigned tickets
        const ticketsQuery = `
            SELECT 
                t.ticket_id,
                t.ticket_number,
                t.title,
                t.status,
                t.priority,
                t.created_at,
                t.updated_at,
                c.company_name,
                c.contact_name,
                cat.category_name
            FROM Tickets t
            LEFT JOIN Customers c ON t.customer_id = c.customer_id
            LEFT JOIN Categories cat ON t.category_id = cat.category_id
            WHERE t.assigned_technician_id = @technicianId
            ORDER BY 
                CASE t.priority 
                    WHEN 'Critical' THEN 1
                    WHEN 'High' THEN 2
                    WHEN 'Medium' THEN 3
                    WHEN 'Low' THEN 4
                END,
                t.created_at ASC
        `;
        
        const ticketsResult = await request.query(ticketsQuery);
        
        const technician = technicianResult.recordset[0];
        technician.assigned_tickets = ticketsResult.recordset;
        
        res.json(technician);
    } catch (err) {
        console.error('Error fetching technician:', err);
        res.status(500).json({ error: 'Failed to fetch technician' });
    }
});

// POST /api/technicians - Create new technician
router.post('/', async (req, res) => {
    try {
        const { first_name, last_name, email, phone } = req.body;
        
        if (!first_name || !last_name || !email) {
            return res.status(400).json({ error: 'First name, last name, and email are required' });
        }
        
        // Check if email already exists
        const emailCheckRequest = pool.request();
        emailCheckRequest.input('email', sql.NVarChar, email);
        const emailCheck = await emailCheckRequest.query('SELECT technician_id FROM Technicians WHERE email = @email');
        
        if (emailCheck.recordset.length > 0) {
            return res.status(400).json({ error: 'Technician with this email already exists' });
        }
        
        const request = pool.request();
        
        const insertQuery = `
            INSERT INTO Technicians (first_name, last_name, email, phone)
            OUTPUT INSERTED.*
            VALUES (@first_name, @last_name, @email, @phone)
        `;
        
        request.input('first_name', sql.NVarChar, first_name);
        request.input('last_name', sql.NVarChar, last_name);
        request.input('email', sql.NVarChar, email);
        request.input('phone', sql.NVarChar, phone || null);
        
        const result = await request.query(insertQuery);
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error('Error creating technician:', err);
        res.status(500).json({ error: 'Failed to create technician' });
    }
});

// PUT /api/technicians/:id - Update technician
router.put('/:id', async (req, res) => {
    try {
        const technicianId = req.params.id;
        const { first_name, last_name, email, phone, is_active } = req.body;
        
        if (!first_name || !last_name || !email) {
            return res.status(400).json({ error: 'First name, last name, and email are required' });
        }
        
        // Check if email already exists for another technician
        const emailCheckRequest = pool.request();
        emailCheckRequest.input('email', sql.NVarChar, email);
        emailCheckRequest.input('technicianId', sql.Int, technicianId);
        const emailCheck = await emailCheckRequest.query(
            'SELECT technician_id FROM Technicians WHERE email = @email AND technician_id != @technicianId'
        );
        
        if (emailCheck.recordset.length > 0) {
            return res.status(400).json({ error: 'Another technician with this email already exists' });
        }
        
        const request = pool.request();
        
        const updateQuery = `
            UPDATE Technicians 
            SET 
                first_name = @first_name,
                last_name = @last_name,
                email = @email,
                phone = @phone,
                is_active = @is_active,
                updated_at = GETDATE()
            OUTPUT INSERTED.*
            WHERE technician_id = @technicianId
        `;
        
        request.input('technicianId', sql.Int, technicianId);
        request.input('first_name', sql.NVarChar, first_name);
        request.input('last_name', sql.NVarChar, last_name);
        request.input('email', sql.NVarChar, email);
        request.input('phone', sql.NVarChar, phone || null);
        request.input('is_active', sql.Bit, is_active !== undefined ? is_active : true);
        
        const result = await request.query(updateQuery);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Technician not found' });
        }
        
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error updating technician:', err);
        res.status(500).json({ error: 'Failed to update technician' });
    }
});

// DELETE /api/technicians/:id - Deactivate technician (don't actually delete)
router.delete('/:id', async (req, res) => {
    try {
        const technicianId = req.params.id;
        const request = pool.request();
        
        // Check if technician has any active tickets assigned
        request.input('technicianId', sql.Int, technicianId);
        const ticketCheck = await request.query(
            `SELECT COUNT(*) as active_ticket_count 
             FROM Tickets 
             WHERE assigned_technician_id = @technicianId 
             AND status NOT IN ('Resolved', 'Closed')`
        );
        
        if (ticketCheck.recordset[0].active_ticket_count > 0) {
            return res.status(400).json({ 
                error: 'Cannot deactivate technician with active tickets. Please reassign tickets first.',
                active_tickets: ticketCheck.recordset[0].active_ticket_count
            });
        }
        
        // Deactivate instead of delete
        const updateQuery = `
            UPDATE Technicians 
            SET is_active = 0, updated_at = GETDATE()
            OUTPUT INSERTED.*
            WHERE technician_id = @technicianId
        `;
        
        const result = await request.query(updateQuery);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Technician not found' });
        }
        
        res.json({ message: 'Technician deactivated successfully', technician: result.recordset[0] });
    } catch (err) {
        console.error('Error deactivating technician:', err);
        res.status(500).json({ error: 'Failed to deactivate technician' });
    }
});

// GET /api/technicians/:id/workload - Get technician's workload statistics
router.get('/:id/workload', async (req, res) => {
    try {
        const technicianId = req.params.id;
        const request = pool.request();
        
        const workloadQuery = `
            SELECT 
                COUNT(*) as total_assigned_tickets,
                COUNT(CASE WHEN status = 'New' THEN 1 END) as new_tickets,
                COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_tickets,
                COUNT(CASE WHEN status = 'Waiting for Customer' THEN 1 END) as waiting_tickets,
                COUNT(CASE WHEN status = 'Resolved' THEN 1 END) as resolved_tickets,
                COUNT(CASE WHEN status = 'Closed' THEN 1 END) as closed_tickets,
                COUNT(CASE WHEN priority = 'Critical' THEN 1 END) as critical_tickets,
                COUNT(CASE WHEN priority = 'High' THEN 1 END) as high_priority_tickets,
                AVG(CASE 
                    WHEN resolved_at IS NOT NULL 
                    THEN DATEDIFF(HOUR, created_at, resolved_at) 
                    END) as avg_resolution_time_hours,
                COUNT(CASE WHEN status NOT IN ('Resolved', 'Closed') THEN 1 END) as active_tickets
            FROM Tickets 
            WHERE assigned_technician_id = @technicianId
        `;
        
        request.input('technicianId', sql.Int, technicianId);
        const result = await request.query(workloadQuery);
        
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching technician workload:', err);
        res.status(500).json({ error: 'Failed to fetch technician workload' });
    }
});

module.exports = router;