import React, { useEffect, useState } from 'react';
import { Plus, Eye } from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Project } from '../lib/supabase';

interface DashboardProps {
  onNewProjectClick: () => void;
  onProjectClick: (projectId: string) => void;
}

export function Dashboard({ onNewProjectClick, onProjectClick }: DashboardProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
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
      return 'bg-emerald-100 text-emerald-700';
    case 'delivered - awaiting approval':
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
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
            <p className="text-gray-600">Manage and track your video projects</p>
          </div>
          <button
            onClick={onNewProjectClick}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Start New Project</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border-dashed border-2 border-gray-300">
            <button
              onClick={onNewProjectClick}
              className="mb-4 flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Plus className="text-blue-600" />
            </button>
            <p className="text-gray-500 mb-4">No projects yet</p>
            <button
              onClick={onNewProjectClick}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* NEW COLUMN: Project ID */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project ID
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      {/* NEW COLUMN: Project ID */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {project.monday_item_id || '—'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {project.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            project.status
                          )}`}
                        >
                          {project.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                            project.priority
                          )}`}
                        >
                          {project.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(project.updated_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.file_name || 'No file'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-row items-center gap-2">
                          {project.grant_view && (
                            <button
                              onClick={() => onProjectClick(project.id)}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                            >
                              <Eye className="w-5 h-5" />
                              <span>View</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}