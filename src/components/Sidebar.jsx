import { useApp } from '../App';
import { supabase } from '../supabaseClient';
import { LayoutDashboard, Upload, Users, Zap, Send, History, LogOut, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'import', label: 'Import Data', icon: Upload },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'triggers', label: 'Smart Triggers', icon: Zap },
  { id: 'campaign', label: 'Campaign', icon: Send },
  { id: 'history', label: 'History', icon: History },
  { id: 'integrations', label: 'Integrations', icon: Settings },
];

export default function Sidebar({ currentPage, setCurrentPage }) {
  const { session, profile, customers } = useApp();

  const initial = profile?.shop_name
    ? profile.shop_name.charAt(0).toUpperCase()
    : session?.user?.email?.charAt(0).toUpperCase() || 'U';

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>⚡ ReActivate AI</h1>
        <span>WhatsApp CRM</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
            >
              <Icon className="nav-icon" size={18} />
              <span>{item.label}</span>
              {item.id === 'customers' && customers.length > 0 && (
                <span className="nav-badge">{customers.length}</span>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={handleLogout} title="Click to logout">
          <div className="sidebar-avatar">{initial}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">
              {profile?.shop_name || session?.user?.email?.split('@')[0] || 'User'}
            </div>
            <div className="sidebar-user-plan">
              {profile?.plan === 'paid' ? '⭐ PRO' : 'FREE PLAN'}
            </div>
          </div>
          <LogOut size={16} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>
    </aside>
  );
}
