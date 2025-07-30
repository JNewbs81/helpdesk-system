// routes/categories.js - Category management endpoints
const express = require('express');
const sql = require('mssql');
const { pool } = require('../server');
const router = express.Router();

// GET /api/categories/stats/overview - Get overview statistics for all categories
router.get('/stats/overview', async (req, res) => {
    try {
        const request = pool.request();
        
        const statsQuery = `
            SELECT 
                c.category_id,
                c.category_name,
                c.is_active,
                COUNT(t.ticket_id) as total_tickets,
                COUNT(CASE WHEN t.status NOT IN ('Resolved', 'Closed') THEN 1 END) as active_tickets,
                COUNT(CASE WHEN t.priority = 'Critical' THEN 1 END) as critical_tickets,
                COUNT(CASE WHEN t.priority = 'High' THEN 1 END) as high_priority_tickets,
                AVG(CASE 
                    WHEN t.resolved_at IS NOT NULL 
                    THEN DATEDIFF(HOUR, t.created_at, t.resolved_at) 
                    END) as avg_resolution_time_hours
            FROM Categories c
            LEFT JOIN Tickets t ON c.category_id = t.category_id
            WHERE c.is_active = 1
            GROUP BY c.category_id, c.category_name, c.is_active
            ORDER BY total_tickets DESC
        `;
        
        const result = await request.query(statsQuery);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching category statistics:', err);
        res.status(500).json({ error: 'Failed to fetch category statistics' });
    }
});

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
    try {
        const { active_only = 'true' } = req.query;
        
        let query = `
            SELECT 
                category_id,
                category_name,
                description,
                is_active,
                created_at
            FROM Categories
            WHERE 1=1
        `;
        
        const request = pool.request();
        
        if (active_only === 'true') {
            query += ' AND is_active = 1';
        }
        
        query += ' ORDER BY category_name ASC';
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// GET /api/categories/:id - Get specific category with ticket stats
router.get('/:id', async (req, res) => {
    try {
        const categoryId = req.params.id;
        const request = pool.request();
        
        // Get category details
        const categoryQuery = `
            SELECT * FROM Categories 
            WHERE category_id = @categoryId
        `;
        
        request.input('categoryId', sql.Int, categoryId);
        const categoryResult = await request.query(categoryQuery);
        
        if (categoryResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        // Get ticket statistics for this category
        const statsQuery = `
            SELECT 
                COUNT(*) as total_tickets,
                COUNT(CASE WHEN status = 'New' THEN 1 END) as new_tickets,
                COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_tickets,
                COUNT(CASE WHEN status = 'Waiting for Customer' THEN 1 END) as waiting_tickets,
                COUNT(CASE WHEN status = 'Resolved' THEN 1 END) as resolved_tickets,
                COUNT(CASE WHEN status = 'Closed' THEN 1 END) as closed_tickets,
                AVG(CASE 
                    WHEN resolved_at IS NOT NULL 
                    THEN DATEDIFF(HOUR, created_at, resolved_at) 
                    END) as avg_resolution_time_hours
            FROM Tickets 
            WHERE category_id = @categoryId
        `;
        
        const statsResult = await request.query(statsQuery);
        
        const category = categoryResult.recordset[0];
        category.ticket_stats = statsResult.recordset[0];
        
        res.json(category);
    } catch (err) {
        console.error('Error fetching category:', err);
        res.status(500).json({ error: 'Failed to fetch category' });
    }
});

// POST /api/categories - Create new category
router.post('/', async (req, res) => {
    try {
        const { category_name, description } = req.body;
        
        if (!category_name) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        
        // Check if category name already exists
        const nameCheckRequest = pool.request();
        nameCheckRequest.input('category_name', sql.NVarChar, category_name);
        const nameCheck = await nameCheckRequest.query('SELECT category_id FROM Categories WHERE category_name = @category_name');
        
        if (nameCheck.recordset.length > 0) {
            return res.status(400).json({ error: 'Category with this name already exists' });
        }
        
        const request = pool.request();
        
        const insertQuery = `
            INSERT INTO Categories (category_name, description)
            OUTPUT INSERTED.*
            VALUES (@category_name, @description)
        `;
        
        request.input('category_name', sql.NVarChar, category_name);
        request.input('description', sql.NVarChar, description || null);
        
        const result = await request.query(insertQuery);
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error('Error creating category:', err);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// PUT /api/categories/:id - Update category
router.put('/:id', async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { category_name, description, is_active } = req.body;
        
        if (!category_name) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        
        // Check if category name already exists for another category
        const nameCheckRequest = pool.request();
        nameCheckRequest.input('category_name', sql.NVarChar, category_name);
        nameCheckRequest.input('categoryId', sql.Int, categoryId);
        const nameCheck = await nameCheckRequest.query(
            'SELECT category_id FROM Categories WHERE category_name = @category_name AND category_id != @categoryId'
        );
        
        if (nameCheck.recordset.length > 0) {
            return res.status(400).json({ error: 'Another category with this name already exists' });
        }
        
        const request = pool.request();
        
        const updateQuery = `
            UPDATE Categories 
            SET 
                category_name = @category_name,
                description = @description,
                is_active = @is_active
            OUTPUT INSERTED.*
            WHERE category_id = @categoryId
        `;
        
        request.input('categoryId', sql.Int, categoryId);
        request.input('category_name', sql.NVarChar, category_name);
        request.input('description', sql.NVarChar, description || null);
        request.input('is_active', sql.Bit, is_active !== undefined ? is_active : true);
        
        const result = await request.query(updateQuery);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error updating category:', err);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// DELETE /api/categories/:id - Deactivate category (don't actually delete if tickets exist)
router.delete('/:id', async (req, res) => {
    try {
        const categoryId = req.params.id;
        const request = pool.request();
        
        // Check if category has any tickets
        request.input('categoryId', sql.Int, categoryId);
        const ticketCheck = await request.query(
            'SELECT COUNT(*) as ticket_count FROM Tickets WHERE category_id = @categoryId'
        );
        
        if (ticketCheck.recordset[0].ticket_count > 0) {
            // Deactivate instead of delete if tickets exist
            const updateQuery = `
                UPDATE Categories 
                SET is_active = 0
                OUTPUT INSERTED.*
                WHERE category_id = @categoryId
            `;
            
            const result = await request.query(updateQuery);
            
            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'Category not found' });
            }
            
            return res.json({ 
                message: 'Category deactivated successfully (cannot delete due to existing tickets)', 
                category: result.recordset[0] 
            });
        } else {
            // Actually delete if no tickets exist
            const deleteQuery = `
                DELETE FROM Categories 
                OUTPUT DELETED.*
                WHERE category_id = @categoryId
            `;
            
            const result = await request.query(deleteQuery);
            
            if (result.recordset.length === 0) {
                return res.status(404).json({ error: 'Category not found' });
            }
            
            res.json({ message: 'Category deleted successfully', category: result.recordset[0] });
        }
    } catch (err) {
        console.error('Error deleting category:', err);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

module.exports = router;