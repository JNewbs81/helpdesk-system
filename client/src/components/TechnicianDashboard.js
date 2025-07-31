import React, { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, AlertCircle, User, Building, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { ticketAPI, categoryAPI, technicianAPI, formatDate, getPriorityColor, getStatusColor, formatError } from '../services/api';

const TechnicianDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [workloadSummary, setWorkloadSummary] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assigned_only: 'false'
  });
  const [newComment, setNewComment] = useState({
    ticketId: null,
    comment_text: '',
    is_internal: true
  });
  const [ticketUpdate, setTicketUpdate] = useState({
    ticketId: null,
    status: '',
    priority: '',
    assigned_technician_id: '',
    resolution_notes: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [techniciansRes, categoriesRes, workloadRes] = await Promise.all([
        technicianAPI.getTechnicians(),
        categoryAPI.getCategories(),
        technicianAPI.getWorkloadSummary()
      ]);
      
      setTechnicians(techniciansRes.data.technicians || techniciansRes.data);
      setCategories(categoriesRes.data);
      setWorkloadSummary(workloadRes.data);
      
      // Auto-select first active technician
      const activeTechnicians = techniciansRes.data.technicians || techniciansRes.data;
      if (activeTechnicians.length > 0) {
        setSelectedTechnician(activeTechnicians[0].technician_id.toString());
      }
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      const params = {
        ...filters,
        limit: 100
      };
      
      if (filters.assigned_only === 'true' && selectedTechnician) {
        params.technician_id = selectedTechnician;
      }
      
      const response = await ticketAPI.getTickets(params);
      setTickets(response.data);
    } catch (err) {
      setError(formatError(err));
    }
  };

  const handleUpdateTicket = async (ticketId) => {
    try {
      const updateData = { ...ticketUpdate };
      delete updateData.ticketId;
      
      // Remove empty fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === '') {
          delete updateData[key];
        }
      });
      
      await ticketAPI.updateTicket(ticketId, updateData);
      setTicketUpdate({
        ticketId: null,
        status: '',
        priority: '',
        assigned_technician_id: '',
        resolution_notes: ''
      });
      loadTickets();
      setError('');
    } catch (err) {
      setError(formatError(err));
    }
  };

  const handleAddComment = async (ticketId) => {
    if (!newComment.comment_text || !selectedTechnician) {
      setError('Please enter a comment and select a technician');
      return;
    }

    try {
      await ticketAPI.addComment(ticketId, {
        ...newComment,
        technician_id: selectedTechnician
      });
      
      setNewComment({
        ticketId: null,
        comment_text: '',
        is_internal: true
      });
      
      // Reload the expanded ticket to show new comment
      if (expandedTicket === ticketId) {
        loadExpandedTicket(ticketId);
      }
      setError('');
    } catch (err) {
      setError(formatError(err));
    }
  };

  const loadExpandedTicket = async (ticketId) => {
    try {
      const response = await ticketAPI.getTicket(ticketId);
      const ticket = response.data;
      
      // Update the ticket in the list with full details
      setTickets(prev => prev.map(t => 
        t.ticket_id === ticketId ? { ...t, ...ticket } : t
      ));
    } catch (err) {
      setError(formatError(err));
    }
  };

  const toggleTicketExpansion = async (ticketId) => {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null);
    } else {
      setExpandedTicket(ticketId);
      await loadExpandedTicket(ticketId);
    }
  };

  const getSelectedTechnicianInfo = () => {
    return technicians.find(t => t.technician_id.toString() === selectedTechnician);
  };

  const getTicketStats = () => {
    const stats = {
      total: tickets.length,
      new: tickets.filter(t => t.status === 'New').length,
      inProgress: tickets.filter(t => t.status === 'In Progress').length,
      waiting: tickets.filter(t => t.status === 'Waiting for Customer').length,
      critical: tickets.filter(t => t.priority === 'Critical').length,
      high: tickets.filter(t => t.priority === 'High').length
    };
    return stats;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const technicianInfo = getSelectedTechnicianInfo();
  const stats = getTicketStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Technician Dashboard</h1>
              <p className="text-gray-600">Manage support tickets and customer requests</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 bg-white"
              >
                <option value="">All Technicians</option>
                {technicians.map(tech => (
                  <option key={tech.technician_id} value={tech.technician_id}>
                    {tech.first_name} {tech.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {technicianInfo && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <User className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-blue-900">
                      {technicianInfo.first_name} {technicianInfo.last_name}
                    </h3>
                    <p className="text-blue-700 text-sm">{technicianInfo.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-700">
                    Active Tickets: {tickets.filter(t => 
                      t.assigned_technician_id?.toString() === selectedTechnician && 
                      !['Resolved', 'Closed'].includes(t.status)
                    ).length}
                  </div>
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
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
                <p className="text-xs text-gray-500">Unassigned</p>
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
                <p className="text-xs text-gray-500">Active work</p>
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
                <p className="text-xs text-gray-500">Customer</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 font-semibold text-sm">{stats.critical}</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Critical</p>
                <p className="text-xs text-gray-500">Urgent</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 font-semibold text-sm">{stats.high}</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">High</p>
                <p className="text-xs text-gray-500">Priority</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
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

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.assigned_only === 'true'}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    assigned_only: e.target.checked ? 'true' : 'false' 
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">My tickets only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Support Tickets</h3>
            
            {tickets.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                <p className="text-gray-600">Try adjusting your filters to see more tickets.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map(ticket => (
                  <div key={ticket.ticket_id} className="border border-gray-200 rounded-lg">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <button
                              onClick={() => toggleTicketExpansion(ticket.ticket_id)}
                              className="flex items-center text-gray-400 hover:text-gray-600"
                            >
                              {expandedTicket === ticket.ticket_id ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                              }
                            </button>
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
                          <p className="text-gray-600 text-sm mb-2">{ticket.description}</p>
                          
                          <div className="flex items-center text-xs text-gray-500 space-x-4">
                            <div className="flex items-center">
                              <Building className="h-3 w-3 mr-1" />
                              {ticket.company_name}
                            </div>
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {ticket.contact_name}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(ticket.created_at)}
                            </div>
                            {ticket.assigned_technician && (
                              <div className="flex items-center">
                                <Settings className="h-3 w-3 mr-1" />
                                {ticket.assigned_technician}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => setTicketUpdate({
                              ticketId: ticket.ticket_id,
                              status: ticket.status,
                              priority: ticket.priority,
                              assigned_technician_id: ticket.assigned_technician_id || '',
                              resolution_notes: ticket.resolution_notes || ''
                            })}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedTicket === ticket.ticket_id && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        {/* Comments Section */}
                        {ticket.comments && ticket.comments.length > 0 && (
                          <div className="mb-4">
                            <h6 className="font-medium text-gray-900 mb-2">Comments</h6>
                            <div className="space-y-2">
                              {ticket.comments.map(comment => (
                                <div key={comment.comment_id} className="bg-white p-3 rounded border">
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-sm text-gray-900">
                                      {comment.technician_name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatDate(comment.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700">{comment.comment_text}</p>
                                  {comment.is_internal && (
                                    <span className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                      Internal
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add Comment */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Add Comment
                          </label>
                          <textarea
                            value={newComment.ticketId === ticket.ticket_id ? newComment.comment_text : ''}
                            onChange={(e) => setNewComment({
                              ticketId: ticket.ticket_id,
                              comment_text: e.target.value,
                              is_internal: newComment.is_internal
                            })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Add a comment..."
                          />
                          <div className="flex justify-between items-center mt-2">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={newComment.is_internal}
                                onChange={(e) => setNewComment({
                                  ...newComment,
                                  is_internal: e.target.checked
                                })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">Internal comment</span>
                            </label>
                            <button
                              onClick={() => handleAddComment(ticket.ticket_id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              Add Comment
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Update Ticket Modal */}
                    {ticketUpdate.ticketId === ticket.ticket_id && (
                      <div className="border-t border-gray-200 p-4 bg-blue-50">
                        <h6 className="font-medium text-gray-900 mb-3">Update Ticket</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Status
                            </label>
                            <select
                              value={ticketUpdate.status}
                              onChange={(e) => setTicketUpdate({ ...ticketUpdate, status: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">No change</option>
                              <option value="New">New</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Waiting for Customer">Waiting for Customer</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Priority
                            </label>
                            <select
                              value={ticketUpdate.priority}
                              onChange={(e) => setTicketUpdate({ ...ticketUpdate, priority: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">No change</option>
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                              <option value="Critical">Critical</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Assign to Technician
                            </label>
                            <select
                              value={ticketUpdate.assigned_technician_id}
                              onChange={(e) => setTicketUpdate({ ...ticketUpdate, assigned_technician_id: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">No change</option>
                              {technicians.map(tech => (
                                <option key={tech.technician_id} value={tech.technician_id}>
                                  {tech.first_name} {tech.last_name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Resolution Notes
                          </label>
                          <textarea
                            value={ticketUpdate.resolution_notes}
                            onChange={(e) => setTicketUpdate({ ...ticketUpdate, resolution_notes: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Add resolution notes..."
                          />
                        </div>

                        <div className="flex space-x-3 mt-4">
                          <button
                            onClick={() => handleUpdateTicket(ticket.ticket_id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            Update Ticket
                          </button>
                          <button
                            onClick={() => setTicketUpdate({
                              ticketId: null,
                              status: '',
                              priority: '',
                              assigned_technician_id: '',
                              resolution_notes: ''
                            })}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Workload Summary */}
        {workloadSummary.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Team Workload Summary</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Technician
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Active Tickets
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Critical
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        High Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Assigned
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Resolution (hrs)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {workloadSummary.map(tech => (
                      <tr key={tech.technician_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {tech.technician_name}
                              </div>
                              <div className="text-sm text-gray-500">{tech.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {tech.active_tickets || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {tech.critical_tickets || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {tech.high_priority_tickets || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tech.total_assigned_tickets || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tech.avg_resolution_time_hours ? 
                            Math.round(tech.avg_resolution_time_hours * 10) / 10 : 
                            'N/A'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianDashboard;