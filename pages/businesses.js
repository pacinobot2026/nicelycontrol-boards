import React, { useState, useEffect } from "react";
import Head from "next/head";
import NavigationSidebar from "../components/NavigationSidebar";
import { getCache, setCache } from "../lib/cache";

const DEFAULT_COLUMNS = ["Marketing", "Follow-up", "Research", "Delivery"];
const LABEL_COLORS = {
  urgent: { bg: "#dc2626", text: "#fff" },
  pending: { bg: "#f59e0b", text: "#000" },
  done: { bg: "#10b981", text: "#fff" },
  draft: { bg: "#6b7280", text: "#fff" },
  review: { bg: "#8b5cf6", text: "#fff" },
  blocked: { bg: "#ef4444", text: "#fff" },
};

export default function BusinessBoard() {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddBusiness, setShowAddBusiness] = useState(false);
  const [showAddCard, setShowAddCard] = useState(null); // column name or null
  const [showEditCard, setShowEditCard] = useState(null);
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newCard, setNewCard] = useState({
    title: "",
    description: "",
    labels: [],
    column: "",
  });
  const [showResources, setShowResources] = useState(false);
  const [newResource, setNewResource] = useState({
    title: "",
    url: "",
    type: "link",
  });
  const [showAddResource, setShowAddResource] = useState(false);
  const [draggedCard, setDraggedCard] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null); // for mobile column tabs
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    // Check cache first
    const cached = getCache('businesses');
    if (cached) {
      setBusinesses(cached.businesses || []);
      if (cached.businesses?.length > 0 && !selectedBusiness) {
        setSelectedBusiness(cached.businesses[0]);
      }
      setLoading(false);
    }

    // Fetch fresh data
    try {
      const res = await fetch("/api/businesses");
      const data = await res.json();
      setBusinesses(data.businesses || []);
      if (data.businesses?.length > 0 && !selectedBusiness) {
        setSelectedBusiness(data.businesses[0]);
      }
      setCache('businesses', { businesses: data.businesses || [] });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching businesses:", err);
      setLoading(false);
    }
  };

  const saveBusiness = async (business) => {
    try {
      await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", business }),
      });
    } catch (err) {
      console.error("Error saving business:", err);
    }
  };

  const handleAddBusiness = async () => {
    if (!newBusinessName.trim()) return;
    const newBiz = {
      id: Date.now().toString(),
      name: newBusinessName.trim(),
      cards: [],
      resources: [],
      columns: DEFAULT_COLUMNS,
      createdAt: new Date().toISOString(),
    };
    const updated = [...businesses, newBiz];
    setBusinesses(updated);
    setSelectedBusiness(newBiz);
    setNewBusinessName("");
    setShowAddBusiness(false);
    await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", business: newBiz }),
    });
  };

  const handleAddCard = async () => {
    if (!newCard.title.trim() || !showAddCard) return;
    const card = {
      id: Date.now().toString(),
      title: newCard.title.trim(),
      description: newCard.description.trim(),
      labels: newCard.labels,
      column: showAddCard,
      createdAt: new Date().toISOString(),
    };
    const updatedBiz = {
      ...selectedBusiness,
      cards: [...(selectedBusiness.cards || []), card],
    };
    setSelectedBusiness(updatedBiz);
    setBusinesses(
      businesses.map((b) => (b.id === updatedBiz.id ? updatedBiz : b)),
    );
    setNewCard({ title: "", description: "", labels: [], column: "" });
    setShowAddCard(null);
    await saveBusiness(updatedBiz);
  };

  const handleUpdateCard = async (cardId, updates) => {
    const updatedCards = selectedBusiness.cards.map((c) =>
      c.id === cardId ? { ...c, ...updates } : c,
    );
    const updatedBiz = { ...selectedBusiness, cards: updatedCards };
    setSelectedBusiness(updatedBiz);
    setBusinesses(
      businesses.map((b) => (b.id === updatedBiz.id ? updatedBiz : b)),
    );
    await saveBusiness(updatedBiz);
  };

  const handleDeleteCard = async (cardId) => {
    const updatedCards = selectedBusiness.cards.filter((c) => c.id !== cardId);
    const updatedBiz = { ...selectedBusiness, cards: updatedCards };
    setSelectedBusiness(updatedBiz);
    setBusinesses(
      businesses.map((b) => (b.id === updatedBiz.id ? updatedBiz : b)),
    );
    setShowEditCard(null);
    await saveBusiness(updatedBiz);
  };

  const handleMoveCard = async (cardId, newColumn) => {
    await handleUpdateCard(cardId, { column: newColumn });
  };

  const handleAddResource = async () => {
    if (!newResource.title.trim()) return;
    const resource = {
      id: Date.now().toString(),
      ...newResource,
      createdAt: new Date().toISOString(),
    };
    const updatedBiz = {
      ...selectedBusiness,
      resources: [...(selectedBusiness.resources || []), resource],
    };
    setSelectedBusiness(updatedBiz);
    setBusinesses(
      businesses.map((b) => (b.id === updatedBiz.id ? updatedBiz : b)),
    );
    setNewResource({ title: "", url: "", type: "link" });
    setShowAddResource(false);
    await saveBusiness(updatedBiz);
  };

  const handleDeleteResource = async (resourceId) => {
    const updatedResources = selectedBusiness.resources.filter(
      (r) => r.id !== resourceId,
    );
    const updatedBiz = { ...selectedBusiness, resources: updatedResources };
    setSelectedBusiness(updatedBiz);
    setBusinesses(
      businesses.map((b) => (b.id === updatedBiz.id ? updatedBiz : b)),
    );
    await saveBusiness(updatedBiz);
  };

  const toggleLabel = (label) => {
    if (newCard.labels.includes(label)) {
      setNewCard({
        ...newCard,
        labels: newCard.labels.filter((l) => l !== label),
      });
    } else {
      setNewCard({ ...newCard, labels: [...newCard.labels, label] });
    }
  };

  const handleDragStart = (e, card) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, column) => {
    e.preventDefault();
    if (draggedCard && draggedCard.column !== column) {
      await handleMoveCard(draggedCard.id, column);
    }
    setDraggedCard(null);
  };

  if (loading) {
    return (
      <div
        style={{ display: "flex", minHeight: "100vh", background: "#0D1423" }}
      >
        <Head>
          <title>Business Board</title>
        </Head>
        <NavigationSidebar />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
          }}
        >
          Loading businesses...
        </div>
      </div>
    );
  }

  const columns = selectedBusiness?.columns || DEFAULT_COLUMNS;
  const cards = selectedBusiness?.cards || [];
  const resources = selectedBusiness?.resources || [];

  // Calculate progress
  const getColumnProgress = (column) => {
    const columnCards = cards.filter((c) => c.column === column);
    if (columnCards.length === 0) return { done: 0, total: 0, percent: 0 };
    const done = columnCards.filter((c) => c.labels?.includes("done")).length;
    return {
      done,
      total: columnCards.length,
      percent: Math.round((done / columnCards.length) * 100),
    };
  };

  const overallProgress = () => {
    if (cards.length === 0) return { done: 0, total: 0, percent: 0 };
    const done = cards.filter((c) => c.labels?.includes("done")).length;
    return {
      done,
      total: cards.length,
      percent: Math.round((done / cards.length) * 100),
    };
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0D1423" }}>
      <Head>
        <title>Business Board</title>
      </Head>
      <NavigationSidebar />

      <main
        style={{
          flex: 1,
          minWidth: 0,
          overflowX: "auto",
          padding: isMobile ? "16px" : "24px",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: "24px",
              flexWrap: "wrap",
              gap: "12px",
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
                width: isMobile ? "100%" : "auto",
              }}
            >
              <h1
                style={{
                  fontSize: isMobile ? "22px" : "28px",
                  fontWeight: "700",
                  color: "#fff",
                  margin: 0,
                }}
              >
                🏢 Business Board
              </h1>

              {/* Business Dropdown */}
              <select
                value={selectedBusiness?.id || ""}
                onChange={(e) => {
                  const biz = businesses.find((b) => b.id === e.target.value);
                  setSelectedBusiness(biz);
                }}
                style={{
                  background: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  color: "#fff",
                  fontSize: "15px",
                  cursor: "pointer",
                  minWidth: isMobile ? "100%" : "200px",
                  flex: isMobile ? "1" : "none",
                }}
              >
                {businesses.length === 0 && (
                  <option value="">No businesses yet</option>
                )}
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowAddBusiness(true)}
                style={{
                  background: "#8b5cf6",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                + Add Business
              </button>
            </div>

            {selectedBusiness && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                {/* Overall Progress */}
                <div
                  style={{
                    background: "#1f2937",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    minWidth: isMobile ? "100%" : "280px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                      Overall Progress
                    </span>
                    <span
                      style={{
                        color: "#fff",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      {overallProgress().done}/{overallProgress().total} (
                      {overallProgress().percent}%)
                    </span>
                  </div>
                  <div
                    style={{
                      background: "#374151",
                      borderRadius: "4px",
                      height: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        background:
                          overallProgress().percent === 100
                            ? "#10b981"
                            : "#8b5cf6",
                        height: "100%",
                        width: `${overallProgress().percent}%`,
                        borderRadius: "4px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowResources(!showResources)}
                  style={{
                    background: showResources ? "#8b5cf6" : "#374151",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  📎 Resources ({resources.length})
                </button>
              </div>
            )}
          </div>

          {/* Resources Panel */}
          {showResources && selectedBusiness && (
            <div
              style={{
                background: "#1f2937",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "24px",
                border: "1px solid #374151",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h3 style={{ color: "#fff", margin: 0, fontSize: "18px" }}>
                  📎 Resources for {selectedBusiness.name}
                </h3>
                <button
                  onClick={() => setShowAddResource(true)}
                  style={{
                    background: "#8b5cf6",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    color: "#fff",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  + Add Resource
                </button>
              </div>

              {resources.length === 0 ? (
                <p style={{ color: "#9ca3af", margin: 0 }}>
                  No resources yet. Add links, docs, or notes.
                </p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  {resources.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        background: "#111827",
                        borderRadius: "8px",
                        padding: "12px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        border: "1px solid #374151",
                      }}
                    >
                      <span>
                        {r.type === "link"
                          ? "🔗"
                          : r.type === "doc"
                            ? "📄"
                            : "📝"}
                      </span>
                      {r.url ? (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#8b5cf6", textDecoration: "none" }}
                        >
                          {r.title}
                        </a>
                      ) : (
                        <span style={{ color: "#d1d5db" }}>{r.title}</span>
                      )}
                      <button
                        onClick={() => handleDeleteResource(r.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Resource Modal */}
              {showAddResource && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "16px",
                    background: "#111827",
                    borderRadius: "8px",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Resource title"
                    value={newResource.title}
                    onChange={(e) =>
                      setNewResource({ ...newResource, title: e.target.value })
                    }
                    style={{
                      width: "100%",
                      background: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                      padding: "10px",
                      color: "#fff",
                      marginBottom: "10px",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="URL (optional)"
                    value={newResource.url}
                    onChange={(e) =>
                      setNewResource({ ...newResource, url: e.target.value })
                    }
                    style={{
                      width: "100%",
                      background: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                      padding: "10px",
                      color: "#fff",
                      marginBottom: "10px",
                    }}
                  />
                  <div style={{ display: "flex", gap: "10px" }}>
                    <select
                      value={newResource.type}
                      onChange={(e) =>
                        setNewResource({ ...newResource, type: e.target.value })
                      }
                      style={{
                        background: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "6px",
                        padding: "10px",
                        color: "#fff",
                      }}
                    >
                      <option value="link">🔗 Link</option>
                      <option value="doc">📄 Document</option>
                      <option value="note">📝 Note</option>
                    </select>
                    <button
                      onClick={handleAddResource}
                      style={{
                        background: "#10b981",
                        border: "none",
                        borderRadius: "6px",
                        padding: "10px 16px",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowAddResource(false)}
                      style={{
                        background: "#374151",
                        border: "none",
                        borderRadius: "6px",
                        padding: "10px 16px",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Column Tabs */}
          {selectedBusiness && isMobile && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "16px",
                overflowX: "auto",
                paddingBottom: "8px",
              }}
            >
              {columns.map((col) => (
                <button
                  key={col}
                  onClick={() => setActiveColumn(col)}
                  style={{
                    background:
                      (activeColumn || columns[0]) === col
                        ? "#8b5cf6"
                        : "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {col} ({cards.filter((c) => c.column === col).length})
                </button>
              ))}
            </div>
          )}

          {/* Kanban Board */}
          {selectedBusiness ? (
            <div
              style={{
                display: isMobile ? "block" : "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : `repeat(${columns.length}, 1fr)`,
                gap: "16px",
                minHeight: isMobile ? "auto" : "60vh",
              }}
            >
              {(isMobile ? [activeColumn || columns[0]] : columns).map(
                (column) => (
                  <div
                    key={column}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column)}
                    style={{
                      background: "#111827",
                      borderRadius: "12px",
                      padding: "16px",
                      border: "1px solid #1f2937",
                    }}
                  >
                    {/* Column Header */}
                    <div style={{ marginBottom: "16px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "8px",
                        }}
                      >
                        <h3
                          style={{
                            color: "#fff",
                            margin: 0,
                            fontSize: "16px",
                            fontWeight: "600",
                          }}
                        >
                          {column}
                        </h3>
                        <button
                          onClick={() => setShowAddCard(column)}
                          style={{
                            background: "#374151",
                            border: "none",
                            borderRadius: "6px",
                            width: "28px",
                            height: "28px",
                            color: "#9ca3af",
                            cursor: "pointer",
                            fontSize: "18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          +
                        </button>
                      </div>
                      {/* Column Progress Bar */}
                      <div style={{ marginBottom: "8px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "4px",
                          }}
                        >
                          <span style={{ color: "#6b7280", fontSize: "12px" }}>
                            {getColumnProgress(column).done}/
                            {getColumnProgress(column).total} done
                          </span>
                          <span
                            style={{
                              color:
                                getColumnProgress(column).percent === 100
                                  ? "#10b981"
                                  : "#8b5cf6",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            {getColumnProgress(column).percent}%
                          </span>
                        </div>
                        <div
                          style={{
                            background: "#374151",
                            borderRadius: "3px",
                            height: "6px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              background:
                                getColumnProgress(column).percent === 100
                                  ? "#10b981"
                                  : "#8b5cf6",
                              height: "100%",
                              width: `${getColumnProgress(column).percent}%`,
                              borderRadius: "3px",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cards */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {cards
                        .filter((c) => c.column === column)
                        .map((card) => (
                          <div
                            key={card.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, card)}
                            onClick={() => setShowEditCard(card)}
                            style={{
                              background: "#1f2937",
                              borderRadius: "8px",
                              padding: "14px",
                              cursor: "pointer",
                              border: "1px solid #374151",
                              transition: "transform 0.1s, box-shadow 0.1s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform =
                                "translateY(-2px)";
                              e.currentTarget.style.boxShadow =
                                "0 4px 12px rgba(0,0,0,0.3)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            {/* Labels */}
                            {card.labels?.length > 0 && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: "6px",
                                  marginBottom: "10px",
                                  flexWrap: "wrap",
                                }}
                              >
                                {card.labels.map((label) => (
                                  <span
                                    key={label}
                                    style={{
                                      background:
                                        LABEL_COLORS[label]?.bg || "#6b7280",
                                      color:
                                        LABEL_COLORS[label]?.text || "#fff",
                                      padding: "2px 8px",
                                      borderRadius: "4px",
                                      fontSize: "11px",
                                      fontWeight: "600",
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    {label}
                                  </span>
                                ))}
                              </div>
                            )}
                            <h4
                              style={{
                                color: "#fff",
                                margin: 0,
                                fontSize: "14px",
                                fontWeight: "500",
                              }}
                            >
                              {card.title}
                            </h4>
                            {card.description && (
                              <p
                                style={{
                                  color: "#9ca3af",
                                  margin: "8px 0 0",
                                  fontSize: "13px",
                                  lineHeight: "1.4",
                                }}
                              >
                                {card.description.length > 80
                                  ? card.description.slice(0, 80) + "..."
                                  : card.description}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div
              style={{ textAlign: "center", padding: "60px", color: "#9ca3af" }}
            >
              <p style={{ fontSize: "18px", marginBottom: "16px" }}>
                No business selected
              </p>
              <button
                onClick={() => setShowAddBusiness(true)}
                style={{
                  background: "#8b5cf6",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                + Add Your First Business
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Add Business Modal */}
      {showAddBusiness && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setShowAddBusiness(false)}
        >
          <div
            style={{
              background: "#1f2937",
              borderRadius: "16px",
              padding: "20px",
              width: "90%",
              maxWidth: "400px",
              border: "1px solid #374151",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: "#fff", margin: "0 0 20px", fontSize: "20px" }}>
              Add New Business
            </h2>
            <input
              type="text"
              placeholder="Business name"
              value={newBusinessName}
              onChange={(e) => setNewBusinessName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddBusiness()}
              autoFocus
              style={{
                width: "100%",
                background: "#111827",
                border: "1px solid #374151",
                borderRadius: "8px",
                padding: "12px",
                color: "#fff",
                fontSize: "15px",
                marginBottom: "16px",
              }}
            />
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowAddBusiness(false)}
                style={{
                  background: "#374151",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddBusiness}
                style={{
                  background: "#8b5cf6",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Add Business
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Card Modal */}
      {showAddCard && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setShowAddCard(null)}
        >
          <div
            style={{
              background: "#1f2937",
              borderRadius: "16px",
              padding: "20px",
              width: "90%",
              maxWidth: "450px",
              border: "1px solid #374151",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: "#fff", margin: "0 0 20px", fontSize: "18px" }}>
              Add Card to {showAddCard}
            </h2>
            <input
              type="text"
              placeholder="Card title"
              value={newCard.title}
              onChange={(e) =>
                setNewCard({ ...newCard, title: e.target.value })
              }
              autoFocus
              style={{
                width: "100%",
                background: "#111827",
                border: "1px solid #374151",
                borderRadius: "8px",
                padding: "12px",
                color: "#fff",
                fontSize: "15px",
                marginBottom: "12px",
              }}
            />
            <textarea
              placeholder="Description (optional)"
              value={newCard.description}
              onChange={(e) =>
                setNewCard({ ...newCard, description: e.target.value })
              }
              style={{
                width: "100%",
                background: "#111827",
                border: "1px solid #374151",
                borderRadius: "8px",
                padding: "12px",
                color: "#fff",
                fontSize: "14px",
                marginBottom: "12px",
                minHeight: "80px",
                resize: "vertical",
              }}
            />
            <div style={{ marginBottom: "16px" }}>
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "13px",
                  marginBottom: "8px",
                }}
              >
                Labels:
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {Object.keys(LABEL_COLORS).map((label) => (
                  <button
                    key={label}
                    onClick={() => toggleLabel(label)}
                    style={{
                      background: newCard.labels.includes(label)
                        ? LABEL_COLORS[label].bg
                        : "#374151",
                      color: newCard.labels.includes(label)
                        ? LABEL_COLORS[label].text
                        : "#9ca3af",
                      border: "none",
                      borderRadius: "4px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setShowAddCard(null);
                  setNewCard({
                    title: "",
                    description: "",
                    labels: [],
                    column: "",
                  });
                }}
                style={{
                  background: "#374151",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCard}
                style={{
                  background: "#8b5cf6",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Add Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Card Modal */}
      {showEditCard && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setShowEditCard(null)}
        >
          <div
            style={{
              background: "#1f2937",
              borderRadius: "16px",
              padding: "20px",
              width: "90%",
              maxWidth: "500px",
              border: "1px solid #374151",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ color: "#fff", margin: 0, fontSize: "18px" }}>
                Edit Card
              </h2>
              <button
                onClick={() => handleDeleteCard(showEditCard.id)}
                style={{
                  background: "#dc2626",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Delete
              </button>
            </div>

            <input
              type="text"
              value={showEditCard.title}
              onChange={(e) =>
                setShowEditCard({ ...showEditCard, title: e.target.value })
              }
              style={{
                width: "100%",
                background: "#111827",
                border: "1px solid #374151",
                borderRadius: "8px",
                padding: "12px",
                color: "#fff",
                fontSize: "15px",
                marginBottom: "12px",
              }}
            />
            <textarea
              value={showEditCard.description || ""}
              onChange={(e) =>
                setShowEditCard({
                  ...showEditCard,
                  description: e.target.value,
                })
              }
              placeholder="Description"
              style={{
                width: "100%",
                background: "#111827",
                border: "1px solid #374151",
                borderRadius: "8px",
                padding: "12px",
                color: "#fff",
                fontSize: "14px",
                marginBottom: "12px",
                minHeight: "100px",
                resize: "vertical",
              }}
            />

            <div style={{ marginBottom: "16px" }}>
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "13px",
                  marginBottom: "8px",
                }}
              >
                Move to column:
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {columns.map((col) => (
                  <button
                    key={col}
                    onClick={() =>
                      setShowEditCard({ ...showEditCard, column: col })
                    }
                    style={{
                      background:
                        showEditCard.column === col ? "#8b5cf6" : "#374151",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 14px",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "13px",
                  marginBottom: "8px",
                }}
              >
                Labels:
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {Object.keys(LABEL_COLORS).map((label) => (
                  <button
                    key={label}
                    onClick={() => {
                      const labels = showEditCard.labels || [];
                      if (labels.includes(label)) {
                        setShowEditCard({
                          ...showEditCard,
                          labels: labels.filter((l) => l !== label),
                        });
                      } else {
                        setShowEditCard({
                          ...showEditCard,
                          labels: [...labels, label],
                        });
                      }
                    }}
                    style={{
                      background: (showEditCard.labels || []).includes(label)
                        ? LABEL_COLORS[label].bg
                        : "#374151",
                      color: (showEditCard.labels || []).includes(label)
                        ? LABEL_COLORS[label].text
                        : "#9ca3af",
                      border: "none",
                      borderRadius: "4px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowEditCard(null)}
                style={{
                  background: "#374151",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleUpdateCard(showEditCard.id, {
                    title: showEditCard.title,
                    description: showEditCard.description,
                    column: showEditCard.column,
                    labels: showEditCard.labels,
                  });
                  setShowEditCard(null);
                }}
                style={{
                  background: "#10b981",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
