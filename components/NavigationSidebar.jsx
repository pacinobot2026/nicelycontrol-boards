import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/authContext';

const NAV_ITEMS = [
  { id: 'control',    label: 'Command Center',  icon: '⚡', href: 'https://dashboard-gilt-one-zc4y5uu95v.vercel.app' },
  { id: 'commands',   label: 'Custom Commands', icon: '⌘', href: 'https://dashboard-gilt-one-zc4y5uu95v.vercel.app/commands' },
  { id: 'businesses', label: 'Business Board',  icon: '◉', href: '/businesses' },
  { id: 'team',       label: 'Team Board',      icon: '▦', href: 'https://kanban-rho-ivory.vercel.app' },
  { id: 'vault',      label: 'Operator Vault',  icon: '□', href: '/vault' },
  { id: 'projects',   label: 'Project Board',   icon: '▶', href: '/projects' },
  { id: 'articles',   label: 'Article Board',   icon: '◈', href: '/articles' },
  { id: 'ideas',      label: 'Idea Board',      icon: '☆', href: '/ideas' },
  { id: 'video',      label: 'Video Cue',       icon: '⊞', href: '/videocue' },
  { id: 'wishlist',   label: 'Wish List',       icon: '⊡', href: '/wishlist' },
  { id: 'resourcelibrary',  label: 'Resource Library',icon: '▣', href: '/resourcelibrary' },
];

export default function NavigationSidebar() {
  const { user, signOut } = useAuth();
  const { pathname } = useRouter();
  const [hoveredItem, setHoveredItem] = useState(null);

  return (
    <div 
      className="w-14 h-full bg-[#0a0a0a] border-r border-gray-900 flex flex-col"
      style={{ minHeight: '100vh' }}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-center border-b border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">P</span>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-2">
        {NAV_ITEMS.map((item) => {
          const isExternal = item.href.startsWith('http');
          const isActive = pathname === item.href;
          
          const linkClass = `relative flex items-center justify-center h-12 text-gray-500 hover:text-white hover:bg-gray-900 transition-all group ${
            isActive ? 'text-purple-400 bg-gray-900' : ''
          }`;

          const content = (
            <>
              {/* Icon */}
              <span className="text-lg font-light">{item.icon}</span>
              
              {/* Tooltip */}
              {hoveredItem === item.id && (
                <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md whitespace-nowrap z-50 shadow-2xl border border-gray-700">
                  {item.label}
                  {/* Arrow */}
                  <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900" />
                </div>
              )}
            </>
          );

          if (isExternal) {
            return (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {content}
              </a>
            );
          }

          return (
            <a
              key={item.id}
              href={item.href}
              className={linkClass}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {content}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
