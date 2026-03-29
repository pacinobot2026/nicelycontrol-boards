import { useState } from 'react';

export default function ManageBusinessesModal({ businesses, onClose, onRefresh }) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [loading, setLoading] = useState(false);

  function startEdit(business) {
    setEditingId(business.id);
    setEditName(business.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
  }

  async function saveEdit(business) {
    if (!editName.trim()) return;
    
    setLoading(true);
    try {
      const updatedBusiness = { ...business, name: editName.trim() };
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', business: updatedBusiness })
      });

      if (!res.ok) throw new Error('Failed to update');
      
      setEditingId(null);
      setEditName('');
      await onRefresh();
    } catch (err) {
      alert('Failed to rename business. Please try again.');
      console.error('Rename error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete(business) {
    setLoading(true);
    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', business: { id: business.id } })
      });

      if (!res.ok) throw new Error('Failed to delete');
      
      setDeleteConfirmId(null);
      await onRefresh();
    } catch (err) {
      alert('Failed to delete business. Please try again.');
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e, business) {
    if (e.key === 'Enter') {
      saveEdit(business);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-2xl border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Manage Businesses</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Business List */}
        <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
          {businesses.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No businesses found</p>
          ) : (
            businesses.map((business) => (
              <div
                key={business.id}
                className="flex items-center gap-3 bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-colors"
              >
                {/* Business Name (editable) */}
                {editingId === business.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, business)}
                    className="flex-1 bg-white/10 border border-purple-500 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                    autoFocus
                    disabled={loading}
                  />
                ) : (
                  <span className="flex-1 text-white font-medium">{business.name}</span>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {editingId === business.id ? (
                    <>
                      {/* Save Button */}
                      <button
                        onClick={() => saveEdit(business)}
                        disabled={loading || !editName.trim()}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
                      >
                        Save
                      </button>
                      {/* Cancel Button */}
                      <button
                        onClick={cancelEdit}
                        disabled={loading}
                        className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Edit Button */}
                      <button
                        onClick={() => startEdit(business)}
                        disabled={loading}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-white/5 rounded transition-colors disabled:opacity-50"
                        title="Rename business"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>

                      {/* Delete Button (disabled if last business) */}
                      {deleteConfirmId === business.id ? (
                        <>
                          {/* Confirm Delete */}
                          <div className="flex items-center gap-2 bg-red-900/20 rounded px-2 py-1 border border-red-500/30">
                            <span className="text-red-400 text-sm font-medium">Delete?</span>
                            <button
                              onClick={() => confirmDelete(business)}
                              disabled={loading}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs rounded"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              disabled={loading}
                              className="px-2 py-1 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white text-xs rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(business.id)}
                          disabled={loading || businesses.length === 1}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-white/5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={businesses.length === 1 ? "Cannot delete last business" : "Delete business"}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <p className="text-sm text-gray-400">
            {businesses.length} business{businesses.length !== 1 ? 'es' : ''} total
            {businesses.length === 1 && (
              <span className="ml-2 text-yellow-400">• Cannot delete last business</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
