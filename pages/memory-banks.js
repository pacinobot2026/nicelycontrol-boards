import React, { useState, useEffect } from "react";
import Head from "next/head";
import NavigationSidebar from "../components/NavigationSidebar";
import withAuth from "../lib/withAuth";
import { useAuth } from "../lib/authContext";

function MemoryBanks() {
  const { session } = useAuth();
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBank, setNewBank] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [sources, setSources] = useState([]);
  const [loadingSources, setLoadingSources] = useState(false);

  const fetchBanks = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/memory-banks", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      setBanks(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchSources = async (bankId) => {
    if (!session?.access_token) return;
    setLoadingSources(true);
    try {
      const res = await fetch(`/api/memory-sources?bank_id=${bankId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      setSources(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    setLoadingSources(false);
  };

  useEffect(() => { fetchBanks(); }, [session]);

  useEffect(() => {
    if (selectedBank) fetchSources(selectedBank.id);
  }, [selectedBank]);

  const createBank = async () => {
    if (!newBank.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/memory-banks", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBank),
      });
      const data = await res.json();
      if (data.id) {
        setBanks([data, ...banks]);
        setShowAddModal(false);
        setNewBank({ name: "", description: "" });
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const deleteBank = async (id) => {
    if (!confirm("Delete this memory bank and all its sources?")) return;
    await fetch(`/api/memory-banks?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setBanks(banks.filter((b) => b.id !== id));
    if (selectedBank?.id === id) setSelectedBank(null);
  };

  return (
    <>
      <Head><title>Memory Banks | NicelyControl</title></Head>
      <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
        <NavigationSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Memory Banks</h1>
              <p className="text-gray-400 text-sm mt-1">Persistent knowledge bases your AI bot can always reference</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
            >
              + New Bank
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Banks List */}
            <div className="lg:col-span-1">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Banks ({banks.length})</h2>
              {loading ? (
                <div className="text-gray-500 text-sm py-8 text-center">Loading...</div>
              ) : banks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🧠</div>
                  <p className="text-gray-400 text-sm">No memory banks yet</p>
                  <button onClick={() => setShowAddModal(true)} className="mt-3 text-orange-400 text-sm hover:text-orange-300">Create one</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {banks.map((bank) => (
                    <div
                      key={bank.id}
                      onClick={() => setSelectedBank(bank)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedBank?.id === bank.id
                          ? "bg-orange-500/10 border-orange-500/50"
                          : "bg-[#111] border-gray-800 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-white text-sm">{bank.name}</h3>
                          {bank.description && <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{bank.description}</p>}
                        </div>
                        <div className="text-right">
                          <div className="text-orange-400 font-bold text-sm">{bank.memory_sources?.[0]?.count || bank.source_count || 0}</div>
                          <div className="text-gray-500 text-xs">sources</div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteBank(bank.id); }}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sources Panel */}
            <div className="lg:col-span-2">
              {!selectedBank ? (
                <div className="flex items-center justify-center h-64 text-gray-600">
                  <div className="text-center">
                    <div className="text-5xl mb-3">👈</div>
                    <p>Select a memory bank to view its sources</p>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-lg font-bold text-white mb-4">{selectedBank.name}</h2>
                  {loadingSources ? (
                    <div className="text-gray-500 text-center py-8">Loading sources...</div>
                  ) : sources.length === 0 ? (
                    <div className="text-center py-12 bg-[#111] border border-gray-800 rounded-xl">
                      <div className="text-4xl mb-3">📄</div>
                      <p className="text-gray-400">No sources yet</p>
                      <p className="text-gray-600 text-sm mt-1">Use /memory bank command to add content</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sources.map((source) => (
                        <div key={source.id} className="bg-[#111] border border-gray-800 rounded-xl p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{source.source_type === 'pdf' ? '📄' : source.source_type === 'video' ? '🎥' : '📝'}</span>
                              <div>
                                <h4 className="font-semibold text-white text-sm">{source.filename || 'Untitled Source'}</h4>
                                <p className="text-gray-500 text-xs">{source.source_type} • {new Date(source.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                          {source.summary && (
                            <p className="text-gray-400 text-sm mt-3 line-clamp-3">{source.summary}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">New Memory Bank</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Bank name (e.g. Shadow Workshop)"
                value={newBank.name}
                onChange={(e) => setNewBank({ ...newBank, name: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newBank.description}
                onChange={(e) => setNewBank({ ...newBank, description: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors">Cancel</button>
              <button
                onClick={createBank}
                disabled={saving || !newBank.name.trim()}
                className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {saving ? "Creating..." : "Create Bank"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default withAuth(MemoryBanks);
