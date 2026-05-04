import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';

/* ── Design tokens ── */
const T = {
  canvas: '#ffffff',
  hairline: '#e5e5e5',
  ink: '#000000',
  body: '#737373',
  mute: '#a3a3a3',
  soft: '#fafafa',
};

const Sidebar = ({ open, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminUsername');
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Students', icon: Users, path: '/students' },
  ];

  const w = open ? 220 : 60;

  return (
    <aside style={{
      width: w,
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
      flexShrink: 0,
      background: T.canvas,
      borderRight: `1px solid ${T.hairline}`,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 50,
      overflow: 'hidden',
    }}>
      {/* Brand */}
      <div style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: open ? 'space-between' : 'center',
        padding: open ? '0 14px 0 18px' : '0',
        borderBottom: `1px solid ${T.hairline}`,
        flexShrink: 0,
      }}>
        {open && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, overflow: 'hidden' }}>
            <div style={{
              width: 28, height: 28,
              background: T.ink,
              borderRadius: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', flexShrink: 0,
            }}>
              <GraduationCap size={15} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: T.ink, whiteSpace: 'nowrap' }}>EduManager</div>
            </div>
          </div>
        )}
        <button onClick={onToggle} style={{
          background: 'none', border: 'none', borderRadius: 9999,
          width: 28, height: 28, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', color: T.mute,
          flexShrink: 0, transition: 'color 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = T.ink}
          onMouseLeave={e => e.currentTarget.style.color = T.mute}
        >
          {open ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ label, icon, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              title={!open ? label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: open ? 10 : 0,
                justifyContent: open ? 'flex-start' : 'center',
                padding: open ? '9px 12px' : '9px 0',
                borderRadius: 9999,
                border: 'none',
                background: active ? T.soft : 'none',
                color: active ? T.ink : T.body,
                fontWeight: active ? 600 : 400,
                fontSize: 14,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                transition: 'all 0.12s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = T.soft; e.currentTarget.style.color = T.ink; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = T.body; } }}
            >
              {React.createElement(icon, { size: 17, style: { flexShrink: 0 } })}
              {open && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '8px 8px 16px', borderTop: `1px solid ${T.hairline}` }}>
        <button
          onClick={handleLogout}
          title={!open ? 'Logout' : undefined}
          style={{
            display: 'flex', alignItems: 'center', gap: open ? 10 : 0,
            justifyContent: open ? 'flex-start' : 'center',
            padding: open ? '9px 12px' : '9px 0',
            borderRadius: 9999, border: 'none', background: 'none',
            color: T.mute, fontSize: 14, fontWeight: 400,
            cursor: 'pointer', width: '100%', transition: 'all 0.12s',
            whiteSpace: 'nowrap', overflow: 'hidden', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.soft; e.currentTarget.style.color = T.ink; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = T.mute; }}
        >
          <LogOut size={17} style={{ flexShrink: 0 }} />
          {open && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
