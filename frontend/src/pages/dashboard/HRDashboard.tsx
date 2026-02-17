import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Report, User } from '../../types';
import { format } from 'date-fns';

export default function HRDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, reviewed: 0, locked: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', departmentId: '' });

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const params: any = { limit: 50 };
      if (filter.status) params.status = filter.status;
      
      const [reportsRes, usersRes] = await Promise.all([
        api.get('/reports', { params }),
        api.get('/users', { params: { limit: 100 } }),
      ]);

      setReports(reportsRes.data.data);
      setUsers(usersRes.data.data);

      const allReports = reportsRes.data.data;
      setStats({
        total: allReports.length,
        pending: allReports.filter((r: Report) => r.status === 'submitted').length,
        reviewed: allReports.filter((r: Report) => r.status === 'reviewed').length,
        locked: allReports.filter((r: Report) => r.status === 'locked').length,
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>HR Dashboard</h2>
        <p style={{ opacity: 0.9 }}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.reviewed}</div>
          <div className="stat-label">Reviewed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{users.length}</div>
          <div className="stat-label">Active Users</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Reports</h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              className="form-input form-select"
              style={{ width: 'auto' }}
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="reviewed">Reviewed</option>
              <option value="locked">Locked</option>
            </select>
          </div>
        </div>

        {reports.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Date</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.slice(0, 10).map((report) => (
                <tr key={report.id}>
                  <td>{report.user?.firstName} {report.user?.lastName}</td>
                  <td>{format(new Date(report.date), 'MMM d, yyyy')}</td>
                  <td style={{ textTransform: 'capitalize' }}>{report.type}</td>
                  <td>
                    <span className={getStatusBadge(report.status)}>{report.status}</span>
                  </td>
                  <td>
                    <Link to={`/reports/${report.id}`} className="btn btn-ghost btn-sm">
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>No reports found</p>
          </div>
        )}
      </div>
    </div>
  );
}
