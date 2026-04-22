import React, { useState, useEffect } from "react";
import Head from "next/head";
import NavigationSidebar from "../components/NavigationSidebar";

const DEFAULT_STAGES = ["New Lead", "Contacted", "Qualified", "Proposal", "Won", "Lost"];
const LABEL_COLORS = {
  hot: { bg: "#ff0000", text: "#fff" },      // Pure Red - Hot lead
  warm: { bg: "#ff8800", text: "#fff" },     // Pure Orange - Warm lead
  cold: { bg: "#0088ff", text: "#fff" },     // Pure Blue - Cold lead
  callback: { bg: "#bb00ff", text: "#fff" }, // Pure Purple - Callback scheduled
  nurture: { bg: "#00cc44", text: "#fff" },  // Pure Green - Nurture sequence
  dead: { bg: "#888888", text: "#fff" },     // Gray - Dead/unresponsive
};

export default function ProspectBoard() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProspect, setShowAddProspect] = useState(false);
  const [showEditProspect, setShowEditProspect] = useState(null);
  const [draggedProspect, setDraggedProspect] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeStage, setActiveStage] = useState(null);
  const [filterLabel, setFilterLabel] = useState(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchProspects();
  }, []);

  const fetchProspects = async () => {
    try {
      const res = await fetch("/api/prospects");
      const data = await res.json();
      setProspects(data.prospects || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching prospects:", err);
      setLoading(false);
    }
  };

  const saveProspect = async (prospect) => {
    try {
      await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospects: [prospect] }),
      });
      fetchProspects();
    } catch (err) {
      console.error("Error saving prospect:", err);
    }
  };

  const deleteProspect = async (prospectId) => {
    if (!confirm("Delete this prospect?")) return;
    try {
      await fetch("/api/prospects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId }),
      });
      fetchProspects();
    } catch (err) {
      console.error("Error deleting prospect:", err);
    }
  };

  const handleDragStart = (e, prospect) => {
    setDraggedProspect(prospect);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    if (!draggedProspect) return;

    const updatedProspect = { ...draggedProspect, stage: targetStage };
    saveProspect(updatedProspect);
    setDraggedProspect(null);
  };

  const getProspectsByStage = (stage) => {
    let filtered = prospects.filter((p) => p.stage === stage);
    if (filterLabel) {
      filtered = filtered.filter((p) => p.labels?.includes(filterLabel));
    }
    return filtered;
  };

  const addNewProspect = () => {
    const newProspect = {
      id: Date.now().toString(),
      businessName: "",
      contactName: "",
      email: "",
      phone: "",
      location: "",
      score: "",
      notes: "",
      stage: "New Lead",
      labels: [],
      ghlContactId: "",
      hunterEmails: [],
      createdAt: new Date().toISOString(),
    };
    setShowEditProspect(newProspect);
  };

  const ProspectCard = ({ prospect }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, prospect)}
      className="bg-white border border-gray-200 rounded-lg p-4 mb-3 cursor-move hover:shadow-md transition-shadow"
      onClick={() => setShowEditProspect(prospect)}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{prospect.businessName}</h3>
        {prospect.score && (
          <span
            className={`text-xs px-2 py-1 rounded ${
              prospect.score === "hot"
                ? "bg-red-100 text-red-800"
                : prospect.score === "warm"
                ? "bg-orange-100 text-orange-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {prospect.score.toUpperCase()}
          </span>
        )}
      </div>

      {prospect.contactName && (
        <p className="text-sm text-gray-600 mb-1">👤 {prospect.contactName}</p>
      )}
      
      {prospect.email && (
        <p className="text-sm text-gray-600 mb-1">📧 {prospect.email}</p>
      )}
      
      {prospect.phone && (
        <p className="text-sm text-gray-600 mb-1">📞 {prospect.phone}</p>
      )}

      {prospect.location && (
        <p className="text-xs text-gray-500 mb-2">📍 {prospect.location}</p>
      )}

      {prospect.labels && prospect.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {prospect.labels.map((label) => (
            <span
              key={label}
              className="text-xs px-2 py-0.5 rounded"
              style={{
                backgroundColor: LABEL_COLORS[label]?.bg || "#e5e7eb",
                color: LABEL_COLORS[label]?.text || "#000",
              }}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {prospect.notes && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{prospect.notes}</p>
      )}

      <p className="text-xs text-gray-400 mt-2">
        {new Date(prospect.createdAt).toLocaleDateString()}
      </p>
    </div>
  );

  const EditProspectModal = () => {
    if (!showEditProspect) return null;

    const [formData, setFormData] = useState(showEditProspect);

    const handleSave = () => {
      saveProspect(formData);
      setShowEditProspect(null);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {formData.businessName || "New Prospect"}
              </h2>
              <button
                onClick={() => setShowEditProspect(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Business Name *</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="ABC Restaurant"
                />
              </div>

              {/* Contact Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Contact Name</label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="contact@business.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Billings, MT"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Stage */}
                <div>
                  <label className="block text-sm font-medium mb-1">Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    {DEFAULT_STAGES.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Score */}
                <div>
                  <label className="block text-sm font-medium mb-1">Score</label>
                  <select
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">None</option>
                    <option value="hot">🔥 Hot</option>
                    <option value="warm">🟡 Warm</option>
                    <option value="cold">⚪ Cold</option>
                  </select>
                </div>
              </div>

              {/* Labels */}
              <div>
                <label className="block text-sm font-medium mb-1">Labels</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(LABEL_COLORS).map((label) => (
                    <button
                      key={label}
                      onClick={() => {
                        const labels = formData.labels || [];
                        const updated = labels.includes(label)
                          ? labels.filter((l) => l !== label)
                          : [...labels, label];
                        setFormData({ ...formData, labels: updated });
                      }}
                      className={`px-3 py-1 rounded text-sm ${
                        formData.labels?.includes(label)
                          ? "ring-2 ring-blue-500"
                          : ""
                      }`}
                      style={{
                        backgroundColor: LABEL_COLORS[label].bg,
                        color: LABEL_COLORS[label].text,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows="4"
                  placeholder="Internal notes about this prospect..."
                />
              </div>

              {/* GHL Contact ID (read-only if exists) */}
              {formData.ghlContactId && (
                <div>
                  <label className="block text-sm font-medium mb-1">GHL Contact ID</label>
                  <input
                    type="text"
                    value={formData.ghlContactId}
                    readOnly
                    className="w-full border rounded px-3 py-2 bg-gray-50"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save
              </button>
              {formData.id && (
                <button
                  onClick={() => {
                    deleteProspect(formData.id);
                    setShowEditProspect(null);
                  }}
                  className="px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => setShowEditProspect(null)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <NavigationSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading prospects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Prospect Board - NicelyControl</title>
      </Head>

      <div className="flex h-screen bg-gray-50">
        <NavigationSidebar />

        <div className="flex-1 overflow-auto">
          {/* Header */}
          <div className="bg-white border-b sticky top-0 z-10">
            <div className="p-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">🎯 Prospect Board</h1>
                <p className="text-sm text-gray-600">
                  {prospects.length} total prospects
                </p>
              </div>

              <div className="flex gap-2">
                {/* Label Filter */}
                <select
                  value={filterLabel || ""}
                  onChange={(e) => setFilterLabel(e.target.value || null)}
                  className="border rounded px-3 py-2 text-sm"
                >
                  <option value="">All Labels</option>
                  {Object.keys(LABEL_COLORS).map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={addNewProspect}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  <span>+</span>
                  <span>Add Prospect</span>
                </button>
              </div>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="p-4">
            {isMobile ? (
              // Mobile: Tabs
              <div>
                <div className="flex overflow-x-auto gap-2 mb-4 pb-2">
                  {DEFAULT_STAGES.map((stage) => {
                    const count = getProspectsByStage(stage).length;
                    return (
                      <button
                        key={stage}
                        onClick={() => setActiveStage(stage)}
                        className={`px-4 py-2 rounded whitespace-nowrap ${
                          activeStage === stage
                            ? "bg-blue-600 text-white"
                            : "bg-white border"
                        }`}
                      >
                        {stage} ({count})
                      </button>
                    );
                  })}
                </div>

                {activeStage && (
                  <div>
                    {getProspectsByStage(activeStage).map((prospect) => (
                      <ProspectCard key={prospect.id} prospect={prospect} />
                    ))}
                    {getProspectsByStage(activeStage).length === 0 && (
                      <p className="text-center text-gray-400 py-8">No prospects</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Desktop: Columns
              <div className="grid grid-cols-6 gap-4">
                {DEFAULT_STAGES.map((stage) => {
                  const stageProspects = getProspectsByStage(stage);
                  return (
                    <div
                      key={stage}
                      className="bg-gray-100 rounded-lg p-3"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, stage)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm">{stage}</h3>
                        <span className="text-xs bg-white px-2 py-1 rounded">
                          {stageProspects.length}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {stageProspects.map((prospect) => (
                          <ProspectCard key={prospect.id} prospect={prospect} />
                        ))}
                        {stageProspects.length === 0 && (
                          <p className="text-center text-gray-400 text-sm py-8">
                            Drop here
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditProspect && <EditProspectModal />}
    </>
  );
}
