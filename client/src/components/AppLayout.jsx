import { useState, createContext, useContext } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconLogout, IconMenu, IconX, IconChevronRight } from './Icons';

// Sidebar collapsed context so pages can know sidebar state
export const SidebarContext = createContext(false);

const ROLE_NAV = {
  customer: [
    {
      section: 'Menu',
      items: [
        { to: '/dashboard', label: 'Dashboard',    icon: 'home'    },
        { to: '/book',      label: 'Book Delivery', icon: 'plus'   },
      ],
    },
  ],
  admin: [
    {
      section: 'Operations',
      items: [
        { to: '/admin', label: 'Command Center', icon: 'grid' },
      ],
    },
  ],
  driver: [
    {
      section: 'Dispatch',
      items: [
        { to: '/driver', label: 'My Deliveries', icon: 'truck' },
      ],
    },
  ],
};

function NavIcon({ name, className = 'w-5 h-5' }) {
  const base = `${className} shrink-0`;
  const icons = {
    home: (
      <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
      </svg>
    ),
    plus: (
      <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
    truck: (
      <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0H3m10 0a2 2 0 104 0m-4 0a2 2 0 114 0m6-6v6m0 0a2 2 0 11-4 0m4 0H17m0-6h-3.5a1.5 1.5 0 00-1.5 1.5v.5h5V10z" />
      </svg>
    ),
    grid: (
      <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm-10 9a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5zm10-2a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
      </svg>
    ),
  };
  return icons[name] || null;
}

// Role → page title map
const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/book':      'Book Delivery',
  '/admin':     'Command Center',
  '/driver':    'My Deliveries',
};

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sections   = ROLE_NAV[user?.role] || [];
  const roleLabel  = { admin: 'Administrator', driver: 'Driver', customer: 'Customer' }[user?.role] || '';
  const pageTitle  = PAGE_TITLES[location.pathname] || 'SlotShip';
  const handleLogout = () => { logout(); navigate('/login'); };

  const sidebarW   = collapsed ? 'w-[68px]' : 'w-[220px]';
  const marginL    = collapsed ? 'lg:ml-[68px]' : 'lg:ml-[220px]';

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group/link ${
      isActive
        ? 'bg-blaze text-white shadow-lg shadow-blaze/25'
        : 'text-muted hover:text-soft-white hover:bg-dark-hover'
    }`;

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className={`flex items-center border-b border-dark-border/40 h-16 px-4 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-9 h-9 rounded-xl bg-blaze flex items-center justify-center shadow-lg shadow-blaze/30 shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0H3m10 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
        </div>
        {!collapsed && (
          <div>
            <p className="font-heading font-bold text-soft-white text-sm leading-none">SlotShip</p>
            <p className="text-[10px] text-muted mt-0.5">Delivery Platform</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {sections.map(({ section, items }) => (
          <div key={section}>
            {!collapsed && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-dark-border px-3 mb-2">{section}</p>
            )}
            <ul className="space-y-0.5">
              {items.map(({ to, label, icon }) => (
                <li key={to}>
                  <NavLink to={to} onClick={() => setMobileOpen(false)} className={linkClasses} title={collapsed ? label : undefined}>
                    <NavIcon name={icon} className="w-5 h-5" />
                    {!collapsed && <span className="truncate">{label}</span>}
                    {/* Tooltip when collapsed */}
                    {collapsed && (
                      <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-dark-hover border border-dark-border text-soft-white text-xs rounded-lg
                                       opacity-0 pointer-events-none group-hover/link:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl">
                        {label}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User / collapse */}
      <div className={`border-t border-dark-border/40 p-3 space-y-2`}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-1 py-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-deepsea to-[#0a7a82] flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-dark-border">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-soft-white truncate leading-tight">{user?.name}</p>
              <p className="text-[10px] text-muted">{roleLabel}</p>
            </div>
            <button onClick={handleLogout} title="Sign out"
              className="p-1.5 rounded-lg text-muted hover:text-blaze hover:bg-dark-hover transition-colors shrink-0">
              <IconLogout className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} title="Sign out"
            className="flex items-center justify-center w-full py-2.5 rounded-xl text-muted hover:text-blaze hover:bg-dark-hover transition-colors">
            <IconLogout className="w-5 h-5" />
          </button>
        )}
        {/* Collapse toggle — desktop only */}
        <button onClick={() => setCollapsed(c => !c)}
          className="hidden lg:flex items-center gap-2 w-full px-2 py-2 rounded-xl text-xs text-muted hover:text-soft-white hover:bg-dark-hover transition-colors">
          <IconChevronRight className={`w-4 h-4 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <SidebarContext.Provider value={collapsed}>
      <div className="min-h-screen bg-mirage flex">
        {/* Desktop sidebar with smooth width transition */}
        <aside className={`hidden lg:block ${sidebarW} bg-[#111c23] fixed inset-y-0 left-0 z-30 border-r border-dark-border/40 transition-all duration-250 ease-in-out`}>
          <SidebarContent />
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="relative w-[220px] h-full bg-[#111c23] border-r border-dark-border/40">
              <button onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-3 p-1.5 text-muted hover:text-soft-white rounded-lg hover:bg-dark-hover transition-colors z-10">
                <IconX className="w-5 h-5" />
              </button>
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* Main content */}
        <div className={`flex-1 ${marginL} flex flex-col min-h-screen transition-all duration-250 ease-in-out`}>
          {/* Topbar */}
          <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-4 lg:px-6
                             bg-mirage/95 backdrop-blur-md border-b border-dark-border/40">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 -ml-1 text-muted hover:text-soft-white rounded-xl hover:bg-dark-hover transition-colors"
                onClick={() => setMobileOpen(true)}>
                <IconMenu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-heading text-base font-bold text-soft-white leading-none">{pageTitle}</h1>
                <p className="text-xs text-muted mt-0.5 hidden sm:block">{roleLabel} Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted hidden md:block">{user?.name}</span>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-deepsea to-[#0a7a82] flex items-center justify-center text-white text-sm font-bold ring-2 ring-dark-border shadow-lg">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            </div>
          </header>

          {/* Page */}
          <main className="flex-1 px-4 lg:px-6 py-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
