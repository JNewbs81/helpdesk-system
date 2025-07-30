-- FILE: database/schema.sql
-- DESCRIPTION: Complete database schema for IT Helpdesk Management System
-- INSTRUCTIONS: Run this script in your Azure SQL Database to create all tables, indexes, and initial data

-- Ticket Management System Database Schema

-- Customers table
CREATE TABLE Customers (
    customer_id INT IDENTITY(1,1) PRIMARY KEY,
    company_name NVARCHAR(255) NOT NULL,
    contact_name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    phone NVARCHAR(50),
    address NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Technicians table
CREATE TABLE Technicians (
    technician_id INT IDENTITY(1,1) PRIMARY KEY,
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    phone NVARCHAR(50),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Categories table
CREATE TABLE Categories (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    category_name NVARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(500),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Tickets table
CREATE TABLE Tickets (
    ticket_id INT IDENTITY(1,1) PRIMARY KEY,
    ticket_number NVARCHAR(20) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    assigned_technician_id INT,
    category_id INT,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    priority NVARCHAR(20) NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status NVARCHAR(20) NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'Waiting for Customer', 'Resolved', 'Closed')),
    resolution_notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    resolved_at DATETIME2,
    closed_at DATETIME2,
    
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
    FOREIGN KEY (assigned_technician_id) REFERENCES Technicians(technician_id),
    FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);

-- Ticket Comments table for internal notes and communication
CREATE TABLE TicketComments (
    comment_id INT IDENTITY(1,1) PRIMARY KEY,
    ticket_id INT NOT NULL,
    technician_id INT NOT NULL,
    comment_text NVARCHAR(MAX) NOT NULL,
    is_internal BIT DEFAULT 1, -- 1 for internal notes, 0 for customer-visible
    created_at DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (ticket_id) REFERENCES Tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES Technicians(technician_id)
);

-- Ticket Attachments table
CREATE TABLE TicketAttachments (
    attachment_id INT IDENTITY(1,1) PRIMARY KEY,
    ticket_id INT NOT NULL,
    file_name NVARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type NVARCHAR(100),
    azure_blob_url NVARCHAR(500) NOT NULL,
    uploaded_by_technician_id INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (ticket_id) REFERENCES Tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_technician_id) REFERENCES Technicians(technician_id)
);

-- Insert default categories
INSERT INTO Categories (category_name, description) VALUES
('Hardware', 'Hardware-related issues and requests'),
('Software', 'Software installation, configuration, and troubleshooting'),
('Network', 'Network connectivity and infrastructure issues'),
('Email', 'Email setup, configuration, and issues'),
('Security', 'Security-related concerns and incidents'),
('General Support', 'General IT support and questions');

-- Create indexes for better performance
CREATE INDEX IX_Tickets_Status ON Tickets(status);
CREATE INDEX IX_Tickets_Priority ON Tickets(priority);
CREATE INDEX IX_Tickets_CustomerID ON Tickets(customer_id);
CREATE INDEX IX_Tickets_TechnicianID ON Tickets(assigned_technician_id);
CREATE INDEX IX_Tickets_CreatedAt ON Tickets(created_at);
CREATE INDEX IX_TicketComments_TicketID ON TicketComments(ticket_id);

-- Function to generate ticket numbers
CREATE FUNCTION dbo.GenerateTicketNumber()
RETURNS NVARCHAR(20)
AS
BEGIN
    DECLARE @Year NVARCHAR(4) = CAST(YEAR(GETDATE()) AS NVARCHAR(4))
    DECLARE @LastTicketNum INT
    
    SELECT @LastTicketNum = ISNULL(MAX(CAST(SUBSTRING(ticket_number, 6, LEN(ticket_number)) AS INT)), 0)
    FROM Tickets 
    WHERE ticket_number LIKE @Year + '-%'
    
    RETURN @Year + '-' + FORMAT(@LastTicketNum + 1, '000000')
END