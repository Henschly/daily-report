import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Department, Deadline } from '../../types';

export default function Settings() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [activeTab, setActiveTab] = useState<'deadlines' | 'departments'>('deadlines');
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [formData, setFormData] = useState({
    departmentId: '',
    type: 'daily' as 'daily' | 'weekly' | 'monthly',
    deadlineTime: '18:00',
    dayOfWeek: 0,
    dayOfMonth: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [deptRes, deadlineRes] = await Promise.all([
        api.get('/departments'),
        api.get('/deadlines'),
      ]);
      setDepartments(deptRes.data.data);
      setDeadlines(deadlineRes.data.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleSaveDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        departmentId: formData.departmentId || null,
        dayOfWeek: formData.type === 'weekly' ? formData.dayOfWeek : null,
        dayOfMonth: formData.type === 'monthly' ? formData.dayOfMonth : null,
      };

      if (editingDeadline) {
        await api.put(`/deadlines/${editingDeadline.id}`, data);
      } else {
        await api.post('/deadlines', data);
      }

      setShowDeadlineModal(false);
      setEditingDeadline(null);
      fetchData();
    } catch (error) {
      console.error('Failed to save deadline:', error);
    }
  };

  const handleDeleteDeadline = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deadline?')) return;
    try {
      await api.delete(`/deadlines/${id}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete deadline:', error);
    }
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/departments', {
        name: formData.departmentId,
        description: '',
      });
      setShowDeptModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save department:', error);
    }
  };

  const openEditDeadline = (deadline: Deadline) => {
    setEditingDeadline(deadline);
    setFormData({
      departmentId: deadline.departmentId || '',
      type: deadline.type,
      deadlineTime: deadline.deadlineTime,
      dayOfWeek: deadline.dayOfWeek || 0,
      dayOfMonth: deadline.dayOfMonth || 1,
    });
    setShowDeadlineModal(true);
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Settings</h2>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'deadlines' ? 'active' : ''}`}
          onClick={() => setActiveTab('deadlines')}
        >
          Deadlines
        </button>
        <button
          className={`tab ${activeTab === 'departments' ? 'active' : ''}`}
          onClick={() => setActiveTab('departments')}
        >
          Departments
        </button>
      </div>

      {activeTab === 'deadlines' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Submission Deadlines</h3>
            <button className="btn btn-primary btn-sm" onClick={() => {
              setEditingDeadline(null);
              setFormData({
                departmentId: '',
                type: 'daily',
                deadlineTime: '18:00',
                dayOfWeek: 0,
                dayOfMonth: 1,
              });
              setShowDeadlineModal(true);
            }}>
              + Add Deadline
            </button>
          </div>

          {deadlines.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Time</th>
                  <th>Day</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deadlines.map((deadline) => (
                  <tr key={deadline.id}>
                    <td>{deadline.department?.name || 'All Departments'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{deadline.type}</td>
                    <td>{deadline.deadlineTime}</td>
                    <td>
                      {deadline.type === 'weekly' 
                        ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][deadline.dayOfWeek || 0]
                        : deadline.type === 'monthly'
                        ? `Day ${deadline.dayOfMonth}`
                        : '-'
                      }
                    </td>
                    <td>
                      <span className={`badge ${deadline.isActive ? 'badge-submitted' : 'badge-draft'}`}>
                        {deadline.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEditDeadline(deadline)}>
                        Edit
                      </button>
                      <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDeleteDeadline(deadline.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <p>No deadlines configured yet</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'departments' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Departments</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowDeptModal(true)}>
              + Add Department
            </button>
          </div>

          {departments.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Units</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.id}>
                    <td>{dept.name}</td>
                    <td>{dept.units?.map(u => u.name).join(', ') || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <p>No departments configured yet</p>
            </div>
          )}
        </div>
      )}

      {showDeadlineModal && (
        <div className="modal-overlay" onClick={() => setShowDeadlineModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingDeadline ? 'Edit Deadline' : 'Add Deadline'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDeadlineModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveDeadline}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-input form-select"
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    className="form-input form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.deadlineTime}
                    onChange={(e) => setFormData({ ...formData, deadlineTime: e.target.value })}
                  />
                </div>
                {formData.type === 'weekly' && (
                  <div className="form-group">
                    <label className="form-label">Day of Week</label>
                    <select
                      className="form-input form-select"
                      value={formData.dayOfWeek}
                      onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                    >
                      <option value={0}>Sunday</option>
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                    </select>
                  </div>
                )}
                {formData.type === 'monthly' && (
                  <div className="form-group">
                    <label className="form-label">Day of Month</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.dayOfMonth}
                      onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                      min={1}
                      max={31}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeadlineModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeptModal && (
        <div className="modal-overlay" onClick={() => setShowDeptModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Department</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDeptModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveDepartment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Department Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    placeholder="Enter department name"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeptModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
