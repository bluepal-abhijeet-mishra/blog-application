import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import notificationService from '../api/services/notificationService';

const formatRelativeTime = (isoDate) => {
  if (!isoDate) return '';
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return 'Just now';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  return `${Math.floor(diffMs / day)}d ago`;
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const { data: unreadData } = useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    isError: notificationsError,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(20),
    enabled: !!user && showNotifications,
    refetchInterval: showNotifications ? 30000 : false,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
    },
  });

  const unreadCount = unreadData?.count || 0;
  const notifications = useMemo(() => {
    if (Array.isArray(notificationsData)) {
      return notificationsData;
    }
    if (Array.isArray(notificationsData?.notifications)) {
      return notificationsData.notifications;
    }
    return [];
  }, [notificationsData]);

  const isNotificationRead = (notification) =>
    Boolean(notification?.isRead ?? notification?.read);

  const handleNotificationClick = (notification) => {
    if (!isNotificationRead(notification)) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      if (notification.link.startsWith('http://') || notification.link.startsWith('https://')) {
        window.location.href = notification.link;
      } else {
        navigate(notification.link);
      }
    }
    setShowNotifications(false);
  };

  useEffect(() => {
    const onDocumentClick = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, []);

  // Authenticated Top Bar (Dashboard Style)
  if (user) {
    return (
      <header className="h-[72px] bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-900/80">
        <div className="flex-1 max-w-xl">
          <form onSubmit={handleSearch} className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
            <input
              type="text"
              placeholder="Search reports, insights, and stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
            />
          </form>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="/api/feed.rss"
            target="_blank"
            rel="noreferrer"
            type="application/rss+xml"
            title="BlogSpace RSS Feed"
            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors"
          >
            RSS
          </a>

          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setShowUserMenu(false);
                setShowNotifications((prev) => !prev);
              }}
              className="relative p-2 text-slate-500 hover:text-primary transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
              title="Notifications"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.97 }}
                  className="absolute right-0 top-full mt-3 w-[380px] max-w-[90vw] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-[80] overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Notifications</p>
                    <button
                      onClick={() => markAllReadMutation.mutate()}
                      disabled={markAllReadMutation.isPending || unreadCount === 0}
                      className="text-[10px] font-black uppercase tracking-widest text-primary disabled:opacity-40"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="px-4 py-10 text-center">
                        <p className="text-sm text-slate-400 font-bold">Loading notifications...</p>
                      </div>
                    ) : notificationsError ? (
                      <div className="px-4 py-10 text-center">
                        <p className="text-sm text-rose-500 font-bold">Could not load notifications.</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-10 text-center">
                        <p className="text-sm text-slate-400 font-bold">No notifications yet.</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full text-left px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                            isNotificationRead(notification) ? 'opacity-80' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`mt-1 size-2 rounded-full ${isNotificationRead(notification) ? 'bg-slate-300' : 'bg-primary'}`} />
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-900 dark:text-white">{notification.title}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{notification.message}</p>
                              <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                                {formatRelativeTime(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

          <div className="flex items-center gap-3 relative" ref={userMenuRef}>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{user.displayName}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{user.role}</p>
            </div>

            <button
              onClick={() => {
                setShowNotifications(false);
                setShowUserMenu((prev) => !prev);
              }}
              className="size-10 rounded-xl overflow-hidden border-2 border-transparent hover:border-primary transition-all p-0.5"
            >
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=10b981&color=fff&bold=true&size=80`}
                alt="Profile"
                className="w-full h-full object-cover rounded-lg"
              />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-[60]"
                >
                  <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <span className="material-symbols-outlined text-lg">person</span>
                    Profile Settings
                  </Link>
                  <Link to="/saved-posts" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <span className="material-symbols-outlined text-lg">collections_bookmark</span>
                    Saved Posts
                  </Link>
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
    );
  }

  // Unauthenticated Header (Landing Style)
  return (
    <header className="h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-900 flex items-center justify-between px-6 md:px-12 sticky top-0 z-40">
      <Link to="/" className="flex items-center gap-3">
        <div className="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-2xl">auto_stories</span>
        </div>
        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">BlogSpace</span>
      </Link>

      <div className="hidden md:flex items-center gap-10">
        <Link to="/feed" className="text-sm font-black text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Intelligence Feed</Link>
        <Link to="/search" className="text-sm font-black text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Network Search</Link>
        <a
          href="/api/feed.rss"
          target="_blank"
          rel="noreferrer"
          type="application/rss+xml"
          title="BlogSpace RSS Feed"
          className="text-sm font-black text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
        >
          RSS
        </a>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/login" className="px-6 py-2.5 text-sm font-black text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Login</Link>
        <Link to="/register" className="px-7 py-2.5 bg-primary text-white text-sm font-black rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
          Join Network
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
