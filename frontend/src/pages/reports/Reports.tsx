import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Report, ReportType, ReportStatus } from '../../types';
import { format } from 'date-fns';

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: '' as ReportType | '',
    status: '' as ReportStatus | '',
    startDate: '',
    endDate: '',
    page: 1,
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const params: any = { page: filter.page, limit: 10 };
      if (filter.type) params.type = filter.type;
      if (filter.status) params.status = filter.status;
      if (filter.startDate) params.startDate = filter.startDate;
      if (filter.endDate) params.endDate = filter.endDate;

      const response = await api.get('/reports', { params });
      setReports(response.data.data);
      setPagination({
        total: response.data.meta.total,
        page: response.data.meta.page,
        totalPages: response.data.meta.totalPages,
      });
    } catch (error) {
      console.error('Failed to fetch reports:', error);
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

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Reports</h2>
        <Link to="/reports/new" className="btn btn-primary">
          + New Report
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select
            className="form-input form-select"
            style={{ width: 'auto' }}
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value as ReportType | '', page: 1 })}
          >
            <option value="">All Types</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>

          <select
            className="form-input form-select"
            style={{ width: 'auto' }}
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value as ReportStatus | '', page: 1 })}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
            <option value="locked">Locked</option>
          </select>

          <input
            type="date"
            className="form-input"
            style={{ width: 'auto' }}
            value={filter.startDate}
            onChange={(e) => setFilter({ ...filter, startDate: e.target.value, page: 1 })}
            placeholder="Start Date"
          />

          <input
            type="date"
            className="form-input"
            style={{ width: 'auto' }}
            value={filter.endDate}
            onChange={(e) => setFilter({ ...filter, endDate: e.target.value, page: 1 })}
            placeholder="End Date"
          />
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : reports.length > 0 ? (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>{format(new Date(report.date), 'MMM d, yyyy')}</td>
                    <td style={{ textTransform: 'capitalize' }}>{report.type}</td>
                    <td>{report.title || '-'}</td>
                    <td>
                      <span className={getStatusBadge(report.status)}>{report.status}</span>
                      {report.isLocked && <span style={{ marginLeft: '4px' }}>🔒</span>}
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

            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={filter.page === 1}
                  onClick={() => setFilter({ ...filter, page: filter.page - 1 })}
                >
                  Previous
                </button>
                <span style={{ padding: '8px 16px' }}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={filter.page >= pagination.totalPages}
                  onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <p>No reports found</p>
            <Link to="/reports/new" className="btn btn-primary" style={{ marginTop: '16px' }}>
              Create Your First Report
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
