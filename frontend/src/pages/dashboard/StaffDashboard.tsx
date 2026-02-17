import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Report } from '../../types';
import { format } from 'date-fns';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [todayReport, setTodayReport] = useState<Report | null>(null);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [stats, setStats] = useState({ weekly: 0, monthly: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [todayRes, reportsRes] = await Promise.all([
        api.get('/reports/today'),
        api.get('/reports', { params: { limit: 10 } }),
      ]);
      
      setTodayReport(todayRes.data.data);
      
      const reports = reportsRes.data.data;
      setRecentReports(reports);

      const weeklyReports = reports.filter((r: Report) => {
        const date = new Date(r.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= weekAgo;
      });
      
      const monthlyReports = reports.filter((r: Report) => {
        const date = new Date(r.date);
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        return date >= monthAgo;
      });

      setStats({
        weekly: weeklyReports.length,
        monthly: monthlyReports.length,
        pending: reports.filter((r: Report) => r.status === 'draft').length,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
        <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Welcome back, {user?.firstName}!</h2>
        <p style={{ opacity: 0.9 }}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-value">{stats.weekly}</div>
          <div className="stat-label">Reports This Week</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.monthly}</div>
          <div className="stat-label">Reports This Month</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Draft Reports</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Today's Report</h3>
          {!todayReport && (
            <Link to="/reports/new" className="btn btn-primary">
              + Create Report
            </Link>
          )}
        </div>

        {todayReport ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <div>
              <span className={getStatusBadge(todayReport.status)}>{todayReport.status}</span>
              <p style={{ marginTop: '8px', color: 'var(--color-text-secondary)' }}>
                Last updated: {format(new Date(todayReport.updatedAt), 'MMM d, h:mm a')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to={`/reports/${todayReport.id}`} className="btn btn-secondary btn-sm">
                View
              </Link>
              {!todayReport.isLocked && (
                <Link to={`/reports/${todayReport.id}/edit`} className="btn btn-primary btn-sm">
                  Edit
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '32px' }}>
            <p>You haven't submitted a report for today yet.</p>
            <Link to="/reports/new" className="btn btn-primary" style={{ marginTop: '16px' }}>
              Create Today's Report
            </Link>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Recent Reports</h3>
          <Link to="/reports" className="btn btn-ghost btn-sm">View All</Link>
        </div>

        {recentReports.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.slice(0, 5).map((report) => (
                <tr key={report.id}>
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
            <p>No reports yet. Create your first report!</p>
          </div>
        )}
      </div>
    </div>
  );
}
