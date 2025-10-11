import { ReactNode } from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  Settings, 
  Instagram, 
  LogOut,
  Shield,
  Zap
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onSignOut: () => void;
  userEmail: string;
  userName: string;
  isAdmin: boolean;
  isAIActive?: boolean;
}

export default function Layout({ 
  children, 
  currentPage, 
  onNavigate, 
  onSignOut,
  userEmail,
  userName,
  isAdmin,
  isAIActive = true
}: LayoutProps) {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pilotage', label: 'Pilotage', icon: BarChart3 },
    { id: 'configuration', label: 'Configuration', icon: Settings },
    { id: 'booster', label: 'Booster Insta', icon: Instagram },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 flex flex-col">
        {/* Logo & Brand */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">BetterCoach</h1>
              <p className="text-white/60 text-sm">Assistant Coach IA</p>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-white font-medium mb-1">{userName}</p>
            <p className="text-white/60 text-sm mb-3">{userEmail}</p>
            <button
              onClick={onSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white/80 hover:text-white rounded-lg transition-all text-sm"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}

          {/* Admin Button (si admin) */}
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentPage === 'admin'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-purple-400 hover:text-white hover:bg-purple-500/10 border border-purple-500/30'
              }`}
            >
              <Shield className="w-5 h-5" />
              <span className="font-medium">Admin</span>
            </button>
          )}
        </nav>

        {/* IA Status Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl p-4 border border-emerald-500/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isAIActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-white font-semibold text-sm">IA Actif</span>
              </div>
              <span className="text-emerald-400 text-xs font-bold">En ligne • 24/7</span>
            </div>
            <p className="text-white/60 text-xs">
              Votre assistant traite les conversations automatiquement
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}