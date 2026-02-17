import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Report, Comment, ReportVersion } from '../../types';
import { format } from 'date-fns';

export default function ReportView() {
  const { id } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [versions, setVersions] = useState<ReportVersion[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showVersions, setShowVersions] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: '',
    editable: false,
    editorProps: {
      attributes: {
        style: 'padding: 16px; min-height: 200px;',
      },
    },
  });

  useEffect(() => {
    fetchReport();
  }, [id]);

  useEffect(() => {
    if (report?.content && editor) {
      editor.commands.setContent(report.content);
    }
  }, [report?.content, editor]);

  const fetchReport = async () => {
    try {
      const reportRes = await api.get(`/reports/${id}`);
      setReport(reportRes.data.data);
      setComments(reportRes.data.data.comments || []);
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await api.get(`/reports/${id}/versions`);
      setVersions(response.data.data);
      setShowVersions(true);
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await api.post(`/reports/${id}/comments`, {
        content: newComment,
      });
      setComments([...comments, response.data.data]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleLock = async () => {
    try {
      await api.post(`/reports/${id}/lock`);
      fetchReport();
    } catch (error) {
      console.error('Failed to lock report:', error);
    }
  };

  const handleUnlock = async () => {
    try {
      await api.post(`/reports/${id}/unlock`);
      fetchReport();
    } catch (error) {
      console.error('Failed to unlock report:', error);
    }
  };

  const handleExport = async (format: 'pdf' | 'docx') => {
    try {
      const response = await api.get(`/reports/${id}/export`, {
        params: { format },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${id}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      draft: 'badge badge-draft',
      submitted: 'badge badge-submitted',
      reviewed: 'badge badge-reviewed',
      locked: 'badge badge-locked',
    };
    return classes[status] || 'badge';
  };

  const canEdit = user?.role === 'hr' || user?.role === 'admin' || user?.role === 'hod';
  const canLock = user?.role === 'hr' || user?.role === 'admin';
  const isOwner = report?.userId === user?.id;

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="empty-state">
        <p>Report not found</p>
        <Link to="/reports" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Reports
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
        <div>
          <Link to="/reports" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            ← Back to Reports
          </Link>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '8px' }}>
            {report.title || `${report.type} Report`}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {canLock && (
            <>
              {report.isLocked ? (
                <button className="btn btn-secondary" onClick={handleUnlock}>
                  Unlock
                </button>
              ) : (
                <button className="btn btn-danger" onClick={handleLock}>
                  Lock
                </button>
              )}
            </>
          )}
          {!report.isLocked && (isOwner || canEdit) && (
            <Link to={`/reports/${id}/edit`} className="btn btn-primary">
              Edit
            </Link>
          )}
          <button className="btn btn-secondary" onClick={() => handleExport('pdf')}>
            Export PDF
          </button>
          <button className="btn btn-secondary" onClick={() => handleExport('docx')}>
            Export DOCX
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Date</span>
            <p style={{ fontWeight: '500' }}>{format(new Date(report.date), 'MMMM d, yyyy')}</p>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Type</span>
            <p style={{ fontWeight: '500', textTransform: 'capitalize' }}>{report.type}</p>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Status</span>
            <p>
              <span className={getStatusBadge(report.status)}>{report.status}</span>
              {report.isLocked && <span style={{ marginLeft: '8px' }}>🔒</span>}
            </p>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Staff</span>
            <p style={{ fontWeight: '500' }}>{report.user?.firstName} {report.user?.lastName}</p>
          </div>
        </div>

        {canEdit && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
            <button className="btn btn-ghost btn-sm" onClick={fetchVersions}>
              View Edit History
            </button>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontWeight: '600', marginBottom: '16px' }}>Report Content</h3>
        <EditorContent editor={editor} />
      </div>

      {showVersions && versions.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '16px' }}>Edit History</h3>
          {versions.map((version) => (
            <div key={version.id} style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{version.editedBy?.firstName} {version.editedBy?.lastName}</strong>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {format(new Date(version.createdAt), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
              {version.editReason && (
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Reason: {version.editReason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3 style={{ fontWeight: '600', marginBottom: '16px' }}>Comments</h3>
        
        {comments.length > 0 ? (
          <div style={{ marginBottom: '24px' }}>
            {comments.map((comment) => (
              <div key={comment.id} style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong>{comment.user?.firstName} {comment.user?.lastName}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
                <p>{comment.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>No comments yet</p>
        )}

        <form onSubmit={handleAddComment}>
          <div className="form-group">
            <textarea
              className="form-input"
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={!newComment.trim()}>
            Add Comment
          </button>
        </form>
      </div>
    </div>
  );
}
