import React, { useEffect, useState } from 'react';
import { ArrowLeft, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Project, Feedback } from '../lib/supabase';
import { createMondayService } from '../services/mondayService';

interface ProjectViewProps {
  projectId: string;
  onBackClick: () => void;
}

export function ProjectView({ projectId, onBackClick }: ProjectViewProps) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [newFeedback, setNewFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState('');
  const [detectedFileType, setDetectedFileType] = useState<string | null>(null);

  useEffect(() => {
    loadProject();
    loadFeedback();
  }, [projectId]);

  useEffect(() => {
    if (project?.file_url) {
      detectFileType(project.file_url, project.file_name);
    }
  }, [project?.file_url, project?.file_name]);

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFeedbackList(data || []);
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };

  const detectFileType = async (url: string, fileName?: string | null) => {
    // First try to detect from file name extension
    if (fileName) {
      const ext = fileName.split('.').pop()?.toLowerCase();
      if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'].includes(ext || '')) {
        setDetectedFileType('video');
        return;
      }
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '')) {
        setDetectedFileType('image');
        return;
      }
      if (['pdf'].includes(ext || '')) {
        setDetectedFileType('pdf');
        return;
      }
    }

    // Try to detect from URL extension
    const urlExt = url.split('?')[0].split('.').pop()?.toLowerCase();
    if (urlExt) {
      if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'].includes(urlExt)) {
        setDetectedFileType('video');
        return;
      }
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(urlExt)) {
        setDetectedFileType('image');
        return;
      }
      if (['pdf'].includes(urlExt)) {
        setDetectedFileType('pdf');
        return;
      }
    }

    // Try HEAD request to check content-type
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      
      if (contentType) {
        if (contentType.startsWith('video/')) {
          setDetectedFileType('video');
          return;
        }
        if (contentType.startsWith('image/')) {
          setDetectedFileType('image');
          return;
        }
        if (contentType === 'application/pdf') {
          setDetectedFileType('pdf');
          return;
        }
      }
    } catch (err) {
      console.log('Could not detect file type from headers');
    }

    setDetectedFileType('other');
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project || !newFeedback.trim()) return;

    setError('');
    setSubmitting(true);

    try {
      const mondayService = createMondayService();
      let mondayFeedbackId: string | null = null;

      if (mondayService && project.monday_item_id) {
        try {
          mondayFeedbackId = await mondayService.addUpdate(
            project.monday_item_id,
            newFeedback.trim()
          );
        } catch (mondayError) {
          console.error('❌ Monday.com add feedback failed:', mondayError);
        }
      }
      
      const { error: dbError } = await supabase.from('feedback').insert({
        project_id: projectId,
        user_id: user.id,
        message: newFeedback,
        monday_feedback_id: mondayFeedbackId,
      });

      if (dbError) throw dbError;

      setNewFeedback('');
      await loadFeedback();
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!project) return;

    setError('');
    setApproving(true);

    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ status: 'Completed' })
        .eq('id', projectId);

      if (updateError) throw updateError;

      const mondayService = createMondayService();
      if (mondayService && project.monday_item_id) {
        try {
          await mondayService.updateItem(project.monday_item_id, {
            status: { label: 'Completed' },
          });
        } catch (mondayError) {
          console.error('❌ Monday.com status update failed:', mondayError);
        }
      }

      await loadProject();
    } catch (err: any) {
      setError(err.message || 'Failed to approve project');
    } finally {
      setApproving(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'standard':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'complete':
      return 'bg-green-100 text-green-700';
    case 'in production':
      return 'bg-yellow-100 text-yellow-700';
    case 'revisions pending':
      return 'bg-blue-100 text-blue-700';
    case 'paid & invoiced':
      return 'bg-[#81AB5B]/20 text-[#81AB5B]';
    case 'delivered - awaiting payment':
      return 'bg-lime-100 text-lime-700';
    case 'awaiting client approval':
      return 'bg-orange-100 text-orange-700';
    case 'awaiting approval':
      return 'bg-amber-100 text-amber-700';
    case 'awaiting footage':
      return 'bg-stone-100 text-stone-700';
    case 'not started':
      return 'bg-gray-200 text-gray-700';
    case 'planned':
      return 'bg-violet-100 text-violet-700';
    case 'delayed':
      return 'bg-red-100 text-red-700';
    case 're-allocated':
      return 'bg-rose-100 text-rose-700';
    case 'cancelled':
      return 'bg-pink-100 text-pink-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">Project not found</p>
        </div>
      </Layout>
    );
  }

  if (!project.grant_view) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={onBackClick}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <p className="text-gray-500 mb-2">Project not yet available for viewing</p>
            <p className="text-sm text-gray-400">
              You'll be able to view this project once it's completed
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const isCompleted = project.status.toLowerCase() === 'completed';

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={onBackClick}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 sm:mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
              <p className="text-sm sm:text-base text-gray-500">Created on {formatDate(project.created_at)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(project.priority)}`}>
                {project.priority}
              </span>
            </div>
          </div>

          {project.file_url && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Project File</h2>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span className="text-gray-700 break-all">{project.file_name || 'Project File'}</span>
                  <a
                    href={project.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                  >
                    Download File
                  </a>
                </div>
              </div>

              {detectedFileType === null ? (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-3 text-gray-600">Detecting file type...</p>
                </div>
              ) : detectedFileType === 'video' ? (
                <div className="bg-black rounded-lg overflow-hidden">
                  <video
                    controls
                    className="w-full max-h-96 sm:max-h-[500px]"
                    preload="metadata"
                    key={project.file_url}
                  >
                    <source src={project.file_url} />
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : detectedFileType === 'image' ? (
                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={project.file_url}
                    alt={project.file_name || 'Project file'}
                    className="w-full h-auto max-h-96 sm:max-h-[500px] object-contain mx-auto"
                    key={project.file_url}
                  />
                </div>
              ) : detectedFileType === 'pdf' ? (
                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  <iframe
                    src={project.file_url}
                    className="w-full h-96 sm:h-[500px]"
                    title="PDF Preview"
                    key={project.file_url}
                  />
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-center border-2 border-dashed border-gray-300">
                  <p className="text-gray-600 mb-3">Preview not available for this file type</p>
                  <a
                    href={project.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Download to View
                  </a>
                </div>
              )}
            </div>
          )}

          {project.due_date && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Due Date</h2>
              <p className="text-gray-600">{formatDate(project.due_date)}</p>
            </div>
          )}

          {!isCompleted && (
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleApprove}
                disabled={approving}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{approving ? 'Approving...' : 'Approve Project'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <div className="flex items-center space-x-2 mb-6">
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Feedback</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4 mb-6">
            {feedbackList.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No feedback yet</p>
            ) : (
              feedbackList.map((feedback) => (
                <div key={feedback.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                    <span className="font-medium text-gray-900">You</span>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {formatDate(feedback.created_at)} at {formatTime(feedback.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700 break-words">{feedback.message}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSubmitFeedback}>
            <div className="mb-4">
              <label htmlFor="feedback" className="block text-sm font-medium text-gray-900 mb-2">
                Add Your Feedback
              </label>
              <textarea
                id="feedback"
                value={newFeedback}
                onChange={(e) => setNewFeedback(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                placeholder="Share your thoughts about this project..."
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !newFeedback.trim()}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              <span>{submitting ? 'Sending...' : 'Send Feedback'}</span>
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}