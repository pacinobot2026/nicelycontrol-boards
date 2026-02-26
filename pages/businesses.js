import { useState, useEffect } from "react";
import Head from "next/head";
import NavigationSidebar from "../components/NavigationSidebar";
import withAuth from "../lib/withAuth";
import { useAuth } from "../lib/authContext";

const DEFAULT_COLUMNS = ["Marketing", "Follow-up", "Research", "Delivery"];
const LABEL_COLORS = {
  urgent: { bg: "#dc2626", text: "#fff" },
  pending: { bg: "#f59e0b", text: "#000" },
  done: { bg: "#10b981", text: "#fff" },
  draft: { bg: "#6b7280", text: "#fff" },
  review: { bg: "#8b5cf6", text: "#fff" },
  blocked: { bg: "#ef4444", text: "#fff" },
};

function BusinessBoard() {
  const { session } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddBusiness, setShowAddBusiness] = useState(false);
  const [showAddCard, setShowAddCard] = useState(null);
  const [showEditCard, setShowEditCard] = useState(null);
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newCard, setNewCard] = useState({
    title: "",
    description: "",
    labels: [],
    due_date: "",
  });
  const [showResources, setShowResources] = useState(false);
  const [newResource, setNewResource] = useState({
    title: "",
    url: "",
    type: "link",
  });
  const [showAddResource, setShowAddResource] = useState(false);
  const [draggedCard, setDraggedCard] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Search & filter
  const [searchTerm, setSearchTerm] = useState("");
  const [labelFilter, setLabelFilter] = useState("");

  // Delete business confirmation
  const [showDeleteBusiness, setShowDeleteBusiness] = useState(false);

  // Custom column management
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [editingColumn, setEditingColumn] = useState(null);
  const [editingColumnName, setEditingColumnName] = useState("");

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (session) fetchBusinesses();
  }, [session]);

  const fetchBusinesses = async () => {
    try {
      const res = await fetch("/api/businesses", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      const list = data.businesses || [];
      setBusinesses(list);
      if (list.length > 0 && !selectedBusiness) {
        setSelectedBusiness(list[0]);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching businesses:", err);
      setLoading(false);
    }
  };

  // ── Business CRUD ──

  const handleAddBusiness = async () => {
    if (!newBusinessName.trim()) return;
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ action: "add_business", name: newBusinessName.trim() }),
      });
      const data = await res.json();
      if (data.business) {
        const updated = [...businesses, data.business];
        setBusinesses(updated);
        setSelectedBusiness(data.business);
      }
      setNewBusinessName("");
      setShowAddBusiness(false);
    } catch (err) {
      console.error("Error adding business:", err);
    }
  };

  const handleDeleteBusiness = async () => {
    if (!selectedBusiness) return;
    try {
      await fetch("/api/businesses", {
        method: "DELETE",
        headers: authHeaders,
        body: JSON.stringify({ type: "business", id: selectedBusiness.id }),
      });
      const remaining = businesses.filter((b) => b.id !== selectedBusiness.id);
      setBusinesses(remaining);
      setSelectedBusiness(remaining.length > 0 ? remaining[0] : null);
      setShowDeleteBusiness(false);
    } catch (err) {
      console.error("Error deleting business:", err);
    }
  };

  const handleUpdateBusinessColumns = async (newColumns) => {
    if (!selectedBusiness) return;
    try {
      const res = await fetch("/api/businesses", {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ type: "business", id: selectedBusiness.id, columns: newColumns }),
      });
      const data = await res.json();
      if (data.business) {
        const updatedBiz = { ...selectedBusiness, columns: data.business.columns };
        setSelectedBusiness(updatedBiz);
        setBusinesses(businesses.map((b) => (b.id === updatedBiz.id ? updatedBiz : b)));
      }
    } catch (err) {
      console.error("Error updating columns:", err);
    }
  };

  // ── Card CRUD ──

  const handleAddCard = async () => {
    if (!newCard.title.trim() || !showAddCard) return;
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          action: "add_card",
          business_id: selectedBusiness.id,
          title: newCard.title.trim(),
          description: newCard.description.trim(),
          column_name: showAddCard,
          labels: newCard.labels,
          due_date: newCard.due_date || null,
        }),
      });
      const data = await res.json();
      if (data.card) {
        const updatedBiz = {
          ...selectedBusiness,
          cards: [...(selectedBusiness.cards || []), data.card],
        };
        setSelectedBusiness(updatedBiz);
        setBusinesses(businesses.map((b) => (b.id === updatedBiz.id ? updatedBiz : b)));
      }
      setNewCard({ title: "", description: "", labels: [], due_date: "" });
      setShowAddCard(null);
    } catch (err) {
      console.error("Error adding card:", err);
    }
  };

  const handleUpdateCard = async (cardId, updates) => {
    try {
      const res = await fetch("/api/businesses", {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ type: "card", id: cardId, ...updates }),
      });
      const data = await res.json();
      if (data.card) {
        const updatedCards = selectedBusiness.cards.map((c) =>
          c.id === cardId ? data.card : c,
        );
        const updatedBiz = { ...selectedBusiness, cards: updatedCards };
        setSelectedBusiness(updatedBiz);
        setBusinesses(businesses.map((b) => (b.id === updatedBiz.id ? updatedBiz : b)));
      }
    } catch (err) {
      console.error("Error updating card:", err);
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await fetch("/api/businesses", {
        method: "DELETE",
        headers: authHeaders,
        body: JSON.stringify({ type: "card", id: cardId }),
      });
      const updatedCards = selectedBusiness.cards.filter((c) => c.id !== cardId);
      const updatedBiz = { ...selectedBusiness, cards: updatedCards };
      setSelectedBusiness(updatedBiz);
      setBusinesses(businesses.map((b) => (b.id === updatedBiz.id ? updatedBiz : b)));
      setShowEditCard(null);
    } catch (err) {
      console.error("Error deleting card:", err);
    }
  };

  const handleMoveCard = async (cardId, newColumn) => {
    await handleUpdateCard(cardId, { column_name: newColumn });
  };

  // ── Resource CRUD ──

  const handleAddResource = async () => {
    if (!newResource.title.trim()) return;
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          action: "add_resource",
          business_id: selectedBusiness.id,
          title: newResource.title.trim(),
          url: newResource.url.trim(),
          type: newResource.type,
        }),
      });
      const data = await res.json();
      if (data.resource) {
        const updatedBiz = {
          ...selectedBusiness,
          resources: [...(selectedBusiness.resources || []), data.resource],
        };
        setSelectedBusiness(updatedBiz);
        setBusinesses(businesses.map((b) => (b.id === updatedBiz.id ? updatedBiz : b)));
      }
      setNewResource({ title: "", url: "", type: "link" });
      setShowAddResource(false);
    } catch (err) {
      console.error("Error adding resource:", err);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    try {
      await fetch("/api/businesses", {
        method: "DELETE",
        headers: authHeaders,
        body: JSON.stringify({ type: "resource", id: resourceId }),
      });
      const updatedResources = selectedBusiness.resources.filter(
        (r) => r.id !== resourceId,
      );
      const updatedBiz = { ...selectedBusiness, resources: updatedResources };
      setSelectedBusiness(updatedBiz);
      setBusinesses(businesses.map((b) => (b.id === updatedBiz.id ? updatedBiz : b)));
    } catch (err) {
      console.error("Error deleting resource:", err);
    }
  };

  // ── Labels ──

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

  // ── Drag & Drop ──

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
    if (draggedCard && draggedCard.column_name !== column) {
      await handleMoveCard(draggedCard.id, column);
    }
    setDraggedCard(null);
  };

  // ── Custom Columns ──

  const handleAddColumn = async () => {
    if (!newColumnName.trim() || !selectedBusiness) return;
    const cols = [...(selectedBusiness.columns || DEFAULT_COLUMNS), newColumnName.trim()];
    await handleUpdateBusinessColumns(cols);
    setNewColumnName("");
    setShowAddColumn(false);
  };

  const handleRenameColumn = async (oldName, newName) => {
    if (!newName.trim() || !selectedBusiness) return;
    const cols = (selectedBusiness.columns || DEFAULT_COLUMNS).map((c) =>
      c === oldName ? newName.trim() : c,
    );
    // Also update any cards in this column
    const cardsInColumn = (selectedBusiness.cards || []).filter(
      (c) => c.column_name === oldName,
    );
    await handleUpdateBusinessColumns(cols);
    for (const card of cardsInColumn) {
      await handleUpdateCard(card.id, { column_name: newName.trim() });
    }
    setEditingColumn(null);
    setEditingColumnName("");
  };

  const handleDeleteColumn = async (colName) => {
    if (!selectedBusiness) return;
    const cardsInColumn = (selectedBusiness.cards || []).filter(
      (c) => c.column_name === colName,
    );
    if (cardsInColumn.length > 0) {
      alert("Cannot delete a column that has cards. Move or delete the cards first.");
      return;
    }
    const cols = (selectedBusiness.columns || DEFAULT_COLUMNS).filter(
      (c) => c !== colName,
    );
    await handleUpdateBusinessColumns(cols);
    if (activeColumn === colName) setActiveColumn(null);
  };

  // ── Due Date Helpers ──

  const getDueDateStyle = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate + "T00:00:00");
    const diffDays = Math.floor((due - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { color: "#ef4444", label: "Overdue" };
    if (diffDays === 0) return { color: "#f59e0b", label: "Due today" };
    if (diffDays <= 3) return { color: "#f59e0b", label: `Due in ${diffDays}d` };
    return { color: "#6b7280", label: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }) };
  };

  // ── Filtered data ──

  const columns = selectedBusiness?.columns || DEFAULT_COLUMNS;
  const allCards = selectedBusiness?.cards || [];
  const resources = selectedBusiness?.resources || [];

  const filteredCards = allCards.filter((c) => {
    const matchesSearch =
      !searchTerm ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLabel = !labelFilter || (c.labels && c.labels.includes(labelFilter));
    return matchesSearch && matchesLabel;
  });

  // ── Progress ──

  const getColumnProgress = (column) => {
    const columnCards = filteredCards.filter((c) => c.column_name === column);
    if (columnCards.length === 0) return { done: 0, total: 0, percent: 0 };
    const done = columnCards.filter((c) => c.labels?.includes("done")).length;
    return {
      done,
      total: columnCards.length,
      percent: Math.round((done / columnCards.length) * 100),
    };
  };

  const overallProgress = () => {
    if (allCards.length === 0) return { done: 0, total: 0, percent: 0 };
    const done = allCards.filter((c) => c.labels?.includes("done")).length;
    return {
      done,
      total: allCards.length,
      percent: Math.round((done / allCards.length) * 100),
    };
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
                Business Board
              </h1>

              {/* Business Dropdown */}
              <select
                value={selectedBusiness?.id || ""}
                onChange={(e) => {
                  const biz = businesses.find((b) => b.id === e.target.value);
                  setSelectedBusiness(biz);
                  setSearchTerm("");
                  setLabelFilter("");
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

              {selectedBusiness && (
                <button
                  onClick={() => setShowDeleteBusiness(true)}
                  title="Delete business"
                  style={{
                    background: "transparent",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px",
                    color: "#dc2626",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#dc2626")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              )}
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
                  Resources ({resources.length})
                </button>
              </div>
            )}
          </div>

          {/* Search & Filter Bar */}
          {selectedBusiness && (
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "16px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  color: "#fff",
                  fontSize: "14px",
                  minWidth: isMobile ? "100%" : "240px",
                  flex: isMobile ? "1" : "none",
                }}
              />
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button
                  onClick={() => setLabelFilter("")}
                  style={{
                    background: !labelFilter ? "#8b5cf6" : "#374151",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  All
                </button>
                {Object.keys(LABEL_COLORS).map((label) => (
                  <button
                    key={label}
                    onClick={() =>
                      setLabelFilter(labelFilter === label ? "" : label)
                    }
                    style={{
                      background:
                        labelFilter === label
                          ? LABEL_COLORS[label].bg
                          : "#374151",
                      color:
                        labelFilter === label
                          ? LABEL_COLORS[label].text
                          : "#9ca3af",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 12px",
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
              {(searchTerm || labelFilter) && (
                <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                  {filteredCards.length} / {allCards.length} cards
                </span>
              )}
            </div>
          )}

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
                  Resources for {selectedBusiness.name}
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

              {/* Add Resource Form */}
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
                      <option value="link">Link</option>
                      <option value="doc">Document</option>
                      <option value="note">Note</option>
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
                  {col} ({filteredCards.filter((c) => c.column_name === col).length})
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
                        {editingColumn === column ? (
                          <input
                            type="text"
                            value={editingColumnName}
                            onChange={(e) => setEditingColumnName(e.target.value)}
                            onBlur={() => {
                              if (editingColumnName.trim() && editingColumnName.trim() !== column) {
                                handleRenameColumn(column, editingColumnName);
                              } else {
                                setEditingColumn(null);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                if (editingColumnName.trim() && editingColumnName.trim() !== column) {
                                  handleRenameColumn(column, editingColumnName);
                                } else {
                                  setEditingColumn(null);
                                }
                              }
                              if (e.key === "Escape") setEditingColumn(null);
                            }}
                            autoFocus
                            style={{
                              background: "#1f2937",
                              border: "1px solid #8b5cf6",
                              borderRadius: "4px",
                              padding: "4px 8px",
                              color: "#fff",
                              fontSize: "16px",
                              fontWeight: "600",
                              width: "100%",
                              maxWidth: "160px",
                            }}
                          />
                        ) : (
                          <h3
                            onDoubleClick={() => {
                              setEditingColumn(column);
                              setEditingColumnName(column);
                            }}
                            title="Double-click to rename"
                            style={{
                              color: "#fff",
                              margin: 0,
                              fontSize: "16px",
                              fontWeight: "600",
                              cursor: "pointer",
                            }}
                          >
                            {column}
                          </h3>
                        )}
                        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                          {columns.length > 1 && (
                            <button
                              onClick={() => handleDeleteColumn(column)}
                              title="Delete column (must be empty)"
                              style={{
                                background: "none",
                                border: "none",
                                color: "#6b7280",
                                cursor: "pointer",
                                fontSize: "14px",
                                padding: "4px",
                              }}
                            >
                              ×
                            </button>
                          )}
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
                      {filteredCards
                        .filter((c) => c.column_name === column)
                        .map((card) => {
                          const dueDateInfo = getDueDateStyle(card.due_date);
                          return (
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
                                e.currentTarget.style.transform =
                                  "translateY(0)";
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
                              {/* Due Date */}
                              {dueDateInfo && (
                                <div
                                  style={{
                                    marginTop: "8px",
                                    fontSize: "12px",
                                    color: dueDateInfo.color,
                                    fontWeight: "500",
                                  }}
                                >
                                  {dueDateInfo.label}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ),
              )}

              {/* Add Column Button (desktop only) */}
              {!isMobile && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    minWidth: "80px",
                  }}
                >
                  {showAddColumn ? (
                    <div
                      style={{
                        background: "#111827",
                        borderRadius: "12px",
                        padding: "16px",
                        border: "1px solid #1f2937",
                        width: "200px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Column name"
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddColumn();
                          if (e.key === "Escape") {
                            setShowAddColumn(false);
                            setNewColumnName("");
                          }
                        }}
                        autoFocus
                        style={{
                          width: "100%",
                          background: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "6px",
                          padding: "10px",
                          color: "#fff",
                          fontSize: "14px",
                          marginBottom: "10px",
                        }}
                      />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={handleAddColumn}
                          style={{
                            background: "#10b981",
                            border: "none",
                            borderRadius: "6px",
                            padding: "8px 14px",
                            color: "#fff",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setShowAddColumn(false);
                            setNewColumnName("");
                          }}
                          style={{
                            background: "#374151",
                            border: "none",
                            borderRadius: "6px",
                            padding: "8px 14px",
                            color: "#fff",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddColumn(true)}
                      title="Add column"
                      style={{
                        background: "#1f2937",
                        border: "1px dashed #374151",
                        borderRadius: "12px",
                        padding: "16px",
                        color: "#6b7280",
                        cursor: "pointer",
                        fontSize: "14px",
                        width: "100%",
                        textAlign: "center",
                      }}
                    >
                      + Column
                    </button>
                  )}
                </div>
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

      {/* Delete Business Confirmation Modal */}
      {showDeleteBusiness && (
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
          onClick={() => setShowDeleteBusiness(false)}
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
            <h2 style={{ color: "#fff", margin: "0 0 12px", fontSize: "20px" }}>
              Delete Business
            </h2>
            <p style={{ color: "#9ca3af", margin: "0 0 20px", fontSize: "14px" }}>
              Are you sure you want to delete <strong style={{ color: "#fff" }}>{selectedBusiness?.name}</strong>?
              This will permanently delete all {allCards.length} cards and {resources.length} resources.
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowDeleteBusiness(false)}
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
                onClick={handleDeleteBusiness}
                style={{
                  background: "#dc2626",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Delete Forever
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
            {/* Due Date */}
            <div style={{ marginBottom: "12px" }}>
              <label style={{ color: "#9ca3af", fontSize: "13px", display: "block", marginBottom: "6px" }}>
                Due date (optional):
              </label>
              <input
                type="date"
                value={newCard.due_date}
                onChange={(e) => setNewCard({ ...newCard, due_date: e.target.value })}
                style={{
                  background: "#111827",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  padding: "10px",
                  color: "#fff",
                  fontSize: "14px",
                  colorScheme: "dark",
                }}
              />
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
                    due_date: "",
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

            {/* Due Date */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: "#9ca3af", fontSize: "13px", display: "block", marginBottom: "6px" }}>
                Due date:
              </label>
              <input
                type="date"
                value={showEditCard.due_date || ""}
                onChange={(e) =>
                  setShowEditCard({ ...showEditCard, due_date: e.target.value || null })
                }
                style={{
                  background: "#111827",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  padding: "10px",
                  color: "#fff",
                  fontSize: "14px",
                  colorScheme: "dark",
                }}
              />
              {showEditCard.due_date && (
                <button
                  onClick={() => setShowEditCard({ ...showEditCard, due_date: null })}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: "12px",
                    marginLeft: "8px",
                  }}
                >
                  Clear
                </button>
              )}
            </div>

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
                      setShowEditCard({ ...showEditCard, column_name: col })
                    }
                    style={{
                      background:
                        showEditCard.column_name === col ? "#8b5cf6" : "#374151",
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
                    column_name: showEditCard.column_name,
                    labels: showEditCard.labels,
                    due_date: showEditCard.due_date || null,
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

export default withAuth(BusinessBoard);
