import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Report, User } from '../../types';
import { format } from 'date-fns';

export default function HODDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, submitted: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reportsRes, usersRes] = await Promise.all([
        api.get('/reports', { params: { limit: 50 } }),
        api.get('/users', { params: { limit: 100 } }),
      ]);

      const allReports = reportsRes.data.data;
      setReports(allReports);
      setUsers(usersRes.data.data);

      const myDeptUsers = usersRes.data.data.filter((u: User) => u.departmentId === user?.departmentId);
      const deptReports = allReports.filter((r: Report) => 
        myDeptUsers.some((u: User) => u.id === r.userId)
      );

      setStats({
        total: deptReports.length,
        pending: deptReports.filter((r: Report) => r.status === 'submitted').length,
        submitted: deptReports.filter((r: Report) => ['submitted', 'reviewed'].includes(r.status)).length,
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
        <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>HOD Dashboard</h2>
        <p style={{ opacity: 0.9 }}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        {user?.department && (
          <p style={{ opacity: 0.8, marginTop: '4px' }}>{user.department.name}</p>
        )}
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Dept. Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{users.filter(u => u.departmentId === user?.departmentId).length}</div>
          <div className="stat-label">Team Members</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Department Reports</h3>
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
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>No reports from your department yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
