import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';

export default function Layout() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isHR = user?.role === 'hr' || user?.role === 'admin';
  const isHOD = user?.role === 'hod';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">Daily Report</div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Menu</div>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span>📊</span>
              Dashboard
            </NavLink>
            <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span>📝</span>
              Reports
            </NavLink>
            <NavLink to="/compiled-reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span>📑</span>
              Compiled Reports
            </NavLink>
          </div>
          
          {(isHR || isHOD) && (
            <div className="nav-section">
              <div className="nav-section-title">Management</div>
              {isHR && (
                <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <span>⚙️</span>
                  Settings
                </NavLink>
              )}
            </div>
          )}
        </nav>
      </aside>

      <main className="main-content">
        <header className="header">
          <h1 className="header-title">
            {user?.role === 'staff' ? 'Staff Dashboard' : 
             user?.role === 'hr' || user?.role === 'admin' ? 'HR Dashboard' : 
             'HOD Dashboard'}
          </h1>
          <div className="header-actions">
            <div className="dropdown" ref={notifRef}>
              <button 
                className="btn btn-ghost notification-badge"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <span>🔔</span>
                {unreadCount > 0 && <span className="badge" style={{ marginLeft: '4px' }}>{unreadCount}</span>}
              </button>
              {showNotifications && (
                <div className="dropdown-menu" style={{ width: '380px', maxHeight: '400px', overflowY: 'auto' }}>
                  <div style={{ padding: '12px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>Notifications</strong>
                    {unreadCount > 0 && (
                      <button className="btn btn-ghost btn-sm" onClick={markAllAsRead}>Mark all read</button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notif) => (
                      <div
                        key={notif.id}
                        className="dropdown-item"
                        style={{ 
                          backgroundColor: notif.isRead ? 'transparent' : '#f0f9ff',
                          cursor: 'pointer'
                        }}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div style={{ fontWeight: notif.isRead ? 'normal' : '600' }}>{notif.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{notif.message}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          {format(new Date(notif.createdAt), 'MMM d, h:mm a')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="dropdown" ref={userMenuRef}>
              <button 
                className="btn btn-ghost"
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <div className="avatar">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <span>{user?.firstName} {user?.lastName}</span>
              </button>
              {showUserMenu && (
                <div className="dropdown-menu">
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontWeight: '600' }}>{user?.firstName} {user?.lastName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{user?.email}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-primary)', marginTop: '2px' }}>{user?.role.toUpperCase()}</div>
                  </div>
                  <button className="dropdown-item" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
