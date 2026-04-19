import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function AgentCommandCenter() {
  const [agents] = useState({
    article: { id: 'article', name: 'Article Agent', emoji: '📝', status: 'online' },
    funnel: { id: 'funnel', name: 'Funnel Agent', emoji: '🏗️', status: 'online' },
    video: { id: 'video', name: 'Video Agent', emoji: '🎬', status: 'working', task: 'Create clips' },
    research: { id: 'research', name: 'Research Agent', emoji: '🔍', status: 'idle' },
    code: { id: 'code', name: 'Code Agent', emoji: '💻', status: 'idle' },
    design: { id: 'design', name: 'Design Agent', emoji: '🎨', status: 'idle' },
    social: { id: 'social', name: 'Social Agent', emoji: '📱', status: 'idle' },
    email: { id: 'email', name: 'Email Agent', emoji: '📧', status: 'idle' },
    analytics: { id: 'analytics', name: 'Analytics Agent', emoji: '📊', status: 'idle' }
  });

  const [selectedAgent, setSelectedAgent] = useState('video');
  
  const activeCount = Object.values(agents).filter(a => a.status === 'online' || a.status === 'working').length;
  const workingAgents = Object.values(agents).filter(a => a.status === 'working');

  return (
    <>
      <Head>
        <title>AI Agent Command Center</title>
      </Head>

      <div className="min-h-screen bg-[#0f0f23] text-white flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-800 py-4 text-center">
          <h1 className="text-xl font-bold text-blue-400 flex items-center justify-center gap-2">
            <span>📁</span> AI Agent Command Center
          </h1>
        </div>

        {/* Main Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Agent Fleet */}
          <div className="w-64 bg-[#1a1a2e] border-r border-gray-800 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Agent Fleet</span>
              <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-bold">
                9 TOTAL
              </span>
            </div>

            <div className="space-y-2">
              {Object.values(agents).map(agent => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    selectedAgent === agent.id
                      ? 'bg-yellow-500/20 border-2 border-yellow-500'
                      : 'bg-gray-800/50 border-2 border-transparent hover:bg-gray-800'
                  }`}
                >
                  <div className="text-2xl">{agent.emoji}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{agent.name}</div>
                    <div className={`text-xs ${
                      agent.status === 'working' ? 'text-yellow-400' :
                      agent.status === 'online' ? 'text-green-400' :
                      'text-gray-500'
                    }`}>
                      {agent.status === 'working' ? '◉ Working' :
                       agent.status === 'online' ? '● Online' :
                       '○ Idle'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center - Agent Detail */}
          <div className="flex-1 p-8 overflow-y-auto">
            {selectedAgent && agents[selectedAgent] && (
              <>
                {/* Agent Header */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center text-3xl">
                    {agents[selectedAgent].emoji}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      Pacino (Lead Agent)
                    </h2>
                    <p className="text-sm text-gray-400">
                      Coordinating agent fleet and task delegation
                    </p>
                  </div>
                  <div className="ml-auto flex gap-8 text-center">
                    <div>
                      <div className="text-3xl font-bold text-blue-400">{activeCount}</div>
                      <div className="text-xs text-gray-500 uppercase">Active</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-400">0</div>
                      <div className="text-xs text-gray-500 uppercase">Completed</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-purple-400">{workingAgents.length}</div>
                      <div className="text-xs text-gray-500 uppercase">Online</div>
                    </div>
                  </div>
                </div>

                {/* Currently Working Section */}
                {workingAgents.length > 0 && (
                  <div className="border-2 border-yellow-500 rounded-xl p-6 bg-yellow-500/5">
                    <div className="text-xs text-gray-400 uppercase mb-4">Currently Working</div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-purple-500/20 border-2 border-purple-500 rounded-xl flex items-center justify-center text-4xl">
                          {workingAgents[0].emoji}
                        </div>
                        <div>
                          <div className="text-lg font-bold">{workingAgents[0].name}</div>
                          <div className="text-sm text-gray-400">{workingAgents[0].task}</div>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-lg font-bold text-sm">
                        1 ACTIVE
                      </div>
                    </div>
                  </div>
                )}

                {agents[selectedAgent].status === 'online' && (
                  <div className="mt-6 border border-gray-700 rounded-xl p-6 bg-gray-800/30">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">✓</div>
                      <div className="text-sm">Ready for tasks</div>
                    </div>
                  </div>
                )}

                {agents[selectedAgent].status === 'idle' && (
                  <div className="mt-6 border border-gray-700 rounded-xl p-6 bg-gray-800/30">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">○</div>
                      <div className="text-sm">Idle - Spawn session to activate</div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Sidebar - Main Menu */}
          <div className="w-80 bg-[#1a1a2e] border-l border-gray-800 flex flex-col">
            <div className="p-5 border-b border-gray-800">
              <h3 className="font-bold flex items-center gap-2">
                <span>📋</span> Main Menu
              </h3>
            </div>

            {/* Open Tasks */}
            <div className="flex-1 p-5 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Open Tasks</span>
              </div>
              
              <div className="text-center py-12 text-gray-600">
                <div className="text-4xl mb-2 opacity-50">📭</div>
                <div className="text-sm">No open tasks</div>
              </div>
            </div>

            {/* Recently Completed */}
            <div className="flex-1 p-5 border-t border-gray-800 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Recently Completed</span>
                <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs">0</span>
              </div>
              
              <div className="text-center py-12 text-gray-600">
                <div className="text-4xl mb-2 opacity-50">⭕</div>
                <div className="text-sm">No completed tasks yet</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
