# IT Helpdesk Management System

A comprehensive ticketing system built with Node.js, React, and Azure SQL Database for managing IT support operations.

## 🚀 Features

### Customer Portal
- Submit and track support tickets
- View ticket history and status updates
- Real-time ticket statistics dashboard
- Priority-based ticket submission
- Category-based organization

### Technician Dashboard
- Manage all support tickets
- Assign tickets to team members
- Add internal comments and customer communications
- Update ticket status and priority
- Track team workload and performance

### Admin Features
- Complete customer management
- Technician management and workload tracking
- Category management for ticket organization
- Performance analytics and reporting
- Comprehensive API with full CRUD operations

## 📋 Prerequisites

- Node.js (v14 or higher)
- Azure SQL Database
- npm or yarn package manager

## ⚡ Quick Start

### 1. Database Setup

1. Create an Azure SQL Database
2. Run the database schema:
   ```sql
   -- Execute the contents of database/schema.sql in your Azure SQL Database
   ```

### 2. Backend Setup

```bash
cd server
npm install
cp env.example .env
# Edit .env with your Azure SQL Database credentials
npm run dev
```

### 3. Frontend Setup

```bash
cd client
npm install
npm install @tailwindcss/forms
npm start
```

### 4. Environment Configuration

Edit `server/.env` with your Azure SQL Database credentials:

```env
# Database Configuration
DB_SERVER=your-azure-sql-server.database.windows.net
DB_NAME=helpdesk_db
DB_USER=your-username
DB_PASSWORD=your-password

# Server Configuration
PORT=3001
NODE_ENV=development
```

## 🏗️ Project Structure

```
helpdesk-system/
├── database/
│   └── schema.sql                 # Database schema and initial data
├── server/                        # Node.js Backend API
│   ├── routes/
│   │   ├── tickets.js            # Ticket management endpoints
│   │   ├── customers.js          # Customer management endpoints
│   │   ├── technicians.js        # Technician management endpoints
│   │   └── categories.js         # Category management endpoints
│   ├── server.js                 # Main Express server
│   ├── package.json              # Node.js dependencies
│   └── .env.example              # Environment variables template
├── client/                       # React Frontend
│   ├── public/
│   │   └── index.html            # HTML template
│   ├── src/
│   │   ├── components/
│   │   │   ├── ClientPortal.js   # Customer ticket interface
│   │   │   └── TechnicianDashboard.js # Internal support interface
│   │   ├── services/
│   │   │   └── api.js            # API service layer
│   │   ├── App.js                # Main React application
│   │   ├── index.js              # React entry point
│   │   └── index.css             # Global styles
│   ├── package.json              # React dependencies
│   └── tailwind.config.js        # Tailwind CSS configuration
└── README.md                     # Project documentation
```

## 🔧 API Endpoints

### Base URL: `http://localhost:3001/api`

### Tickets
- `GET /tickets` - List tickets with filtering
- `GET /tickets/:id` - Get specific ticket with comments
- `POST /tickets` - Create new ticket
- `PUT /tickets/:id` - Update ticket
- `POST /tickets/:id/comments` - Add comment to ticket

### Customers
- `GET /customers` - List customers with search and pagination
- `GET /customers/:id` - Get customer with their tickets
- `POST /customers` - Create new customer
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer
- `GET /customers/:id/tickets/stats` - Get ticket statistics

### Technicians
- `GET /technicians` - List technicians
- `GET /technicians/:id` - Get technician with assigned tickets
- `POST /technicians` - Create new technician
- `PUT /technicians/:id` - Update technician
- `DELETE /technicians/:id` - Deactivate technician
- `GET /technicians/workload/summary` - Get workload summary

### Categories
- `GET /categories` - List all categories
- `GET /categories/:id` - Get category with ticket stats
- `POST /categories` - Create new category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete/deactivate category

## 🎯 Usage

