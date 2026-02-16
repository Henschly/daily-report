import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Department, Unit } from '../../types';

export default function Register() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/departments')
      .then((res) => setDepartments(res.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (departmentId) {
      api.get(`/departments/${departmentId}/units`)
        .then((res) => setUnits(res.data.data))
        .catch(() => {});
    } else {
      setUnits([]);
    }
  }, [departmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step < 3) {
      setStep(step + 1);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email,
        password,
        firstName,
        lastName,
        departmentId: departmentId || undefined,
        unitId: unitId || undefined,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-logo">
          <h1>Daily Report</h1>
          <p className="text-secondary">Create your account</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${step === 1 ? 'active' : ''}`}>Account</button>
          <button className={`auth-tab ${step === 2 ? 'active' : ''}`}>Profile</button>
          <button className={`auth-tab ${step === 3 ? 'active' : ''}`}>Department</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="form-group">
              <div className="form-error" style={{ padding: '12px', backgroundColor: '#fee2e2', borderRadius: '8px' }}>
                {error}
              </div>
            </div>
          )}

          {step === 1 && (
            <>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={8}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  className="form-input form-select"
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    setUnitId('');
                  }}
                >
                  <option value="">Select a department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              {units.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select
                    className="form-input form-select"
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                  >
                    <option value="">Select a unit (optional)</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>{unit.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            {step > 1 && (
              <button type="button" className="btn btn-secondary" onClick={() => setStep(step - 1)}>
                Back
              </button>
            )}
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isLoading}>
              {isLoading ? 'Creating Account...' : step < 3 ? 'Next' : 'Create Account'}
            </button>
          </div>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center' }}>
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
