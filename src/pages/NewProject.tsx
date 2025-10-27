import React, { useState } from 'react';
import { ArrowLeft, Upload, Link as LinkIcon } from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { createMondayService } from '../services/mondayService';

interface NewProjectProps {
  onBackClick: () => void;
  onSuccess: () => void;
}

export function NewProject({ onBackClick, onSuccess }: NewProjectProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('URGENT');
  const [dueDate, setDueDate] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'link' | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pastedLink, setPastedLink] = useState('');
  const [linkName, setLinkName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadMode('file');
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadMode('file');
      setFile(e.target.files[0]);
    }
  };

  const handleModeSwitch = (mode: 'file' | 'link') => {
    setUploadMode(mode);
    setFile(null);
    setPastedLink('');
    setLinkName('');
    setError('');
  };

  const simulateProgress = (duration: number) => {
    return new Promise<void>((resolve) => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 95);
        setUploadProgress(Math.round(progress));
        
        if (progress >= 95) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);
    setUploadProgress(0);

    try {
      let fileUrl = null;
      let fileName = null;

      if (uploadMode === 'file' && file) {
        setIsUploading(true);
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const estimatedTime = Math.min(file.size / 50000, 10000);
        
        const progressPromise = simulateProgress(estimatedTime);
        
        const uploadPromise = supabase.storage
          .from('project-files')
          .upload(filePath, file);

        const [_, { error: uploadError }] = await Promise.all([
          progressPromise,
          uploadPromise
        ]);

        if (uploadError) throw uploadError;

        setUploadProgress(100);

        const { data: urlData } = supabase.storage
          .from('project-files')
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileName = file.name;
        
        await new Promise(resolve => setTimeout(resolve, 300));
        setIsUploading(false);
      } else if (uploadMode === 'link' && pastedLink) {
        fileUrl = pastedLink;
        fileName = linkName || new URL(pastedLink).hostname;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const personName = profileData?.full_name.split(' ')[0] || 'Unknown User';

      let mondayItemId = null;
      const mondayService = createMondayService();
      if (mondayService) {
        try {
          mondayItemId = await mondayService.createItem({
            name: personName + ' - ' + name,
            status: 'Not Started',
            priority,
            fileUrl: fileUrl || undefined,
            fileName: fileName || undefined,
            dueDate
          });
        } catch (mondayError) {
          console.error('Monday.com error:', mondayError);
        }
      }

      console.log('Creating project with Monday Item ID:', mondayItemId);

      const res = await fetch('/api/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          status: 'Not Started',
          name,
          monday_item_id: mondayItemId,
          priority,
          due_date: dueDate || null,
          file_url: fileUrl,
          file_name: fileName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create project');

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create project');
      setIsUploading(false);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

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

        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Create New Project</h1>
          <p className="text-sm sm:text-base text-blue-600 mb-6 sm:mb-8">
            Fill in the details and upload your project files
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                Project Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-900 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="Urgent">Urgent</option>
                  <option value="Standard">Standard</option>
                </select>
              </div> 

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-900 mb-2">
                  Due Date
                </label>
                <input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-6 sm:mb-8">
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Add Content
              </label>

              {!uploadMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('file')}
                    className="flex items-center justify-center space-x-2 p-4 border-2 border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-700">Upload File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('link')}
                    className="flex items-center justify-center space-x-2 p-4 border-2 border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <LinkIcon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-700">Paste Link</span>
                  </button>
                </div>
              ) : uploadMode === 'file' ? (
                <div>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('link')}
                    className="text-sm text-blue-600 hover:text-blue-700 mb-4"
                  >
                    ← Switch to paste link
                  </button>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 sm:p-12 text-center transition-colors ${
                      dragActive
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileChange}
                      accept="video/*,image/*,.pdf,.zip"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="flex justify-center mb-4">
                        <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 mb-2">
                        Drop your file here, or{' '}
                        <span className="text-blue-600 hover:text-blue-700">browse</span>
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Supports: Videos, Images, PDFs, ZIP files
                      </p>
                      {file && (
                        <p className="mt-4 text-sm font-medium text-gray-900 break-all px-2">
                          Selected: {file.name}
                        </p>
                      )}
                    </label>
                  </div>

                  {isUploading && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Uploading...</span>
                        <span className="text-sm font-medium text-blue-600">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('file')}
                    className="text-sm text-blue-600 hover:text-blue-700 mb-4"
                  >
                    ← Switch to upload file
                  </button>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="link" className="block text-sm font-medium text-gray-900 mb-2">
                        Paste Link
                      </label>
                      <input
                        id="link"
                        type="url"
                        value={pastedLink}
                        onChange={(e) => setPastedLink(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="https://example.com/your-file"
                        required={uploadMode === 'link'}
                      />
                    </div>
                    <div>
                      <label htmlFor="linkName" className="block text-sm font-medium text-gray-900 mb-2">
                        Link Name (Optional)
                      </label>
                      <input
                        id="linkName"
                        type="text"
                        value={linkName}
                        onChange={(e) => setLinkName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="Enter a display name for this link"
                      />
                      {pastedLink && !linkName && (
                        <p className="text-xs text-gray-500 mt-1">
                          Will use: {(() => {
                            try {
                              return new URL(pastedLink).hostname;
                            } catch {
                              return 'the link domain';
                            }
                          })()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onBackClick}
                disabled={loading}
                className="w-full sm:flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !uploadMode || (uploadMode === 'file' && !file) || (uploadMode === 'link' && !pastedLink)}
                className="w-full sm:flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
              >
                {loading ? (isUploading ? `Uploading ${uploadProgress}%` : 'Creating...') : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}