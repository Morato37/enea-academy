import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, MessageSquare, Send, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Ticket {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  user_email?: string;
}

interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  comment: string;
  is_admin_comment: boolean;
  created_at: string;
  user_email?: string;
}

const STATUS_CONFIG = {
  open: { label: 'Open', icon: Clock, color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  resolved: { label: 'Resolved', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  closed: { label: 'Closed', icon: XCircle, color: 'bg-gray-100 text-gray-800' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-gray-600' },
  medium: { label: 'Medium', color: 'text-yellow-600' },
  high: { label: 'High', color: 'text-red-600' },
};

export const TicketManagement: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      const userIds = [...new Set(ticketsData?.map(t => t.user_id) || [])];

      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('id, email')
        .in('id', userIds);

      const profileMap: Record<string, string> = {};
      profilesData?.forEach(profile => {
        profileMap[profile.id] = profile.email;
      });

      const formattedTickets = ticketsData?.map(ticket => ({
        ...ticket,
        user_email: profileMap[ticket.user_id] || 'Unknown',
      })) || [];

      setTickets(formattedTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (ticketId: string) => {
    setLoadingComments(true);
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];

      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('id, email')
        .in('id', userIds);

      const profileMap: Record<string, string> = {};
      profilesData?.forEach(profile => {
        profileMap[profile.id] = profile.email;
      });

      const formattedComments = commentsData?.map(comment => ({
        ...comment,
        user_email: profileMap[comment.user_id] || 'Unknown',
      })) || [];

      setComments(formattedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    fetchComments(ticket.id);
    setNewComment('');
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      await fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus as any });
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      alert('Failed to update status');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: userData.user.id,
          comment: newComment,
          is_admin_comment: true,
        });

      if (error) throw error;

      setNewComment('');
      await fetchComments(selectedTicket.id);
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const filteredTickets = filterStatus === 'all'
    ? tickets
    : tickets.filter(t => t.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ticket Management</h2>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({tickets.length})
          </button>
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const count = tickets.filter(t => t.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {config.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
          {filteredTickets.length === 0 ? (
            <div className="bg-white border border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-600">No tickets found</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const StatusIcon = STATUS_CONFIG[ticket.status].icon;
              return (
                <div
                  key={ticket.id}
                  onClick={() => handleTicketClick(ticket)}
                  className={`bg-white border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedTicket?.id === ticket.id ? 'border-cyan-500 shadow-md' : 'border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">From: {ticket.user_email}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded whitespace-nowrap ${STATUS_CONFIG[ticket.status].color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {STATUS_CONFIG[ticket.status].label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{ticket.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className={PRIORITY_CONFIG[ticket.priority].color}>
                      Priority: {PRIORITY_CONFIG[ticket.priority].label}
                    </span>
                    <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="bg-white border border-gray-300 rounded-lg p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
          {selectedTicket ? (
            <div className="h-full flex flex-col">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{selectedTicket.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">From: {selectedTicket.user_email}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <p className="text-gray-700 mb-4">{selectedTicket.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Priority: <span className={PRIORITY_CONFIG[selectedTicket.priority].color}>{PRIORITY_CONFIG[selectedTicket.priority].label}</span></span>
                  <span>Created: {new Date(selectedTicket.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Comments</h3>
                </div>

                {loadingComments ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 text-cyan-600 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3 mb-4 flex-1 overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
                    ) : (
                      comments.map((comment) => (
                        <div
                          key={comment.id}
                          className={`p-3 rounded-lg ${
                            comment.is_admin_comment
                              ? 'bg-cyan-50 border border-cyan-200'
                              : 'bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-medium ${
                              comment.is_admin_comment ? 'text-cyan-700' : 'text-gray-600'
                            }`}>
                              {comment.is_admin_comment ? 'Support Team' : comment.user_email}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <form onSubmit={handleAddComment} className="mt-auto">
                  <div className="flex gap-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                    />
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
              <MessageSquare className="w-12 h-12 mb-2" />
              <p>Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
