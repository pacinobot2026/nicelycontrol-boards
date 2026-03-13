import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "../lib/authContext";

const NAV_ITEMS = [
  { id: "control", label: "Command Center", icon: "⚡", href: "/" },
  { id: "commands", label: "Custom Commands", icon: "⌘", href: "/commands" },
  { id: "businesses", label: "Business Board", icon: "◉", href: "/businesses" },
  { id: "team", label: "Team Board", icon: "▦", href: "/teamboard" },
  { id: "vault", label: "Operator Vault", icon: "□", href: "/vault" },
  { id: "projects", label: "Project Board", icon: "▶", href: "/projects" },
  { id: "articles", label: "Article Board", icon: "◈", href: "/articles" },
  { id: "ideas", label: "Idea Board", icon: "☆", href: "/ideas" },
  { id: "video", label: "Video Cue", icon: "⊞", href: "/videocue" },
  { id: "wishlist", label: "Wish List", icon: "⊡", href: "/wishlist" },
  {
    id: "resourcelibrary",
    label: "Resource Library",
    icon: "▣",
    href: "/resourcelibrary",
  },
];

export default function NavigationSidebar() {
  const { pathname } = useRouter();
  const { signOut } = useAuth();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-[1000] bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
      >
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-[999]"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:sticky top-0 left-0 h-screen bg-[#0a0a0a] border-r border-gray-800 flex flex-col z-[1000] transition-transform ${
          mobileOpen
            ? "translate-x-0 w-48"
            : "-translate-x-full md:translate-x-0 w-14"
        }`}
      >
        {/* Logo */}
        <div className="h-14 flex gap-4 ml-4 items-center border-b border-gray-800">
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white w-8 h-8 flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M6 6L18 18M6 18L18 6" />
              </svg>
            </button>
          )}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">P</span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`relative flex items-center h-12 text-gray-500 hover:text-white hover:bg-gray-900 transition-all group no-underline ${
                  mobileOpen ? "px-4 gap-3" : "justify-center"
                } ${isActive ? "text-purple-400 bg-gray-900" : ""}`}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => setMobileOpen(false)}
              >
                <span className="text-lg font-light">{item.icon}</span>

                {/* Mobile expanded: show label inline */}
                {mobileOpen && (
                  <span className="text-sm font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                )}

                {/* Desktop: tooltip on hover */}
                {!mobileOpen && hoveredItem === item.id && (
                  <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md whitespace-nowrap z-50 shadow-2xl border border-gray-700">
                    {item.label}
                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900" />
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="border-t border-gray-800 py-2">
          <button
            onClick={() => signOut()}
            className={`flex items-center w-full h-12 text-gray-500 hover:text-red-400 hover:bg-gray-900 transition-all ${
              mobileOpen ? "px-4 gap-3" : "justify-center"
            }`}
            onMouseEnter={() => setHoveredItem("signout")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>

            {mobileOpen && (
              <span className="text-sm font-medium whitespace-nowrap">
                Sign Out
              </span>
            )}

            {!mobileOpen && hoveredItem === "signout" && (
              <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md whitespace-nowrap z-50 shadow-2xl border border-gray-700">
                Sign Out
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900" />
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
