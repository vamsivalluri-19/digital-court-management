import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../redux/authSlice';
import { toggleTheme, syncTheme } from '../redux/themeSlice';
import { useLanguage } from '../context/LanguageContext';
import { io } from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';
import api from '../services/api';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Users,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ShieldAlert,
  Gavel,
  BookOpen,
  MessageSquare,
  Activity,
  Globe,
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useSelector((state) => state.auth);
  const themeMode = useSelector((state) => state.theme.mode);
  const { lang, changeLanguage, t } = useLanguage();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync theme class on mount
  useEffect(() => {
    dispatch(syncTheme());
  }, [dispatch]);

  // Socket Connection
  useEffect(() => {
    if (!user) return;
    
    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    // Register user to personal channel
    socket.emit('register_user', user.id);

    // Gracefully handle socket connection errors (e.g., server offline during startup)
    socket.on('connect_error', (err) => {
      console.log('Socket.IO connection deferred: server offline.');
    });

    socket.on('new_notification', (data) => {
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast.success(data.title + ': ' + data.message, {
        icon: '🔔',
        duration: 5000,
        position: 'top-right',
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Fetch initial notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data.success) {
          setNotifications(res.data.data);
          setUnreadCount(res.data.data.filter((n) => !n.isRead).length);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/readall');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Define sidebar navigation items based on User Role
  const getNavItems = () => {
    const items = [];
    
    // Common Dashboard
    items.push({
      label: t('dashboard'),
      path: '/dashboard',
      icon: LayoutDashboard,
    });

    if (user?.role === 'citizen') {
      items.push(
        { label: 'File Case', path: '/cases/new', icon: FileText },
        { label: 'My Cases', path: '/cases', icon: BookOpen },
        { label: 'Hearings Calendar', path: '/hearings', icon: Calendar }
      );
    } else if (user?.role === 'lawyer') {
      items.push(
        { label: 'File New Case', path: '/cases/new', icon: FileText },
        { label: 'Client Cases', path: '/cases', icon: BookOpen },
        { label: 'Hearings Calendar', path: '/hearings', icon: Calendar }
      );
    } else if (user?.role === 'judge') {
      items.push(
        { label: 'Assigned Cases', path: '/cases', icon: Gavel },
        { label: 'Hearing Schedules', path: '/hearings', icon: Calendar }
      );
    } else if (user?.role === 'admin') {
      items.push(
        { label: 'Case Assignment', path: '/cases', icon: Gavel },
        { label: 'Users Approval', path: '/admin/users', icon: Users },
        { label: 'System Analytics', path: '/admin/analytics', icon: Activity },
        { label: 'Audit Logs', path: '/admin/logs', icon: ShieldAlert }
      );
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      <Toaster />

      {/* MOBILE SIDEBAR DRAWER OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR PANEL */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 lg:static lg:block transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out glass-panel border-r bg-white/70 dark:bg-slate-900/70`}
      >
        <div className="h-full flex flex-col justify-between p-6">
          <div>
            {/* LOGO */}
            <div className="flex items-center gap-3 px-2 py-4 mb-8">
              <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/30">
                <Gavel className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                  CourtConnect
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                  E-Governance Portal
                </p>
              </div>
            </div>

            {/* NAV LINKS */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 dark:shadow-indigo-600/10'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* USER FOOTER CARD */}
          <div className="pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
                {user?.name?.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                  {user?.name}
                </h4>
                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  {user?.role}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* HEADER BAR */}
        <header className="glass-nav sticky top-0 z-30 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 lg:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 capitalize">
              {location.pathname === '/dashboard' ? t('welcome') : location.pathname.split('/').pop().replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* LANG SWITCHER */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                <Globe className="w-4 h-4 text-indigo-500" />
                <span className="uppercase">{lang}</span>
              </button>
              <div className="absolute right-0 top-full mt-2 w-32 hidden group-hover:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => changeLanguage('en')}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  English (EN)
                </button>
                <button
                  onClick={() => changeLanguage('hi')}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  हिन्दी (HI)
                </button>
                <button
                  onClick={() => changeLanguage('te')}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  తెలుగు (TE)
                </button>
              </div>
            </div>

            {/* LIGHT/DARK TOGGLE */}
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              {themeMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* NOTIFICATIONS DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setNotifDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-40 animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {t('notifications')}
                      </h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-60 overflow-y-auto pt-2 space-y-2.5">
                      {notifications.length === 0 ? (
                        <p className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
                          No notifications yet.
                        </p>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id || Math.random()}
                            onClick={() => {
                              if (notif.link) navigate(notif.link);
                              setNotifDropdownOpen(false);
                            }}
                            className={`p-2.5 rounded-xl cursor-pointer transition-colors duration-150 ${
                              notif.isRead
                                ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                : 'bg-indigo-50/50 dark:bg-indigo-950/10 hover:bg-indigo-50/70 border-l-2 border-indigo-500'
                            }`}
                          >
                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {notif.title}
                            </h5>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              {notif.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* PROFILE DIRECT LINK */}
            <Link
              to="/profile"
              className="flex items-center gap-2 border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                {user?.name?.charAt(0)}
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 hidden sm:inline max-w-[100px] truncate">
                {user?.name.split(' ')[0]}
              </span>
            </Link>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6 md:p-8 bg-slate-50/40 dark:bg-slate-950/40 grid-bg">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
