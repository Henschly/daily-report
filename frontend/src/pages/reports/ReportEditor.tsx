import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import api from '../../services/api';
import { Report, ReportType } from '../../types';
import { format } from 'date-fns';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      gap: '4px', 
      padding: '8px', 
      borderBottom: '1px solid var(--color-border)',
      flexWrap: 'wrap',
      backgroundColor: '#f8fafc'
    }}>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`btn btn-ghost btn-sm ${editor.isActive('bold') ? 'active' : ''}`}
        style={{ fontWeight: 'bold' }}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`btn btn-ghost btn-sm ${editor.isActive('italic') ? 'active' : ''}`}
        style={{ fontStyle: 'italic' }}
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`btn btn-ghost btn-sm ${editor.isActive('strike') ? 'active' : ''}`}
        style={{ textDecoration: 'line-through' }}
      >
        S
      </button>
      <span style={{ width: '1px', backgroundColor: 'var(--color-border)', margin: '0 4px' }}></span>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`btn btn-ghost btn-sm ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`btn btn-ghost btn-sm ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`btn btn-ghost btn-sm ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
      >
        H3
      </button>
      <span style={{ width: '1px', backgroundColor: 'var(--color-border)', margin: '0 4px' }}></span>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`btn btn-ghost btn-sm ${editor.isActive('bulletList') ? 'active' : ''}`}
      >
        • List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`btn btn-ghost btn-sm ${editor.isActive('orderedList') ? 'active' : ''}`}
      >
        1. List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`btn btn-ghost btn-sm ${editor.isActive('taskList') ? 'active' : ''}`}
      >
        ✓ Task
      </button>
      <span style={{ width: '1px', backgroundColor: 'var(--color-border)', margin: '0 4px' }}></span>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`btn btn-ghost btn-sm ${editor.isActive('codeBlock') ? 'active' : ''}`}
      >
        {'</>'}
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`btn btn-ghost btn-sm ${editor.isActive('blockquote') ? 'active' : ''}`}
      >
        "Quote"
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        className="btn btn-ghost btn-sm"
      >
        Table
      </button>
      <button
        type="button"
        onClick={addImage}
        className="btn btn-ghost btn-sm"
      >
        Image
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="btn btn-ghost btn-sm"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="btn btn-ghost btn-sm"
      >
        Redo
      </button>
    </div>
  );
};

export default function ReportEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [reportDate, setReportDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        style: 'padding: 16px; min-height: 300px; outline: none;',
      },
    },
  });

  useEffect(() => {
    if (id) {
      fetchReport();
    }
  }, [id]);

  const fetchReport = async () => {
    try {
      const response = await api.get(`/reports/${id}`);
      const reportData = response.data.data;
      setReport(reportData);
      setReportType(reportData.type);
      setReportDate(format(new Date(reportData.date), 'yyyy-MM-dd'));
      
      if (editor && reportData.content) {
        editor.commands.setContent(reportData.content);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    }
  };

  const handleSave = async (submit = false) => {
    if (!editor) return;

    setIsSaving(true);
    try {
      const content = editor.getJSON();
      const data = {
        type: reportType,
        content,
        date: reportDate,
        year: new Date(reportDate).getFullYear(),
        month: new Date(reportDate).getMonth() + 1,
        weekNumber: Math.ceil(new Date(reportDate).getDate() / 7),
      };

      if (id) {
        await api.put(`/reports/${id}`, data);
      } else {
        const response = await api.post('/reports', data);
        if (!id) {
          navigate(`/reports/${response.data.data.id}/edit`, { replace: true });
        }
      }

      setLastSaved(new Date());

      if (submit) {
        if (id) {
          await api.post(`/reports/${id}/submit`);
        }
        navigate('/reports');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save report');
    } finally {
      setIsSaving(false);
    }
  };

  const autoSave = useCallback(() => {
    if (editor && id) {
      handleSave();
    }
  }, [editor, id]);

  useEffect(() => {
    if (id && editor) {
      const interval = setInterval(autoSave, 60000);
      return () => clearInterval(interval);
    }
  }, [id, editor, autoSave]);

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600' }}>
          {id ? 'Edit Report' : 'New Report'}
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {lastSaved && (
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Last saved: {format(lastSaved, 'h:mm a')}
            </span>
          )}
          <button className="btn btn-secondary" onClick={() => navigate('/reports')}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => handleSave(false)}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => handleSave(true)}
            disabled={isSaving}
          >
            Submit
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label className="form-label">Report Type</label>
            <select
              className="form-input form-select"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              disabled={!!id}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-input"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              disabled={!!id}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <MenuBar editor={editor} />
        <EditorContent editor={editor} />
      </div>

      {report?.isLocked && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          backgroundColor: '#fee2e2', 
          borderRadius: '8px',
          color: '#dc2626'
        }}>
          This report is locked by HR and cannot be edited.
        </div>
      )}
    </div>
  );
}
