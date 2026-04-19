import { useState, useEffect } from 'react';
import Head from 'next/head';
import NavigationSidebar from '../components/NavigationSidebar';
import withAuth from '../lib/withAuth';

function AgentCommandCenter() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agents, setAgents] = useState({
    article: { id: 'article', name: 'Article Agent', emoji: '📝', type: 'article', status: 'online', currentTask: null },
    funnel: { id: 'funnel', name: 'Funnel Agent', emoji: '🏗️', type: 'funnel', status: 'online', currentTask: null },
    video: { id: 'video', name: 'Video Agent', emoji: '🎬', type: 'video', status: 'working', currentTask: 'Create clips' },
    research: { id: 'research', name: 'Research Agent', emoji: '🔍', type: 'research', status: 'idle', currentTask: null },
    code: { id: 'code', name: 'Code Agent', emoji: '💻', type: 'code', status: 'idle', currentTask: null },
    design: { id: 'design', name: 'Design Agent', emoji: '🎨', type: 'design', status: 'idle', currentTask: null },
    social: { id: 'social', name: 'Social Agent', emoji: '📱', type: 'social', status: 'idle', currentTask: null },
    email: { id: 'email', name: 'Email Agent', emoji: '📧', type: 'email', status: 'idle', currentTask: null },
    analytics: { id: 'analytics', name: 'Analytics Agent', emoji: '📊', type: 'analytics', status: 'idle', currentTask: null }
  });

  const activeCount = Object.values(agents).filter(a => a.status === 'online' || a.status === 'working').length;
  const workingAgents = Object.values(agents).filter(a => a.status === 'working');

  return (
    <div className="flex min-h-screen bg-[#0a0a1a] text-white">
      <Head>
        <title>AI Agent Command Center - NicelyControl</title>
      </Head>

      <NavigationSidebar />

      <main className="flex-1 flex">
        {/* Left Panel - Agent Fleet */}
        <div className="w-64 bg-black/30 border-r border-white/10 p-5 overflow-y-auto">
          <div className="flex justify-between items-center mb-4 text-xs text-gray-400 uppercase tracking-wide">
            <span>Agent Fleet</span>
            <span className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full text-xs">
              {Object.keys(agents).length} Total
            </span>
          </div>

          <div className="space-y-2">
            {Object.values(agents).map(agent => (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedAgent === agent.id
                    ? 'bg-cyan-500/10 border-cyan-500'
                    : agent.status === 'working'
                    ? 'bg-yellow-500/10 border-yellow-500/50'
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}
              >
                {agent.status !== 'idle' && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-green-400 rounded-r shadow-lg shadow-green-400/50" />
                )}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                  agent.type === 'article' ? 'bg-cyan-500/15' :
                  agent.type === 'funnel' ? 'bg-red-500/15' :
                  agent.type === 'video' ? 'bg-purple-500/15' :
                  agent.type === 'research' ? 'bg-yellow-500/15' :
                  agent.type === 'code' ? 'bg-green-500/15' :
                  agent.type === 'design' ? 'bg-pink-500/15' :
                  agent.type === 'social' ? 'bg-blue-500/15' :
                  agent.type === 'email' ? 'bg-orange-500/15' :
                  'bg-purple-500/15'
                }`}>
                  {agent.emoji}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{agent.name}</div>
                  <div className={`text-xs ${
                    agent.status === 'working' ? 'text-yellow-400' :
                    agent.status === 'online' ? 'text-green-400' :
                    'text-gray-600'
                  }`}>
                    {agent.status === 'working' ? '⟳ Working' :
                     agent.status === 'online' ? '● Online' :
                     '○ Idle'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Panel - Agent Detail */}
        <div className="flex-1 p-8">
          {selectedAgent ? (
            <>
              {/* Agent Header */}
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${
                  agents[selectedAgent].type === 'article' ? 'bg-cyan-500/15' :
                  agents[selectedAgent].type === 'funnel' ? 'bg-red-500/15' :
                  agents[selectedAgent].type === 'video' ? 'bg-purple-500/15' :
                  agents[selectedAgent].type === 'research' ? 'bg-yellow-500/15' :
                  agents[selectedAgent].type === 'code' ? 'bg-green-500/15' :
                  agents[selectedAgent].type === 'design' ? 'bg-pink-500/15' :
                  agents[selectedAgent].type === 'social' ? 'bg-blue-500/15' :
                  agents[selectedAgent].type === 'email' ? 'bg-orange-500/15' :
                  'bg-purple-500/15'
                }`}>
                  {agents[selectedAgent].emoji}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{agents[selectedAgent].name}</h1>
                  <div className={`text-sm flex items-center gap-2 ${
                    agents[selectedAgent].status === 'working' ? 'text-yellow-400' :
                    agents[selectedAgent].status === 'online' ? 'text-green-400' :
                    'text-gray-400'
                  }`}>
                    <span>●</span>
                    <span>{agents[selectedAgent].status === 'working' ? 'Working' :
                           agents[selectedAgent].status === 'online' ? 'Online' : 'Idle'}</span>
                  </div>
                </div>
              </div>

              {/* Current Task */}
              {agents[selectedAgent].status === 'working' && agents[selectedAgent].currentTask && (
                <div className="bg-yellow-500/10 border-l-4 border-yellow-500 rounded-lg p-6 mb-6">
                  <div className="text-xs text-gray-400 uppercase mb-2">Currently Working</div>
                  <div className="text-lg font-semibold">{agents[selectedAgent].currentTask}</div>
                </div>
              )}

              {agents[selectedAgent].status === 'online' && (
                <div className="bg-green-500/10 border-l-4 border-green-500 rounded-lg p-6 mb-6">
                  <div className="text-xs text-gray-400 uppercase mb-2">Status</div>
                  <div className="text-lg font-semibold">Ready for tasks</div>
                </div>
              )}

              {agents[selectedAgent].status === 'idle' && (
                <div className="bg-gray-500/10 border-l-4 border-gray-500 rounded-lg p-6 mb-6">
                  <div className="text-xs text-gray-400 uppercase mb-2">Status</div>
                  <div className="text-lg font-semibold">Idle - Spawn session to activate</div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">🤖</div>
                <div className="text-xl font-bold">Select an agent to view details</div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Main Menu */}
        <div className="w-96 bg-black/30 border-l border-white/10 flex flex-col">
          <div className="p-5 border-b border-white/10">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              📋 Main Menu
            </h2>
          </div>

          {/* Stats */}
          <div className="p-5 grid grid-cols-3 gap-3 border-b border-white/10">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{activeCount}</div>
              <div className="text-xs text-gray-400">ACTIVE</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">0</div>
              <div className="text-xs text-gray-400">COMPLETED</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{workingAgents.length}</div>
              <div className="text-xs text-gray-400">ONLINE</div>
            </div>
          </div>

          {/* Open Tasks */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Open Tasks</span>
              <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-xs">0</span>
            </div>
            <div className="text-center py-8 text-gray-600">
              <div className="text-3xl mb-2 opacity-50">📭</div>
              <p className="text-sm">No open tasks</p>
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="flex-1 overflow-y-auto p-5 border-t border-white/10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Recently Completed</span>
              <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs">0</span>
            </div>
            <div className="text-center py-8 text-gray-600">
              <div className="text-3xl mb-2 opacity-50">🎯</div>
              <p className="text-sm">No completed tasks yet</p>
            </div>
          </div>
        </div>
      </main>

      {/* Currently Working Section */}
      {workingAgents.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-yellow-500/10 border border-yellow-500/50 rounded-2xl p-4 backdrop-blur-xl max-w-md">
          <div className="text-xs text-gray-400 uppercase mb-2">Currently Working</div>
          <div className="flex items-center gap-3">
            <div className="text-2xl">{workingAgents[0].emoji}</div>
            <div>
              <div className="font-semibold">{workingAgents[0].name}</div>
              <div className="text-sm text-gray-400">{workingAgents[0].currentTask}</div>
            </div>
            <div className="ml-auto bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">
              1 ACTIVE
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(AgentCommandCenter);
