import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  User, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Users, 
  Ticket, 
  Activity 
} from 'lucide-react';
import { 
  ticketAPI, 
  technicianAPI, 
  categoryAPI, 
  formatDate, 
  getPriorityColor, 
  getStatusColor, 
  formatError 
} from '../services/api';

const TechnicianDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [workloadSummary, setWorkloadSummary] = useState({});
  
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    technician_id: '',
    search: ''
  });

  const [updateData, setUpdateData] = useState({
    ticketId: null,
    assigned_technician_id: '',
    status: '',
    priority: '',
    resolution_notes: ''
  });

  const [newComment, setNewComment] = useState({
    ticketId: null,
    technician_id: 1, // Default technician - in real app, get from auth
    comment_text: '',
    is_internal: true
  });

  const loadTickets = useCallback(async () => {
    try {
      const params = {
        ...filters,
        limit: 100
      };
      
      const response = await ticketAPI.getTickets(params);
      setTickets(response.data);
    } catch (err) {
      setError(formatError(err));
    }
  }, [filters]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadTickets();
  }, [filters, loadTickets]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [techniciansRes, workloadRes] = await Promise.all([
        technicianAPI.getTechnicians(),
        technicianAPI.getWorkloadSummary()
      ]);
      
      setTechnicians(techniciansRes.data.technicians || techniciansRes.data);
      setWorkloadSummary(workloadRes.data);
      
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicket = async () => {
    if (!updateData.ticketId) return;

    try {
      const updatePayload = {};
      if (updateData.assigned_technician_id) updatePayload.assigned_technician_id = parseInt(updateData.assigned_technician_id);
      if (updateData.status) updatePayload.status = updateData.status;
      if (updateData.priority) updatePayload.priority = updateData.priority;
      if (updateData.resolution_notes) updatePayload.resolution_notes = updateData.resolution_notes;

      await ticketAPI.updateTicket(updateData.ticketId, updatePayload);
      
      setUpdateData({
        ticketId: null,
        assigned_technician_id: '',
        status: '',
        priority: '',
        resolution_notes: ''
      });
      
      loadTickets();
      setError('');
    } catch (err) {
      setError(formatError(err));
    }
  };

  const handleAddComment = async () => {
    if (!newComment.ticketId || !newComment.comment_text.trim()) return;

    try {
      await ticketAPI.addComment(newComment.ticketId, {
        technician_id: newComment.technician_id,
        comment_text: newComment.comment_text,
        is_internal: newComment.is_internal
      });
      
      setNewComment({
        ticketId: null,
        technician_id: 1,
        comment_text: '',
        is_internal: true
      });
      
      loadTickets();
      setError('');
    } catch (err) {
      setError(formatError(err));
    }
  };

  const getWorkloadStats = () => {
    if (!Array.isArray(workloadSummary)) return { totalActive: 0, totalTechnicians: 0 };
    
    return {
      totalActive: workloadSummary.reduce((sum, tech) => sum + (tech.active_tickets || 0), 0),
      totalTechnicians: workloadSummary.length
    };
  };

  const getTicketStats = () => {
    return {
      total: tickets.length,
      new: tickets.filter(t => t.status === 'New').length,
      inProgress: tickets.filter(t => t.status === 'In Progress').length,
      waiting: tickets.filter(t => t.status === 'Waiting for Customer').length,
      resolved: tickets.filter(t => t.status === 'Resolved').length
    };
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

  const stats = getTicketStats();
  const workloadStats = getWorkloadStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Technician Dashboard</h1>
              <p className="text-gray-600">Manage support tickets and team workload</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{workloadStats.totalActive}</span> active tickets across{' '}
                <span className="font-medium">{workloadStats.totalTechnicians}</span> technicians
              </div>
            </div>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Ticket className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Tickets</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-2xl font-semibold text-gray-900">{stats.new}</p>
                <p className="text-sm text-gray-600">New Tickets</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-2xl font-semibold text-gray-900">{stats.inProgress}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-2xl font-semibold text-gray-900">{stats.resolved}</p>
                <p className="text-sm text-gray-600">Resolved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Workload Overview */}
        {Array.isArray(workloadSummary) && workloadSummary.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Team Workload</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workloadSummary.map(tech => (
                  <div key={tech.technician_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">
                          {tech.first_name} {tech.last_name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{tech.email}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Active Tickets:</span>
                        <span className="font-medium">{tech.active_tickets || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Assigned:</span>
                        <span className="font-medium">{tech.total_tickets || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
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

                {/* Technician Filter */}
                <select
                  value={filters.technician_id}
                  onChange={(e) => setFilters({ ...filters, technician_id: e.target.value })}
                  className="rounded-lg border border-gray-300 px-3 py-2"
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
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Support Tickets</h3>
            
            {tickets.length === 0 ? (
              <div className="text-center py-12">
                <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                <p className="text-gray-600">
                  {Object.values(filters).some(f => f) ? 
                    'Try adjusting your filters to see more tickets.' :
                    'No support tickets available at the moment.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map(ticket => (
                  <div key={ticket.ticket_id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="p-4">
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
                          <p className="text-gray-600 text-sm mb-2">{ticket.description}</p>
                          
                          <div className="flex items-center text-xs text-gray-500 space-x-4">
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {ticket.company_name}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(ticket.created_at)}
                            </div>
                            {ticket.assigned_technician && (
                              <div className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {ticket.assigned_technician}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => setExpandedTicket(expandedTicket === ticket.ticket_id ? null : ticket.ticket_id)}
                          className="ml-4 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          {expandedTicket === ticket.ticket_id ? 'Collapse' : 'Expand'}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedTicket === ticket.ticket_id && (
                      <div className="border-t border-gray-200 bg-gray-50">
                        <div className="p-4 space-y-4">
                          {/* Update Ticket Form */}
                          <div>
                            <h6 className="font-medium text-gray-900 mb-3">Update Ticket</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                              <select
                                value={updateData.ticketId === ticket.ticket_id ? updateData.assigned_technician_id : ''}
                                onChange={(e) => setUpdateData({ ...updateData, ticketId: ticket.ticket_id, assigned_technician_id: e.target.value })}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              >
                                <option value="">Assign Technician</option>
                                {technicians.map(tech => (
                                  <option key={tech.technician_id} value={tech.technician_id}>
                                    {tech.first_name} {tech.last_name}
                                  </option>
                                ))}
                              </select>

                              <select
                                value={updateData.ticketId === ticket.ticket_id ? updateData.status : ''}
                                onChange={(e) => setUpdateData({ ...updateData, ticketId: ticket.ticket_id, status: e.target.value })}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              >
                                <option value="">Update Status</option>
                                <option value="New">New</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Waiting for Customer">Waiting for Customer</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Closed">Closed</option>
                              </select>

                              <select
                                value={updateData.ticketId === ticket.ticket_id ? updateData.priority : ''}
                                onChange={(e) => setUpdateData({ ...updateData, ticketId: ticket.ticket_id, priority: e.target.value })}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              >
                                <option value="">Change Priority</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                              </select>

                              <button
                                onClick={handleUpdateTicket}
                                disabled={!updateData.ticketId}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                              >
                                Update
                              </button>
                            </div>
                            
                            {/* Resolution Notes */}
                            <div className="flex items-center space-x-2">
                              <textarea
                                rows={2}
                                placeholder="Resolution notes..."
                                value={updateData.ticketId === ticket.ticket_id ? updateData.resolution_notes : ''}
                                onChange={(e) => setUpdateData({ ...updateData, ticketId: ticket.ticket_id, resolution_notes: e.target.value })}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>

                          {/* Add Comment Form */}
                          <div>
                            <h6 className="font-medium text-gray-900 mb-3">Add Comment</h6>
                            <div className="flex items-start space-x-2">
                              <textarea
                                rows={3}
                                placeholder="Add internal note or customer communication..."
                                value={newComment.ticketId === ticket.ticket_id ? newComment.comment_text : ''}
                                onChange={(e) => setNewComment({ ...newComment, ticketId: ticket.ticket_id, comment_text: e.target.value })}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <div className="flex flex-col space-y-2">
                                <label className="flex items-center text-sm">
                                  <input
                                    type="checkbox"
                                    checked={newComment.ticketId === ticket.ticket_id ? newComment.is_internal : true}
                                    onChange={(e) => setNewComment({ ...newComment, ticketId: ticket.ticket_id, is_internal: e.target.checked })}
                                    className="mr-2"
                                  />
                                  Internal Only
                                </label>
                                <button
                                  onClick={handleAddComment}
                                  disabled={!newComment.ticketId || !newComment.comment_text.trim()}
                                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                  Add Comment
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicianDashboard;