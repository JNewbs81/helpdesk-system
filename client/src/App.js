// client/src/App.js - Main React Application
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Users, Wrench, Building, Settings, BarChart3, Ticket } from 'lucide-react';

// Import components
import ClientPortal from './components/ClientPortal';
import TechnicianDashboard from './components/TechnicianDashboard';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Navigation Component
const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    {
      path: '/client-portal',
      name: 'Client Portal',
      icon: Users,
      description: 'Customer ticket interface'
    },
    {
      path: '/technician-dashboard',
      name: 'Technician Dashboard',
      icon: Wrench,
      description: 'Support team interface'
    },
    {
      path: '/customers',
      name: 'Customers',
      icon: Building,
      description: 'Manage customer accounts'
    },
    {
      path: '/technicians',
      name: 'Technicians',
      icon: Users,
      description: 'Manage support staff'
    },
    {
      path: '/analytics',
      name: 'Analytics',
      icon: BarChart3,
      description: 'Reports and insights'
    },
    {
      path: '/settings',
      name: 'Settings',
      icon: Settings,
      description: 'System configuration'
    }
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Ticket className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">IT Helpdesk</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title={item.description}
                >
                  <div className="flex items-center space-x-1">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:block">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Home/Landing Page Component
const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Ticket className="h-20 w-20 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            IT Helpdesk Management System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Streamline your IT support operations with our comprehensive ticketing system. 
            Manage customer requests, track technician workloads, and analyze performance metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Client Portal Card */}
          <Link
            to="/client-portal"
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
          >
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 ml-4">Client Portal</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Customer-facing interface for submitting tickets, tracking requests, and viewing support history.
            </p>
            <div className="text-blue-600 font-medium">Access Portal →</div>
          </Link>

          {/* Technician Dashboard Card */}
          <Link
            to="/technician-dashboard"
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
          >
            <div className="flex items-center mb-4">
              <div className="bg-green-100 rounded-lg p-3">
                <Wrench className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 ml-4">Technician Dashboard</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Internal interface for support staff to manage tickets, update statuses, and communicate with customers.
            </p>
            <div className="text-green-600 font-medium">Open Dashboard →</div>
          </Link>

          {/* Customer Management Card */}
          <Link
            to="/customers"
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
          >
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <Building className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 ml-4">Customer Management</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Manage customer accounts, contact information, and view customer support history and statistics.
            </p>
            <div className="text-purple-600 font-medium">Manage Customers →</div>
          </Link>

          {/* Technician Management Card */}
          <Link
            to="/technicians"
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
          >
            <div className="flex items-center mb-4">
              <div className="bg-orange-100 rounded-lg p-3">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 ml-4">Technician Management</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Manage support staff, view workload distribution, and track individual performance metrics.
            </p>
            <div className="text-orange-600 font-medium">Manage Staff →</div>
          </Link>

          {/* Analytics Card */}
          <Link
            to="/analytics"
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
          >
            <div className="flex items-center mb-4">
              <div className="bg-indigo-100 rounded-lg p-3">
                <BarChart3 className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 ml-4">Analytics & Reports</h3>
            </div>
            <p className="text-gray-600 mb-4">
              View comprehensive reports, performance metrics, and insights into your support operations.
            </p>
            <div className="text-indigo-600 font-medium">View Analytics →</div>
          </Link>

          {/* Settings Card */}
          <Link
            to="/settings"
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
          >
            <div className="flex items-center mb-4">
              <div className="bg-gray-100 rounded-lg p-3">
                <Settings className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 ml-4">System Settings</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Configure system settings, manage categories, and customize the helpdesk system.
            </p>
            <div className="text-gray-600 font-medium">Open Settings →</div>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <Ticket className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Ticket Management</h4>
              <p className="text-sm text-gray-600">
                Automated ticket numbering, priority levels, and status tracking
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Team Collaboration</h4>
              <p className="text-sm text-gray-600">
                Internal comments, ticket assignments, and workload distribution
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Performance Metrics</h4>
              <p className="text-sm text-gray-600">
                Resolution times, customer satisfaction, and productivity insights
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <Building className="h-8 w-8 text-orange-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Customer Management</h4>
              <p className="text-sm text-gray-600">
                Comprehensive customer profiles and support history tracking
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder components for routes we haven't built yet
const CustomerManagement = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Management</h2>
      <p className="text-gray-600">Coming soon - Customer account management interface</p>
    </div>
  </div>
);

const TechnicianManagement = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Technician Management</h2>
      <p className="text-gray-600">Coming soon - Support staff management interface</p>
    </div>
  </div>
);

const Analytics = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics & Reports</h2>
      <p className="text-gray-600">Coming soon - Performance analytics and reporting dashboard</p>
    </div>
  </div>
);

const SystemSettings = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">System Settings</h2>
      <p className="text-gray-600">Coming soon - System configuration and settings management</p>
    </div>
  </div>
);

// Main App Component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Navigation />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/client-portal" element={<ClientPortal />} />
            <Route path="/technician-dashboard" element={<TechnicianDashboard />} />
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/technicians" element={<TechnicianManagement />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<SystemSettings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;