const sql = require('mssql');

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

module.exports = async function (context, req) {
    context.log('Tickets API function processed a request.');

    const method = req.method.toLowerCase();
    
    try {
        await sql.connect(config);
        
        switch (method) {
            case 'get':
                return await getTickets(context, req);
            case 'post':
                return await createTicket(context, req);
            default:
                context.res = {
                    status: 405,
                    body: { error: 'Method not allowed' }
                };
        }
    } catch (error) {
        context.log.error('Database error:', error);
        context.res = {
            status: 500,
            body: { error: 'Internal server error' }
        };
    } finally {
        await sql.close();
    }
};

async function getTickets(context, req) {
    const request = new sql.Request();
    const result = await request.query(`
        SELECT 
            t.ticket_id,
            t.ticket_number,
            t.title,
            t.description,
            t.status,
            t.priority,
            t.created_at,
            t.updated_at,
            c.first_name + ' ' + c.last_name as customer_name,
            cat.name as category_name,
            tech.first_name + ' ' + tech.last_name as technician_name
        FROM Tickets t
        LEFT JOIN Customers c ON t.customer_id = c.customer_id
        LEFT JOIN Categories cat ON t.category_id = cat.category_id
        LEFT JOIN Technicians tech ON t.technician_id = tech.technician_id
        ORDER BY t.created_at DESC
    `);
    
    context.res = {
        status: 200,
        body: result.recordset
    };
}

async function createTicket(context, req) {
    const { title, description, priority, customer_id, category_id } = req.body;
    
    if (!title || !description || !customer_id) {
        context.res = {
            status: 400,
            body: { error: 'Missing required fields' }
        };
        return;
    }
    
    const request = new sql.Request();
    request.input('title', sql.NVarChar, title);
    request.input('description', sql.NText, description);
    request.input('priority', sql.NVarChar, priority || 'Medium');
    request.input('customer_id', sql.Int, customer_id);
    request.input('category_id', sql.Int, category_id);
    
    const result = await request.query(`
        INSERT INTO Tickets (title, description, priority, customer_id, category_id, status)
        OUTPUT INSERTED.ticket_id, INSERTED.ticket_number
        VALUES (@title, @description, @priority, @customer_id, @category_id, 'Open')
    `);
    
    context.res = {
        status: 201,
        body: result.recordset[0]
    };
}