// routes/tickets.js - Ticket management endpoints
const express = require('express');
const sql = require('mssql');
const { pool } = require('../server');
const router = express.Router();

// GET /api/tickets - Get all tickets with filtering and pagination
router.get('/', async (req, res) => {
    try {
        const { status, priority, customer_id, technician_id, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT 
                t.ticket_id,
                t.ticket_number,
                t.title,
                t.description,
                t.priority,
                t.status,
                t.created_at,
                t.updated_at,
                t.resolved_at,
                c.company_name,
                c.contact_name,
                c.email as customer_email,
                tech.first_name + ' ' + tech.last_name as assigned_technician,
                cat.category_name
            FROM Tickets t
            LEFT JOIN Customers c ON t.customer_id = c.customer_id
            LEFT JOIN Technicians tech ON t.assigned_technician_id = tech.technician_id
            LEFT JOIN Categories cat ON t.category_id = cat.category_id
            WHERE 1=1
        `;
        
        const request = pool.request();
        
        if (status) {
            query += ' AND t.status = @status';
            request.input('status', sql.NVarChar, status);
        }
        if (priority) {
            query += ' AND t.priority = @priority';
            request.input('priority', sql.NVarChar, priority);
        }
        if (customer_id) {
            query += ' AND t.customer_id = @customer_id';
            request.input('customer_id', sql.Int, customer_id);
        }
        if (technician_id) {
            query += ' AND t.assigned_technician_id = @technician_id';
            request.input('technician_id', sql.Int, technician_id);
        }
        
        query += ' ORDER BY t.created_at DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, parseInt(limit));
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching tickets:', err);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

// GET /api/tickets/:id - Get specific ticket with comments
router.get('/:id', async (req, res) => {
    try {
        const ticketId = req.params.id;
        const request = pool.request();
        
        // Get ticket details
        const ticketQuery = `
            SELECT 
                t.*,
                c.company_name,
                c.contact_name,
                c.email as customer_email,
                c.phone as customer_phone,
                tech.first_name + ' ' + tech.last_name as assigned_technician,
                cat.category_name
            FROM Tickets t
            LEFT JOIN Customers c ON t.customer_id = c.customer_id
            LEFT JOIN Technicians tech ON t.assigned_technician_id = tech.technician_id
            LEFT JOIN Categories cat ON t.category_id = cat.category_id
            WHERE t.ticket_id = @ticketId
        `;
        
        request.input('ticketId', sql.Int, ticketId);
        const ticketResult = await request.query(ticketQuery);
        
        if (ticketResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        // Get comments
        const commentsQuery = `
            SELECT 
                tc.*,
                t.first_name + ' ' + t.last_name as technician_name
            FROM TicketComments tc
            LEFT JOIN Technicians t ON tc.technician_id = t.technician_id
            WHERE tc.ticket_id = @ticketId
            ORDER BY tc.created_at ASC
        `;
        
        const commentsResult = await request.query(commentsQuery);
        
        // Get attachments
        const attachmentsQuery = `
            SELECT * FROM TicketAttachments 
            WHERE ticket_id = @ticketId
            ORDER BY created_at ASC
        `;
        
        const attachmentsResult = await request.query(attachmentsQuery);
        
        const ticket = ticketResult.recordset[0];
        ticket.comments = commentsResult.recordset;
        ticket.attachments = attachmentsResult.recordset;
        
        res.json(ticket);
    } catch (err) {
        console.error('Error fetching ticket:', err);
        res.status(500).json({ error: 'Failed to fetch ticket' });
    }
});

// POST /api/tickets - Create new ticket
router.post('/', async (req, res) => {
    try {
        const { customer_id, title, description, priority, category_id } = req.body;
        
        if (!customer_id || !title || !description || !priority) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const request = pool.request();
        
        // Generate ticket number using the function
        const ticketNumberQuery = 'SELECT dbo.GenerateTicketNumber() as ticket_number';
        const ticketNumberResult = await request.query(ticketNumberQuery);
        const ticketNumber = ticketNumberResult.recordset[0].ticket_number;
        
        const insertQuery = `
            INSERT INTO Tickets (ticket_number, customer_id, title, description, priority, category_id)
            OUTPUT INSERTED.*
            VALUES (@ticketNumber, @customer_id, @title, @description, @priority, @category_id)
        `;
        
        request.input('ticketNumber', sql.NVarChar, ticketNumber);
        request.input('customer_id', sql.Int, customer_id);
        request.input('title', sql.NVarChar, title);
        request.input('description', sql.NVarChar, description);
        request.input('priority', sql.NVarChar, priority);
        request.input('category_id', sql.Int, category_id);
        
        const result = await request.query(insertQuery);
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error('Error creating ticket:', err);
        res.status(500).json({ error: 'Failed to create ticket' });
    }
});

// PUT /api/tickets/:id - Update ticket
router.put('/:id', async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { assigned_technician_id, status, priority, resolution_notes, category_id } = req.body;
        
        const request = pool.request();
        
        let updateQuery = 'UPDATE Tickets SET updated_at = GETDATE()';
        const updates = [];
        
        if (assigned_technician_id !== undefined) {
            updates.push('assigned_technician_id = @assigned_technician_id');
            request.input('assigned_technician_id', sql.Int, assigned_technician_id);
        }
        if (status) {
            updates.push('status = @status');
            request.input('status', sql.NVarChar, status);
            
            if (status === 'Resolved') {
                updates.push('resolved_at = GETDATE()');
            } else if (status === 'Closed') {
                updates.push('closed_at = GETDATE()');
            }
        }
        if (priority) {
            updates.push('priority = @priority');
            request.input('priority', sql.NVarChar, priority);
        }
        if (resolution_notes) {
            updates.push('resolution_notes = @resolution_notes');
            request.input('resolution_notes', sql.NVarChar, resolution_notes);
        }
        if (category_id) {
            updates.push('category_id = @category_id');
            request.input('category_id', sql.Int, category_id);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        updateQuery += ', ' + updates.join(', ');
        updateQuery += ' OUTPUT INSERTED.* WHERE ticket_id = @ticketId';
        
        request.input('ticketId', sql.Int, ticketId);
        
        const result = await request.query(updateQuery);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error updating ticket:', err);
        res.status(500).json({ error: 'Failed to update ticket' });
    }
});

// POST /api/tickets/:id/comments - Add comment to ticket
router.post('/:id/comments', async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { technician_id, comment_text, is_internal = true } = req.body;
        
        if (!technician_id || !comment_text) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const request = pool.request();
        
        const insertQuery = `
            INSERT INTO TicketComments (ticket_id, technician_id, comment_text, is_internal)
            OUTPUT INSERTED.*
            VALUES (@ticketId, @technician_id, @comment_text, @is_internal)
        `;
        
        request.input('ticketId', sql.Int, ticketId);
        request.input('technician_id', sql.Int, technician_id);
        request.input('comment_text', sql.NVarChar, comment_text);
        request.input('is_internal', sql.Bit, is_internal);
        
        const result = await request.query(insertQuery);
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

module.exports = router;