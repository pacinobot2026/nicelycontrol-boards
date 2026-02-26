import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/authContext';

const NAV_ITEMS = [
  { id: 'video',     label: 'Video Board',    icon: '🎬', href: '/dashboard',                                        enabled: true },
  { id: 'articles',  label: 'Article Board',  icon: '📰', href: '/articles',                                         enabled: true },
  { id: 'businesses',label: 'Business Board', icon: '🏢', href: '/businesses',                                       enabled: true },
  { id: 'vault',     label: 'Operator Vault', icon: '🔐', href: '/vault',                                            enabled: true },
  { id: 'ideas',     label: 'Idea Board',     icon: '💡', href: '/ideas',                                            enabled: true },
  { id: 'bookmarks', label: 'Bookmarks',      icon: '📑', href: '/bookmarks',                                        enabled: true },
  { id: 'shopping',  label: 'Shopping/Watch', icon: '🛒', href: '/shopping',                                         enabled: true },
  { id: 'projects',  label: 'Projects',       icon: '📂', href: '/projects',                                         enabled: true },
  { id: 'control',   label: 'Command Center', icon: '🎛️', href: 'https://dashboard-gilt-one-zc4y5uu95v.vercel.app', enabled: true },
  { id: 'team',      label: 'Team Board',     icon: '👥', href: 'https://kanban-rho-ivory.vercel.app',               enabled: true },
  { id: 'openclaw',  label: 'OpenClaw Board', icon: '🤖', href: '/openclaw',                                         enabled: true },
];

export default function NavigationSidebar() {
  const { user, signOut } = useAuth();
  const { pathname } = useRouter();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'You';
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const showLabel = isMobile || isExpanded;

  const linkClass = (href) => [
    'relative flex items-center gap-3 px-3 py-3 text-gray-300 no-underline transition-colors hover:bg-gray-800 hover:text-white',
    pathname === href ? 'bg-purple-900/20 border-r-2 border-purple-500' : '',
  ].join(' ');

  return (
    <>
      {/* Mobile Hamburger Button */}
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="fixed top-4 right-4 z-40 p-2 bg-gray-900 border border-gray-800 rounded-lg"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={[
          'flex flex-col z-50 transition-all duration-300 min-h-screen border-gray-800',
          isMobile ? 'fixed border-l' : 'static border-r',
          isMobile && !isMobileMenuOpen ? '-right-64' : 'right-0',
        ].join(' ')}
        style={{ width: showLabel ? '192px' : '56px', background: '#111827' }}
      >
        {/* Desktop toggle */}
        {!isMobile && (
          <div className="flex justify-center p-3 border-b border-gray-800">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Mobile header */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎬</span>
              <span className="text-white font-bold">Menu</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 py-2">
          {NAV_ITEMS.filter(item => item.enabled).map((item) => {
            const isExternal = item.href.startsWith('http');
            const itemContent = (
              <>
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                {showLabel && (
                  <span className="text-sm font-medium whitespace-nowrap overflow-hidden">{item.label}</span>
                )}
                {/* Tooltip */}
                {!isMobile && !isExpanded && hoveredItem === item.id && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap z-50 border border-gray-700 shadow-lg">
                    {item.label}
                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-800" />
                  </div>
                )}
              </>
            );

            const sharedProps = {
              key: item.id,
              className: linkClass(item.href),
              onMouseEnter: () => !isMobile && !isExpanded && setHoveredItem(item.id),
              onMouseLeave: () => setHoveredItem(null),
              onClick: () => isMobile && setIsMobileMenuOpen(false),
            };

            if (isExternal) {
              return (
                <a {...sharedProps} href={item.href} target="_blank" rel="noopener noreferrer">
                  {itemContent}
                </a>
              );
            }

            return (
              <Link {...sharedProps} href={item.href}>
                {itemContent}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: logo + sign out */}
        <div className="p-3 border-t border-gray-800 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl flex-shrink-0">🎬</span>
            {showLabel && <span className="text-sm font-bold text-white whitespace-nowrap overflow-hidden">{firstName}</span>}
          </div>
          {showLabel && (
            <button
              onClick={signOut}
              className="w-full text-left text-xs text-gray-500 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer py-1"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </>
  );
}