### Running Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
# Server runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
# Client runs on http://localhost:3000
```

### Building for Production

**Backend:**
```bash
cd server
npm start
```

**Frontend:**
```bash
cd client
npm run build
```

## 💾 Database Schema

The system uses Azure SQL Database with the following main tables:

- **Customers** - Client companies and contacts
- **Technicians** - IT support staff
- **Categories** - Ticket categorization (Hardware, Software, Network, etc.)
- **Tickets** - Main support tickets with relationships
- **TicketComments** - Internal notes and communication
- **TicketAttachments** - File attachments (Azure Blob Storage URLs)

### Key Features:
- Automatic ticket number generation (YYYY-XXXXXX format)
- Soft deletes for technicians and categories
- Comprehensive indexing for performance
- Referential integrity with foreign keys
- Audit fields (created_at, updated_at)

## 🎨 Technology Stack

### Backend
- **Node.js** with Express.js
- **Azure SQL Database** for data storage
- **MSSQL** driver for database connectivity
- **CORS** for cross-origin requests
- **dotenv** for environment configuration

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **React Query** for server state management
- **Axios** for HTTP requests
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Hook Form** for form handling

### Development Tools
- **Nodemon** for backend auto-restart
- **PostCSS** and **Autoprefixer** for CSS processing
- **ESLint** for code linting

## 🔍 Features Detail

### Client Portal
- **Ticket Submission**: Create new support requests with priority and category
- **Ticket Tracking**: View all tickets with real-time status updates
- **Statistics Dashboard**: Visual overview of ticket metrics by status
- **Advanced Filtering**: Filter by status, priority, and search terms
- **Customer Selection**: Multi-customer support for testing

### Technician Dashboard
- **Ticket Management**: View and manage all support tickets
- **Assignment System**: Assign tickets to technicians
- **Status Updates**: Change ticket status, priority, and add resolution notes
- **Comment System**: Add internal notes and customer communications
- **Workload Tracking**: View team workload distribution and performance
- **Advanced Filtering**: Filter by technician, status, priority

### System Administration
- **Customer Management**: Full CRUD operations for customer accounts
- **Technician Management**: Staff management with performance tracking
- **Category Management**: Organize tickets with custom categories
- **Analytics**: Performance metrics and insights

## 🛠️ Development

### Adding New Features

1. **Backend**: Add new routes in `server/routes/`
2. **Frontend**: Create new components in `client/src/components/`
3. **API**: Update API service layer in `client/src/services/api.js`
4. **Database**: Add new tables/columns in `database/schema.sql`

### Code Structure

- **Components**: Functional React components with hooks
- **State Management**: React Query for server state, useState for local state
- **Styling**: Tailwind CSS classes with custom component styles
- **Error Handling**: Centralized error handling in API interceptors

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify Azure SQL Database credentials in `.env`
   - Check firewall rules allow your IP address
   - Ensure database exists and is accessible

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill existing Node.js processes: `pkill node`

3. **Module Not Found Errors**
   - Run `npm install` in both server and client directories
   - Check all route files are in correct locations

4. **React Build Errors**
   - Ensure all dependencies are installed: `npm install`
   - Check that Tailwind CSS is properly configured
   - Verify import paths are correct

5. **API Connection Issues**
   - Ensure backend server is running on port 3001
   - Check proxy configuration in `client/package.json`
   - Verify API base URL in `services/api.js`

## 📈 Future Enhancements

- **Authentication**: Azure AD B2C integration
- **File Attachments**: Azure Blob Storage integration
- **Email Notifications**: Automated email alerts
- **Real-time Updates**: WebSocket integration for live updates
- **Mobile App**: React Native mobile application
- **Advanced Reporting**: Export capabilities and custom reports
- **SLA Management**: Service level agreement tracking
- **Knowledge Base**: Self-service documentation system

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions, please create an issue in the repository or contact the development team.

---

**Built with ❤️ for efficient IT support management**