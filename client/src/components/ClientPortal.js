import React, { useState, useEffect } from 'react';
import { Search, Plus, Clock, AlertCircle, CheckCircle2, User, Building } from 'lucide-react';
import { ticketAPI, categoryAPI, customerAPI, formatDate, getPriorityColor, getStatusColor, formatError } from '../services/api';

const ClientPortal = () => {
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    customer_id: '',
    title: '',
    description: '',
    priority: 'Medium',
    category_id: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      loadTickets();
    }
  }, [selectedCustomer, filters, loadTickets]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, customersRes] = await Promise.all([
        categoryAPI.getCategories(),
        customerAPI.getCustomers({ limit: 100 })
      ]);
      
      setCategories(categoriesRes.data);
      setCustomers(customersRes.data.customers || customersRes.data);
      
      // Auto-select first customer for demo purposes
      if (customersRes.data.customers?.[0] || customersRes.data[0]) {
        const firstCustomer = customersRes.data.customers?.[0] || customersRes.data[0];
        setSelectedCustomer(firstCustomer.customer_id.toString());
        setNewTicket(prev => ({ ...prev, customer_id: firstCustomer.customer_id }));
      }
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    if (!selectedCustomer) return;
    
    try {
      const params = {
        customer_id: selectedCustomer,
        ...filters,
        limit: 50
      };
      
      const response = await ticketAPI.getTickets(params);
      setTickets(response.data);
    } catch (err) {
      setError(formatError(err));
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.title || !newTicket.description || !newTicket.customer_id) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await ticketAPI.createTicket(newTicket);
      setShowNewTicketForm(false);
      setNewTicket({
        customer_id: selectedCustomer,
        title: '',
        description: '',
        priority: 'Medium',
        category_id: ''
      });
      loadTickets();
      setError('');
    } catch (err) {
      setError(formatError(err));
    }
  };

  const getSelectedCustomerInfo = () => {
    return customers.find(c => c.customer_id.toString() === selectedCustomer);
  };

  const getTicketStats = () => {
    const stats = {
      total: tickets.length,
      new: tickets.filter(t => t.status === 'New').length,
      inProgress: tickets.filter(t => t.status === 'In Progress').length,
      waiting: tickets.filter(t => t.status === 'Waiting for Customer').length,
      resolved: tickets.filter(t => t.status === 'Resolved').length
    };
    return stats;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  const customerInfo = getSelectedCustomerInfo();
  const stats = getTicketStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customer Portal</h1>
              <p className="text-gray-600">Manage your support tickets and requests</p>
            </div>
            
            {/* Customer Selector */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 bg-white"
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.customer_id} value={customer.customer_id}>
                    {customer.company_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {customerInfo && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <Building className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">{customerInfo.company_name}</h3>
                  <p className="text-blue-700 text-sm">
                    Contact: {customerInfo.contact_name} • {customerInfo.email}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        </div>
      )}

      {!selectedCustomer ? (
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Customer</h3>
          <p className="text-gray-600">Choose a customer from the dropdown above to view their tickets</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">{stats.total}</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Total</p>
                  <p className="text-xs text-gray-500">All tickets</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">{stats.new}</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">New</p>
                  <p className="text-xs text-gray-500">Submitted</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">{stats.inProgress}</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">In Progress</p>
                  <p className="text-xs text-gray-500">Being worked</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 font-semibold text-sm">{stats.waiting}</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Waiting</p>
                  <p className="text-xs text-gray-500">Need response</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">{stats.resolved}</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Resolved</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tickets..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="">All Status</option>
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Waiting for Customer">Waiting for Customer</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>

                  {/* Priority Filter */}
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="">All Priority</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowNewTicketForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Ticket</span>
                </button>
              </div>
            </div>

            {/* New Ticket Form */}
            {showNewTicketForm && (
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Ticket</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={newTicket.title}
                        onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Brief description of the issue"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={newTicket.priority}
                        onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={newTicket.category_id}
                      onChange={(e) => setNewTicket({ ...newTicket, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.category_id} value={category.category_id}>
                          {category.category_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={newTicket.description}
                      onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Detailed description of the issue, steps to reproduce, any error messages, etc."
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleCreateTicket}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Create Ticket
                    </button>
                    <button
                      onClick={() => setShowNewTicketForm(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tickets List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Tickets</h3>
              
              {tickets.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                  <p className="text-gray-600">
                    {Object.values(filters).some(f => f) ? 
                      'Try adjusting your filters or create a new ticket.' :
                      'You have no support tickets. Create one if you need assistance.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map(ticket => (
                    <div key={ticket.ticket_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-900">#{ticket.ticket_number}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                              {ticket.status}
                            </span>
                            {ticket.category_name && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                {ticket.category_name}
                              </span>
                            )}
                          </div>
                          
                          <h5 className="font-medium text-gray-900 mb-1">{ticket.title}</h5>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{ticket.description}</p>
                          
                          <div className="flex items-center text-xs text-gray-500 space-x-4">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Created: {formatDate(ticket.created_at)}
                            </div>
                            {ticket.assigned_technician && (
                              <div className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                Assigned: {ticket.assigned_technician}
                              </div>
                            )}
                            {ticket.updated_at !== ticket.created_at && (
                              <div>
                                Updated: {formatDate(ticket.updated_at)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;