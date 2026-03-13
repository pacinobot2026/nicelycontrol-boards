import { useState, useEffect } from "react";
import Head from "next/head";
import NavigationSidebar from "../components/NavigationSidebar";
import withAuth from "../lib/withAuth";
import { useAuth } from "../lib/authContext";



const categoryColors = {
  business: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  email: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  content: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  links: "bg-green-500/20 text-green-400 border-green-500/30",
  contacts: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  system: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const categoryLabels = {
  business: "\ud83d\ude80 Business",
  email: "\ud83d\udce7 Email",
  content: "\ud83c\udf93 Content",
  links: "\ud83d\udd17 Links & Pages",
  contacts: "\ud83d\udc64 Contacts",
  system: "\u2699\ufe0f System",
};

const groupLabels = {
  titanium: "\u26a1 Titanium",
  resources: "\ud83d\udcda Resources",
  external: "\ud83d\udd0c External Software",
};

function CommandsPage() {
  const { session } = useAuth();
  const [commands, setCommands] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCommand, setExpandedCommand] = useState(null);

  useEffect(() => {
    if (!session?.access_token) return;
    fetch('/api/commands', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCommands(data);
      })
      .catch(() => {});
  }, [session]);

  const filteredCommands = commands.filter((cmd) => {
    const matchesGroup = selectedGroup === "all" || cmd.command_group === selectedGroup;
    const matchesSearch =
      cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const groups = ["all", "titanium", "resources", "external"];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <Head>
        <title>Command Center</title>
      </Head>
      <NavigationSidebar />
      <div className="flex-1 text-white p-4 md:p-8 md:pt-8 pt-16 overflow-hidden relative">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl 2xl:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {"\ud83c\udfac"} Command Center
              </h1>
              <p className="text-gray-400 mt-2">
                Quick reference for all Pacino shortcodes and workflows
              </p>
            </div>
            <a
              href="/"
              className="ml-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              {"\u2190"} Back to Dashboard
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(groupLabels).map(([key, label]) => {
              const count = commands.filter((c) => c.command_group === key).length;
              return (
                <div
                  key={key}
                  className="bg-gray-900/50 border border-gray-800 rounded-lg p-3"
                >
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              );
            })}
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-400">
                {commands.length}
              </div>
              <div className="text-xs text-gray-400">Total Commands</div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Search commands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            <div className="flex gap-2 flex-wrap">
              {groups.map((grp) => (
                <button
                  key={grp}
                  onClick={() => setSelectedGroup(grp)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    selectedGroup === grp
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {grp === "all" ? "All" : groupLabels[grp]}
                </button>
              ))}
            </div>
          </div>

          {/* Commands Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCommands.map((cmd) => (
              <div
                key={cmd.name}
                className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-all cursor-pointer relative"
                onClick={() =>
                  setExpandedCommand(
                    expandedCommand === cmd.name ? null : cmd.name,
                  )
                }
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <code className="text-lg font-bold text-blue-400">
                      {cmd.name}
                    </code>
                    <span
                      className={`px-2 py-1 rounded text-xs border ${categoryColors[cmd.category]}`}
                    >
                      {categoryLabels[cmd.category]}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">
                    {cmd.description}
                  </p>

                  {cmd.logo && (
                    <div className="absolute bottom-4 right-4 group">
                      <img src={cmd.logo} alt="" className="w-5 h-5" />
                      <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {cmd.logo.includes("globalcontrol")
                          ? "Global Control"
                          : cmd.logo.includes("mintbird")
                            ? "MintBird"
                            : cmd.logo.includes("coursesprout")
                              ? "Course Sprout"
                              : cmd.logo.includes("letterman")
                                ? "Letterman"
                                : ""}
                      </div>
                    </div>
                  )}

                  {cmd.shortcut && (
                    <div className="text-xs text-gray-500 mb-3">
                      {"\ud83d\udca1"} {cmd.shortcut}
                    </div>
                  )}

                  {expandedCommand === cmd.name && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <p className="text-xs text-gray-500 mb-2">
                        Workflow Steps:
                      </p>
                      <ol className="space-y-2">
                        {cmd.steps.map((step, i) => (
                          <li
                            key={i}
                            className="text-sm text-gray-400 flex gap-2"
                          >
                            <span className="text-blue-500 font-mono">
                              {i + 1}.
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="mt-3 text-xs text-gray-500">
                    {expandedCommand === cmd.name
                      ? "Click to collapse \u2191"
                      : "Click to expand \u2193"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCommands.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No commands found matching your search.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>Last updated: March 1, 2026</p>
          <p className="mt-2">
            Need a new command? Tell Chad and I'll build it.
          </p>
        </div>
      </div>
    </div>
  );
}

export default withAuth(CommandsPage);
