import { useState, useEffect } from 'react';
import api from '../../services/api';
import { CompiledReport, ReportType } from '../../types';
import { format } from 'date-fns';

export default function CompiledReports() {
  const [reports, setReports] = useState<CompiledReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '' as ReportType | '', page: 1 });
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateType, setGenerateType] = useState<ReportType>('weekly');
  const [generateDate, setGenerateDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const params: any = { page: filter.page, limit: 10 };
      if (filter.type) params.type = filter.type;

      const response = await api.get('/compiled-reports', { params });
      setReports(response.data.data);
    } catch (error) {
      console.error('Failed to fetch compiled reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (generateType === 'annual') {
        await api.post('/compiled-reports/annual', {
          year: generateYear,
          monthIds: selectedMonths,
        });
      } else if (generateType === 'monthly') {
        await api.post('/compiled-reports/monthly', {
          date: generateDate,
        });
      } else {
        await api.post('/compiled-reports/weekly', {
          date: generateDate,
        });
      }
      setShowGenerateModal(false);
      fetchReports();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to generate report');
    }
  };

  const handleExport = async (id: string, format: 'pdf' | 'docx') => {
    try {
      const response = await api.get(`/compiled-reports/${id}/export`, {
        params: { format },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `compiled-report-${id}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Compiled Reports</h2>
        <button className="btn btn-primary" onClick={() => setShowGenerateModal(true)}>
          + Generate Report
        </button>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            className="form-input form-select"
            style={{ width: 'auto' }}
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value as ReportType | '', page: 1 })}
          >
            <option value="">All Types</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : reports.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Period</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.title}</td>
                  <td style={{ textTransform: 'capitalize' }}>{report.type}</td>
                  <td>
                    {format(new Date(report.dateRangeStart), 'MMM d, yyyy')} - {format(new Date(report.dateRangeEnd), 'MMM d, yyyy')}
                  </td>
                  <td>
                    <span className={`badge badge-${report.status}`}>{report.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleExport(report.id, 'pdf')}
                      >
                        PDF
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleExport(report.id, 'docx')}
                      >
                        DOCX
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>No compiled reports yet</p>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setShowGenerateModal(true)}>
              Generate Your First Report
            </button>
          </div>
        )}
      </div>

      {showGenerateModal && (
        <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Generate Compiled Report</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowGenerateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleGenerate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Report Type</label>
                  <select
                    className="form-input form-select"
                    value={generateType}
                    onChange={(e) => setGenerateType(e.target.value as ReportType)}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>

                {generateType === 'weekly' && (
                  <div className="form-group">
                    <label className="form-label">Week Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={generateDate}
                      onChange={(e) => setGenerateDate(e.target.value)}
                    />
                  </div>
                )}

                {generateType === 'monthly' && (
                  <div className="form-group">
                    <label className="form-label">Month</label>
                    <input
                      type="month"
                      className="form-input"
                      value={generateDate.substring(0, 7)}
                      onChange={(e) => setGenerateDate(e.target.value + '-01')}
                    />
                  </div>
                )}

                {generateType === 'annual' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Year</label>
                      <input
                        type="number"
                        className="form-input"
                        value={generateYear}
                        onChange={(e) => setGenerateYear(parseInt(e.target.value))}
                        min={2000}
                        max={2100}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Include Months (leave empty for all)</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                          <label key={month} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="checkbox"
                              checked={selectedMonths.includes(index + 1)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMonths([...selectedMonths, index + 1]);
                                } else {
                                  setSelectedMonths(selectedMonths.filter((m) => m !== index + 1));
                                }
                              }}
                            />
                            {month}
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
