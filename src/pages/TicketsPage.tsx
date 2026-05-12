import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Plus, MessageSquare, Clock, CheckCircle, XCircle, ThumbsUp } from 'lucide-react';

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
  vote_count?: number;
  user_has_voted?: boolean;
}

interface TicketComment {
  id: string;
  ticket_id: string;
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

export const TicketsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user, isAdmin]);

  const fetchTickets = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .neq('status', 'closed')
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      const userIds = [...new Set(ticketsData?.map(t => t.user_id) || [])];
      const ticketIds = ticketsData?.map(t => t.id) || [];

      const [{ data: profilesData }, { data: votesData }] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, email')
          .in('id', userIds),
        supabase
          .from('ticket_votes')
          .select('ticket_id, user_id')
          .in('ticket_id', ticketIds),
      ]);

      const profileMap: Record<string, string> = {};
      profilesData?.forEach(profile => {
        profileMap[profile.id] = profile.email;
      });

      const voteCounts: Record<string, number> = {};
      const userVotes: Record<string, boolean> = {};

      votesData?.forEach(vote => {
        voteCounts[vote.ticket_id] = (voteCounts[vote.ticket_id] || 0) + 1;
        if (vote.user_id === user.id) {
          userVotes[vote.ticket_id] = true;
        }
      });

      const formattedTickets = ticketsData?.map(ticket => ({
        ...ticket,
        user_email: profileMap[ticket.user_id] || 'Unknown',
        vote_count: voteCounts[ticket.id] || 0,
        user_has_voted: userVotes[ticket.id] || false,
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
  };

  const handleVote = async (ticketId: string, hasVoted: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
      if (hasVoted) {
        const { error } = await supabase
          .from('ticket_votes')
          .delete()
          .eq('ticket_id', ticketId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ticket_votes')
          .insert({
            ticket_id: ticketId,
            user_id: user.id,
          });

        if (error) throw error;
      }

      await fetchTickets();

      if (selectedTicket?.id === ticketId) {
        const updatedTicket = tickets.find(t => t.id === ticketId);
        if (updatedTicket) {
          setSelectedTicket(updatedTicket);
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Support Tickets
            </h1>
            <p className="text-gray-600 mt-1">
              View all support requests and vote for issues you also experience
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Ticket
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="bg-white border border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-600">No tickets yet</p>
                <p className="text-sm text-gray-500 mt-1">Create a ticket to get support</p>
              </div>
            ) : (
              tickets.map((ticket) => {
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
                        <p className="text-xs text-gray-500 mt-1">
                          Created by: {ticket.user_email}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${STATUS_CONFIG[ticket.status].color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {STATUS_CONFIG[ticket.status].label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{ticket.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className={PRIORITY_CONFIG[ticket.priority].color}>
                          Priority: {PRIORITY_CONFIG[ticket.priority].label}
                        </span>
                        <button
                          onClick={(e) => handleVote(ticket.id, ticket.user_has_voted || false, e)}
                          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                            ticket.user_has_voted
                              ? 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>{ticket.vote_count || 0}</span>
                        </button>
                      </div>
                      <span className="text-gray-500">{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="bg-white border border-gray-300 rounded-lg p-6">
            {selectedTicket ? (
              <div>
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedTicket.title}</h2>
                      <p className="text-sm text-gray-600 mt-1">Created by: {selectedTicket.user_email}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded ${STATUS_CONFIG[selectedTicket.status].color}`}>
                      {STATUS_CONFIG[selectedTicket.status].label}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-4">{selectedTicket.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                      Priority: <span className={PRIORITY_CONFIG[selectedTicket.priority].color}>{PRIORITY_CONFIG[selectedTicket.priority].label}</span>
                    </span>
                    <span className="text-gray-500">Created: {new Date(selectedTicket.created_at).toLocaleDateString()}</span>
                    <button
                      onClick={(e) => handleVote(selectedTicket.id, selectedTicket.user_has_voted || false, e)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${
                        selectedTicket.user_has_voted
                          ? 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span className="font-medium">{selectedTicket.vote_count || 0}</span>
                      <span className="text-xs ml-1">{selectedTicket.user_has_voted ? 'Me too!' : 'Me too'}</span>
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Comments</h3>
                  </div>

                  {loadingComments ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 text-cyan-600 animate-spin" />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {comments.map((comment) => (
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
                              {comment.is_admin_comment ? 'Support Team' : 'You'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
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

      {showCreateModal && <CreateTicketModal onClose={() => setShowCreateModal(false)} onSuccess={fetchTickets} />}
    </div>
  );
};

interface CreateTicketModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .insert({
          user_id: user.id,
          title,
          description,
          priority,
          status: 'open',
        });

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Support Ticket</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Brief description of your issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Provide detailed information about your issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
