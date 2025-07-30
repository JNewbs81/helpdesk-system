// routes/customers.js - Customer management endpoints
const express = require('express');
const sql = require('mssql');
const { pool } = require('../server');
const router = express.Router();

// GET /api/customers - Get all customers with pagination and search
router.get('/', async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT 
                customer_id,
                company_name,
                contact_name,
                email,
                phone,
                address,
                created_at,
                updated_at
            FROM Customers
            WHERE 1=1
        `;
        
        const request = pool.request();
        
        if (search) {
            query += ` AND (
                company_name LIKE @search OR 
                contact_name LIKE @search OR 
                email LIKE @search
            )`;
            request.input('search', sql.NVarChar, `%${search}%`);
        }
        
        query += ` ORDER BY company_name ASC 
                   OFFSET @offset ROWS 
                   FETCH NEXT @limit ROWS ONLY`;
                   
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, parseInt(limit));
        
        const result = await request.query(query);
        
        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM Customers WHERE 1=1';
        const countRequest = pool.request();
        
        if (search) {
            countQuery += ` AND (
                company_name LIKE @search OR 
                contact_name LIKE @search OR 
                email LIKE @search
            )`;
            countRequest.input('search', sql.NVarChar, `%${search}%`);
        }
        
        const countResult = await countRequest.query(countQuery);
        const total = countResult.recordset[0].total;
        
        res.json({
            customers: result.recordset,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Error fetching customers:', err);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// GET /api/customers/:id - Get specific customer with their tickets
router.get('/:id', async (req, res) => {
    try {
        const customerId = req.params.id;
        const request = pool.request();
        
        // Get customer details
        const customerQuery = `
            SELECT * FROM Customers 
            WHERE customer_id = @customerId
        `;
        
        request.input('customerId', sql.Int, customerId);
        const customerResult = await request.query(customerQuery);
        
        if (customerResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        // Get customer's tickets
        const ticketsQuery = `
            SELECT 
                t.ticket_id,
                t.ticket_number,
                t.title,
                t.status,
                t.priority,
                t.created_at,
                t.updated_at,
                tech.first_name + ' ' + tech.last_name as assigned_technician,
                cat.category_name
            FROM Tickets t
            LEFT JOIN Technicians tech ON t.assigned_technician_id = tech.technician_id
            LEFT JOIN Categories cat ON t.category_id = cat.category_id
            WHERE t.customer_id = @customerId
            ORDER BY t.created_at DESC
        `;
        
        const ticketsResult = await request.query(ticketsQuery);
        
        const customer = customerResult.recordset[0];
        customer.tickets = ticketsResult.recordset;
        
        res.json(customer);
    } catch (err) {
        console.error('Error fetching customer:', err);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

// POST /api/customers - Create new customer
router.post('/', async (req, res) => {
    try {
        const { company_name, contact_name, email, phone, address } = req.body;
        
        if (!company_name || !contact_name || !email) {
            return res.status(400).json({ error: 'Company name, contact name, and email are required' });
        }
        
        // Check if email already exists
        const emailCheckRequest = pool.request();
        emailCheckRequest.input('email', sql.NVarChar, email);
        const emailCheck = await emailCheckRequest.query('SELECT customer_id FROM Customers WHERE email = @email');
        
        if (emailCheck.recordset.length > 0) {
            return res.status(400).json({ error: 'Customer with this email already exists' });
        }
        
        const request = pool.request();
        
        const insertQuery = `
            INSERT INTO Customers (company_name, contact_name, email, phone, address)
            OUTPUT INSERTED.*
            VALUES (@company_name, @contact_name, @email, @phone, @address)
        `;
        
        request.input('company_name', sql.NVarChar, company_name);
        request.input('contact_name', sql.NVarChar, contact_name);
        request.input('email', sql.NVarChar, email);
        request.input('phone', sql.NVarChar, phone || null);
        request.input('address', sql.NVarChar, address || null);
        
        const result = await request.query(insertQuery);
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error('Error creating customer:', err);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', async (req, res) => {
    try {
        const customerId = req.params.id;
        const { company_name, contact_name, email, phone, address } = req.body;
        
        if (!company_name || !contact_name || !email) {
            return res.status(400).json({ error: 'Company name, contact name, and email are required' });
        }
        
        // Check if email already exists for another customer
        const emailCheckRequest = pool.request();
        emailCheckRequest.input('email', sql.NVarChar, email);
        emailCheckRequest.input('customerId', sql.Int, customerId);
        const emailCheck = await emailCheckRequest.query(
            'SELECT customer_id FROM Customers WHERE email = @email AND customer_id != @customerId'
        );
        
        if (emailCheck.recordset.length > 0) {
            return res.status(400).json({ error: 'Another customer with this email already exists' });
        }
        
        const request = pool.request();
        
        const updateQuery = `
            UPDATE Customers 
            SET 
                company_name = @company_name,
                contact_name = @contact_name,
                email = @email,
                phone = @phone,
                address = @address,
                updated_at = GETDATE()
            OUTPUT INSERTED.*
            WHERE customer_id = @customerId
        `;
        
        request.input('customerId', sql.Int, customerId);
        request.input('company_name', sql.NVarChar, company_name);
        request.input('contact_name', sql.NVarChar, contact_name);
        request.input('email', sql.NVarChar, email);
        request.input('phone', sql.NVarChar, phone || null);
        request.input('address', sql.NVarChar, address || null);
        
        const result = await request.query(updateQuery);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error updating customer:', err);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

// DELETE /api/customers/:id - Delete customer (only if no tickets exist)
router.delete('/:id', async (req, res) => {
    try {
        const customerId = req.params.id;
        const request = pool.request();
        
        // Check if customer has any tickets
        request.input('customerId', sql.Int, customerId);
        const ticketCheck = await request.query(
            'SELECT COUNT(*) as ticket_count FROM Tickets WHERE customer_id = @customerId'
        );
        
        if (ticketCheck.recordset[0].ticket_count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete customer with existing tickets. Please resolve or reassign tickets first.' 
            });
        }
        
        const deleteQuery = `
            DELETE FROM Customers 
            OUTPUT DELETED.*
            WHERE customer_id = @customerId
        `;
        
        const result = await request.query(deleteQuery);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        res.json({ message: 'Customer deleted successfully', customer: result.recordset[0] });
    } catch (err) {
        console.error('Error deleting customer:', err);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

// GET /api/customers/:id/tickets/stats - Get ticket statistics for a customer
router.get('/:id/tickets/stats', async (req, res) => {
    try {
        const customerId = req.params.id;
        const request = pool.request();
        
        const statsQuery = `
            SELECT 
                COUNT(*) as total_tickets,
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
                    END) as avg_resolution_time_hours
            FROM Tickets 
            WHERE customer_id = @customerId
        `;
        
        request.input('customerId', sql.Int, customerId);
        const result = await request.query(statsQuery);
        
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching customer stats:', err);
        res.status(500).json({ error: 'Failed to fetch customer statistics' });
    }
});

module.exports = router;