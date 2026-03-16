export default function ProjectSidebar({ projects, selectedProject, onSelectProject, onAddProject }) {
  const totalCount = projects.reduce((sum, p) => sum + p.count, 0);

  return (
    <div className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-white font-semibold">Projects</h2>
        {onAddProject && (
          <button
            onClick={onAddProject}
            className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            title="Add project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* All Projects */}
        <button
          onClick={() => onSelectProject(null)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg mb-1 text-sm transition-colors ${
            selectedProject === null
              ? 'bg-purple-600/20 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <span className="flex items-center gap-2">
            <span>📁</span>
            <span>All Projects</span>
          </span>
          <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full">
            {totalCount}
          </span>
        </button>

        <div className="h-px bg-gray-800 my-2" />

        {/* Individual Projects */}
        {projects.map(project => (
          <button
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg mb-1 text-sm transition-colors ${
              selectedProject === project.id
                ? 'bg-purple-600/20 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>{project.icon}</span>
              <span className="truncate">{project.name}</span>
            </span>
            <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full">
              {project.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
