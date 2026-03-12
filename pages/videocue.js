import { useState, useEffect } from "react";
import Head from "next/head";
import NavigationSidebar from "../components/NavigationSidebar";
import withAuth from "../lib/withAuth";
import { useAuth } from "../lib/authContext";
import { getCache, setCache } from "../lib/cache";

function getVideoEmbed(url) {
  if (!url || url.startsWith("pb://")) return { type: "none" };
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  if (ytMatch)
    return {
      type: "iframe",
      src: `https://www.youtube.com/embed/${ytMatch[1]}`,
    };
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch)
    return {
      type: "iframe",
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    };
  return { type: "video", src: url };
}

const TIMEZONES = [
  { value: "Pacific/Honolulu", label: "Hawaii (UTC-10)" },
  { value: "America/Anchorage", label: "Alaska (UTC-9/-8)" },
  {
    value: "America/Los_Angeles",
    label: "Pacific Time — LA / Vancouver (UTC-8/-7)",
  },
  {
    value: "America/Denver",
    label: "Mountain Time — Denver / Phoenix (UTC-7/-6)",
  },
  {
    value: "America/Chicago",
    label: "Central Time — Chicago / Dallas (UTC-6/-5)",
  },
  {
    value: "America/New_York",
    label: "Eastern Time — New York / Miami (UTC-5/-4)",
  },
  { value: "America/Sao_Paulo", label: "Brasilia (UTC-3)" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (UTC-3)" },
  { value: "Atlantic/Azores", label: "Azores (UTC-1)" },
  { value: "Europe/London", label: "London / Dublin (UTC+0/+1)" },
  { value: "Europe/Paris", label: "Paris / Rome / Madrid (UTC+1/+2)" },
  { value: "Europe/Berlin", label: "Berlin / Amsterdam (UTC+1/+2)" },
  { value: "Europe/Athens", label: "Athens / Bucharest (UTC+2/+3)" },
  { value: "Europe/Moscow", label: "Moscow (UTC+3)" },
  { value: "Asia/Dubai", label: "Dubai / Abu Dhabi (UTC+4)" },
  { value: "Asia/Karachi", label: "Karachi / Islamabad (UTC+5)" },
  { value: "Asia/Kolkata", label: "India (UTC+5:30)" },
  { value: "Asia/Dhaka", label: "Dhaka (UTC+6)" },
  { value: "Asia/Bangkok", label: "Bangkok / Jakarta (UTC+7)" },
  { value: "Asia/Shanghai", label: "China / Hong Kong (UTC+8)" },
  { value: "Asia/Singapore", label: "Singapore / Kuala Lumpur (UTC+8)" },
  { value: "Asia/Tokyo", label: "Tokyo / Seoul (UTC+9)" },
  { value: "Australia/Sydney", label: "Sydney / Melbourne (UTC+10/+11)" },
  { value: "Pacific/Auckland", label: "Auckland (UTC+12/+13)" },
];

// Convert a datetime-local string + IANA timezone → UTC ISO string
function getScheduledISO(datetimeLocal, timezone) {
  if (!datetimeLocal) return null;
  // Treat the datetime string as if it were UTC to get a reference ms value
  const asUTC = new Date(datetimeLocal + ":00.000Z");
  const fmt = (tz) =>
    asUTC.toLocaleString("en-US", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  const parse = (s) => {
    const [d, t] = s.split(", ");
    const [mo, da, yr] = d.split("/").map(Number);
    const [h, mi, se] = t.split(":").map(Number);
    return Date.UTC(yr, mo - 1, da, h % 24, mi, se);
  };
  const offsetMs = parse(fmt(timezone)) - parse(fmt("UTC"));
  return new Date(asUTC.getTime() - offsetMs).toISOString();
}

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function VideoCue() {
  const { session } = useAuth();

  // Clips list state
  const [clips, setClips] = useState([]);
  const [stats, setStats] = useState({});
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [category, setCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const [nextCheckIn, setNextCheckIn] = useState(300);
  const [nextPostIn, setNextPostIn] = useState(7200);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClip, setEditingClip] = useState(null);
  const [editCaption, setEditCaption] = useState("");
  const [editAccountIds, setEditAccountIds] = useState([]);
  const [editAccounts, setEditAccounts] = useState([]);
  const [loadingEditAccounts, setLoadingEditAccounts] = useState(false);

  // PostBridge API key management
  const [hasPBKey, setHasPBKey] = useState(false);
  const [pbKeyInput, setPbKeyInput] = useState("");
  const [showPBKeyInput, setShowPBKeyInput] = useState(false);
  const [savingPBKey, setSavingPBKey] = useState(false);
  const [pbKeyError, setPbKeyError] = useState("");

  // API Access panel
  const [showApiAccess, setShowApiAccess] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  // Create Post modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pbMedia, setPbMedia] = useState([]);
  const [pbAccounts, setPbAccounts] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [postCaption, setPostCaption] = useState("");
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);
  const [newPostCategory, setNewPostCategory] = useState("");
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  // Next scheduled post countdown
  const [nextScheduledAt, setNextScheduledAt] = useState(null);
  const [nextScheduledSecs, setNextScheduledSecs] = useState(null);

  // Schedule / Approve modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleClipId, setScheduleClipId] = useState(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduleTimezone, setScheduleTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [schedulingLoading, setSchedulingLoading] = useState(false);

  useEffect(() => {
    if (session) fetchClips();
  }, [filter, category, sortBy, session]);

  useEffect(() => {
    fetchProcessing();
    const processingInterval = setInterval(fetchProcessing, 5 * 60 * 1000);
    const countdownInterval = setInterval(() => {
      setNextCheckIn((prev) => (prev <= 1 ? 300 : prev - 1));
      setNextPostIn((prev) => (prev <= 1 ? 7200 : prev - 1));
    }, 1000);
    return () => {
      clearInterval(processingInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  useEffect(() => {
    if (session) loadSettings();
  }, [session]);

  // Live countdown to next scheduled post
  useEffect(() => {
    if (!nextScheduledAt) {
      setNextScheduledSecs(null);
      return;
    }
    const compute = () => {
      const secs = Math.max(
        0,
        Math.floor((new Date(nextScheduledAt) - new Date()) / 1000),
      );
      setNextScheduledSecs(secs);
    };
    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [nextScheduledAt]);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  });

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/settings", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.settings?.postbridge_api_key) setHasPBKey(true);
    } catch {
      /* ignore */
    }
  };

  const savePBKey = async () => {
    if (!pbKeyInput.trim()) return;
    setSavingPBKey(true);
    setPbKeyError("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          key: "postbridge_api_key",
          value: pbKeyInput.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setHasPBKey(true);
      setShowPBKeyInput(false);
      setPbKeyInput("");
    } catch {
      setPbKeyError("Failed to save key. Please try again.");
    } finally {
      setSavingPBKey(false);
    }
  };

  const fetchProcessing = async () => {
    try {
      const res = await fetch("/api/processing");
      const data = await res.json();
      setProcessingCount(data.processing || 0);
      setNextCheckIn(300);
    } catch (err) {
      console.error("Error fetching processing count:", err);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatLongTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const fetchClips = async () => {
    // Check cache first
    const cacheKey = `clips-${filter}-${category}-${sortBy}`;
    const cached = getCache(cacheKey);
    if (cached) {
      setClips(cached.clips || []);
      setStats(cached.stats || {});
      setNextScheduledAt(cached.stats?.next_scheduled_at || null);
      setCategories(cached.categories || []);
      setLoading(false);
      setRefreshing(false);
    } else {
      setRefreshing(true);
    }

    // Fetch fresh data
    try {
      const params = new URLSearchParams({ filter, category, sortBy });
      const res = await fetch(`/api/clips?${params}`, {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });
      const data = await res.json();
      let clipsData = data.clips || [];

      // Resolve pb://media/{id} URLs to real video URLs
      const pbClips = clipsData.filter((c) =>
        c.clip_url?.startsWith("pb://media/"),
      );
      if (pbClips.length > 0 && session) {
        const resolved = await Promise.all(
          pbClips.map((c) => {
            const mediaId = c.clip_url.replace("pb://media/", "");
            return fetch(`/api/postbridge/media/${mediaId}`, {
              headers: { Authorization: `Bearer ${session.access_token}` },
            })
              .then((r) => r.json())
              .then((d) => ({ clip_id: c.clip_id, url: d.object?.url || null }))
              .catch(() => ({ clip_id: c.clip_id, url: null }));
          }),
        );
        const urlMap = {};
        resolved.forEach(({ clip_id, url }) => {
          if (url) urlMap[clip_id] = url;
        });
        clipsData = clipsData.map((c) =>
          urlMap[c.clip_id] ? { ...c, clip_url: urlMap[c.clip_id] } : c,
        );
      }

      setClips(clipsData);
      setStats(data.stats || {});
      setNextScheduledAt(data.stats?.next_scheduled_at || null);
      setCategories(data.categories || []);
      
      // Cache the resolved data
      setCache(cacheKey, { 
        clips: clipsData, 
        stats: data.stats,
        categories: data.categories 
      });
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching clips:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredClips = clips.filter(
    (clip) =>
      searchTerm === "" ||
      (clip.title &&
        clip.title.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // ── Create Post ──────────────────────────────────────────────────
  const openCreateModal = async () => {
    setShowCreateModal(true);
    setLoadingMedia(true);
    setCreateError("");
    setSelectedMedia(null);
    setPostCaption("");
    setSelectedAccountIds([]);
    setNewPostCategory("");
    try {
      const [mediaRes, accountsRes] = await Promise.all([
        fetch("/api/postbridge/media", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch("/api/postbridge/accounts", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
      ]);
      const [mediaData, accountsData] = await Promise.all([
        mediaRes.json(),
        accountsRes.json(),
      ]);
      if (!mediaRes.ok)
        throw new Error(mediaData.error || "Failed to load media");
      setPbMedia((mediaData.data || []).filter((m) => !m.object?.isDeleted));
      setPbAccounts(accountsData.data || []);
    } catch (err) {
      setCreateError(err.message || "Failed to load PostBridge data.");
    } finally {
      setLoadingMedia(false);
    }
  };

  const toggleAccount = (id) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleCreatePost = async () => {
    if (!selectedMedia) {
      setCreateError("Please select a video from the library.");
      return;
    }
    if (selectedAccountIds.length === 0) {
      setCreateError("Please select at least one social account.");
      return;
    }
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch("/api/clips", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          postbridge_media_id: selectedMedia.id,
          postbridge_media_url: selectedMedia.object?.url || "",
          title: selectedMedia.object?.name || postCaption || "Untitled",
          caption: postCaption,
          account_ids: selectedAccountIds,
          category: newPostCategory,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setCreateError(data.error || "Failed to create draft.");
        return;
      }
      setShowCreateModal(false);
      fetchClips();
    } catch {
      setCreateError("Failed to create post. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  // ── Approve / Schedule ───────────────────────────────────────────
  const handleApprove = (clip) => {
    setScheduleClipId(clip.clip_id);
    setScheduledAt("");
    setScheduleTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setShowScheduleModal(true);
  };

  const handleScheduleApprove = async () => {
    if (!scheduleClipId) return;
    setSchedulingLoading(true);
    try {
      const isoScheduledAt = scheduledAt
        ? getScheduledISO(scheduledAt, scheduleTimezone)
        : null;
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          clipId: scheduleClipId,
          scheduledAt: isoScheduledAt,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(`Could not approve:\n\n${data.error}`);
        return;
      }
      setShowScheduleModal(false);
      setScheduleClipId(null);
      fetchClips();
    } catch {
      alert("Failed to approve clip. Please try again.");
    } finally {
      setSchedulingLoading(false);
    }
  };

  // ── Other actions ────────────────────────────────────────────────
  const openEditModal = async (clip) => {
    setEditingClip({ ...clip });
    setEditCaption(clip.suggested_caption || "");
    setEditAccountIds([]);
    setEditAccounts([]);
    setShowEditModal(true);
    // Load accounts + current post selections for PostBridge clips
    if (clip.postbridge_post_id && session) {
      setLoadingEditAccounts(true);
      try {
        const headers = { Authorization: `Bearer ${session.access_token}` };
        const [accountsRes, postRes] = await Promise.all([
          fetch("/api/postbridge/accounts", { headers }),
          fetch(`/api/postbridge/posts/${clip.postbridge_post_id}`, {
            headers,
          }),
        ]);
        const [accountsData, postData] = await Promise.all([
          accountsRes.json(),
          postRes.json(),
        ]);
        setEditAccounts(accountsData.data || []);
        // Pre-check whichever accounts are already on the draft
        if (Array.isArray(postData.social_accounts)) {
          setEditAccountIds(
            postData.social_accounts.map((a) =>
              typeof a === "object" ? a.id : a,
            ),
          );
        }
      } catch {
        /* ignore */
      }
      setLoadingEditAccounts(false);
    }
  };

  const toggleEditAccount = (id) => {
    setEditAccountIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleUpdateClip = async () => {
    if (!editingClip.title.trim()) return;
    try {
      await fetch("/api/clips", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          clip_id: editingClip.clip_id,
          title: editingClip.title,
          clip_url: editingClip.clip_url,
          category: editingClip.category,
          caption: editCaption,
          // Always send account_ids for PostBridge clips so selections are saved
          account_ids: editingClip.postbridge_post_id
            ? editAccountIds
            : undefined,
        }),
      });
      setShowEditModal(false);
      setEditingClip(null);
      fetchClips();
    } catch (err) {
      console.error("Error updating clip:", err);
    }
  };

  const handleDeleteClip = async (clipId) => {
    if (
      !confirm(
        "Remove this post? It will be moved to Rejected and reverted to draft in PostBridge (media is kept).",
      )
    )
      return;
    try {
      await fetch("/api/clips", {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ clip_id: clipId }),
      });
      fetchClips();
    } catch (err) {
      console.error("Error deleting clip:", err);
    }
  };

  const handleReject = async (clipId) => {
    try {
      await fetch("/api/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId }),
      });
      fetchClips();
    } catch (err) {
      console.error("Error rejecting clip:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Head>
          <title>Video Cue</title>
        </Head>
        <NavigationSidebar />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Loading clips...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Head>
        <title>Video Cue</title>
      </Head>
      <NavigationSidebar />
      <main className="flex-1 p-4 md:p-8 pt-16 md:pt-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center gap-3">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">
                🎬 Video Cue
              </h1>
              <p className="text-sm text-gray-400">
                Create and schedule social posts
              </p>
            </div>
            {hasPBKey && (
              <button
                onClick={openCreateModal}
                className="px-4 md:px-6 py-3 bg-purple-600 rounded-lg text-white text-sm font-semibold cursor-pointer hover:scale-105 transition-transform border-none whitespace-nowrap flex-shrink-0"
              >
                + Create Post
              </button>
            )}
          </div>

          {/* PostBridge connection */}
          <div className="mb-4 flex items-center gap-3 justify-end">
            {hasPBKey ? (
              <>
                <span className="text-xs text-green-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                  PostBridge connected
                </span>
                <button
                  onClick={() => setShowPBKeyInput(!showPBKeyInput)}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer bg-transparent border-none"
                >
                  Update key
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowPBKeyInput(true)}
                className="px-4 py-2 bg-yellow-500 text-black text-sm font-semibold rounded-lg border-none cursor-pointer hover:bg-yellow-400 transition-colors"
              >
                + Connect PostBridge
              </button>
            )}
            <span className="text-gray-600 text-xs">|</span>
            <button
              onClick={() => setShowApiAccess(!showApiAccess)}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer bg-transparent border-none"
            >
              API Access
            </button>
          </div>

          {/* PostBridge API key input panel */}
          {showPBKeyInput && (
            <div className="mb-6 bg-gray-800 border border-gray-600/50 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-1">
                PostBridge API Key
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Paste your PostBridge API key below to connect your media
                library and social accounts.
              </p>
              <div className="flex gap-3 flex-wrap">
                <input
                  type="password"
                  placeholder="Paste your PostBridge API key..."
                  value={pbKeyInput}
                  onChange={(e) => setPbKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && savePBKey()}
                  className="flex-1 min-w-64 bg-gray-700/70 border border-gray-600/50 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-yellow-500"
                />
                <button
                  onClick={savePBKey}
                  disabled={savingPBKey || !pbKeyInput.trim()}
                  className="px-5 py-2.5 bg-yellow-500 text-black text-sm font-semibold rounded-lg border-none cursor-pointer hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingPBKey ? "Saving..." : "Save Key"}
                </button>
                <button
                  onClick={() => {
                    setShowPBKeyInput(false);
                    setPbKeyInput("");
                    setPbKeyError("");
                  }}
                  className="px-5 py-2.5 bg-gray-700/70 border border-gray-600/50 rounded-lg text-gray-400 text-sm font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
              {pbKeyError && (
                <p className="text-red-400 text-xs mt-3">{pbKeyError}</p>
              )}
            </div>
          )}

          {/* API Access panel */}
          {showApiAccess && (
            <div className="mb-6 bg-gray-800 border border-gray-600/50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-white font-semibold">API Access</h3>
                <a
                  href="/api-docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  View API Docs →
                </a>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Use your bearer token to authenticate API requests. Pass it as{" "}
                <code className="text-purple-300 bg-gray-700/60 px-1 rounded text-xs">
                  Authorization: Bearer &lt;token&gt;
                </code>
              </p>
              <div className="flex gap-3 flex-wrap items-center">
                <input
                  type="text"
                  readOnly
                  value={
                    session?.access_token
                      ? `${session.access_token.slice(0, 20)}••••••••••••••••••••`
                      : "—"
                  }
                  className="flex-1 min-w-48 bg-gray-700/70 border border-gray-600/50 rounded-lg px-4 py-2.5 text-gray-300 text-sm outline-none font-mono cursor-default select-none"
                />
                <button
                  onClick={() => {
                    if (!session?.access_token) return;
                    navigator.clipboard.writeText(session.access_token);
                    setTokenCopied(true);
                    setTimeout(() => setTokenCopied(false), 2000);
                  }}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg border-none cursor-pointer transition-colors"
                >
                  {tokenCopied ? "✓ Copied!" : "Copy Token"}
                </button>
              </div>
              <p className="text-gray-600 text-xs mt-3">
                Token expires when your session ends. Re-login to get a fresh
                token.
              </p>
            </div>
          )}

          {/* Status Banner */}
          <div className="bg-gray-600/10 border border-gray-600/30 rounded-xl px-4 py-3 mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            <div
              className={`flex items-center gap-3 flex-1 px-3 py-2 rounded-lg transition-colors ${stats.approved > 0 ? "bg-blue-400/10" : processingCount > 0 ? "bg-purple-400/10" : ""}`}
            >
              <span className="text-2xl">
                {stats.approved > 0 ? "📅" : "⚙️"}
              </span>
              <div>
                <div
                  className={`text-sm font-semibold ${stats.approved > 0 ? "text-blue-400" : processingCount > 0 ? "text-purple-400" : "text-gray-400"}`}
                >
                  {stats.approved > 0
                    ? `${stats.approved} post${stats.approved > 1 ? "s" : ""} scheduled`
                    : processingCount > 0
                      ? `${processingCount} video${processingCount > 1 ? "s" : ""} being edited`
                      : "No posts scheduled"}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {nextScheduledSecs !== null
                    ? `Next post in: ${formatLongTime(nextScheduledSecs)}`
                    : `Next check: ${formatTime(nextCheckIn)}`}
                </div>
              </div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-purple-500/50" />
            <div
              className={`flex items-center gap-3 flex-1 px-3 py-2 rounded-lg transition-colors ${stats.approved > 0 ? "bg-blue-400/10" : ""}`}
            >
              <span className="text-2xl">🚀</span>
              <div>
                <div className="text-sm font-semibold text-blue-400">
                  Scheduled posts
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {stats.approved > 0
                    ? `${stats.approved} post${stats.approved > 1 ? "s" : ""} approved`
                    : "No approved posts yet"}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
            {[
              { icon: "⏳", label: "Pending", key: "pending" },
              { icon: "✅", label: "Approved", key: "approved" },
              { icon: "🚀", label: "Published", key: "published" },
              { icon: "❌", label: "Rejected", key: "rejected" },
            ].map(({ icon, label, key }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`p-3 md:p-4 rounded-xl border cursor-pointer transition-all text-left ${filter === key ? "bg-purple-600 border-purple-600 scale-105" : "bg-gray-800/50 border-gray-600/50 hover:bg-gray-800"}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <div
                      className={`text-2xl font-bold leading-none mb-1 ${filter === key ? "text-white" : "text-cyan-400"}`}
                    >
                      {stats[key] || 0}
                    </div>
                    <div
                      className={`text-xs ${filter === key ? "text-white/70" : "text-gray-500"}`}
                    >
                      {label}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {["all", ...categories.map((c) => c.name)].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${category === cat ? "bg-purple-600 border-purple-600 text-white" : "bg-gray-800/50 border-gray-600/50 text-white hover:bg-gray-800"}`}
                >
                  {cat === "all"
                    ? "All Categories"
                    : `${categories.find((c) => c.name === cat)?.emoji || ""} ${cat} (${categories.find((c) => c.name === cat)?.count || 0})`}
                </button>
              ))}
            </div>
          )}

          {/* Search + Sort */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              placeholder="🔍 Search clips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-gray-800/50 border border-gray-600/50 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-purple-500"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto bg-gray-800/50 border border-gray-600/50 rounded-lg px-4 py-2.5 text-white text-sm cursor-pointer outline-none"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="viral_score">Viral Score</option>
              <option value="duration">Duration</option>
            </select>
          </div>

          {/* Clips Grid */}
          <div className="glass-card rounded-2xl p-4 md:p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-white">
                📹 Video Posts
              </h2>
              <div className="flex items-center gap-3">
                {refreshing && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <div className="w-3 h-3 border-2 border-gray-600 border-t-purple-400 rounded-full animate-spin" />
                    Refreshing...
                  </div>
                )}
                <span className="text-sm text-gray-400">
                  {filteredClips.length} clips
                </span>
              </div>
            </div>
            {filteredClips.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                {searchTerm
                  ? `No clips matching "${searchTerm}"`
                  : `No ${filter} clips`}
              </div>
            ) : (
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                }}
              >
                {filteredClips.map((clip) => (
                  <ClipCard
                    key={clip.clip_id}
                    clip={clip}
                    onApprove={() => handleApprove(clip)}
                    onReject={() => handleReject(clip.clip_id)}
                    onEdit={() => openEditModal(clip)}
                    onDelete={() => handleDeleteClip(clip.clip_id)}
                    showActions={filter === "pending"}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Create Post Modal ─────────────────────────────────────── */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-0 sm:p-5"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-gray-800 rounded-t-2xl sm:rounded-2xl border border-gray-600/50 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 md:p-8">
              <h2 className="text-2xl font-bold text-white mb-1">
                📱 Create Post
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Pick a video from your PostBridge library, add a caption and
                choose accounts.
              </p>

              {loadingMedia ? (
                <div className="text-center py-12 text-gray-400">
                  Loading your PostBridge library...
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {/* Media picker */}
                  <div>
                    <p className="text-white text-sm font-semibold mb-2">
                      Select Video
                    </p>
                    {pbMedia.length === 0 ? (
                      <div className="text-gray-500 text-sm py-4 text-center bg-gray-700/30 rounded-lg">
                        No videos found in your PostBridge library.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                        {pbMedia.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setSelectedMedia(item)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left cursor-pointer transition-colors w-full ${selectedMedia?.id === item.id ? "border-purple-500 bg-purple-600/20" : "border-gray-600/50 bg-gray-700/30 hover:bg-gray-700/60"}`}
                          >
                            <span className="text-xl flex-shrink-0">🎬</span>
                            <div className="min-w-0">
                              <div className="text-white text-sm font-medium truncate">
                                {item.object?.name || item.id}
                              </div>
                              <div className="text-gray-400 text-xs">
                                {formatBytes(item.object?.size_bytes)}
                              </div>
                            </div>
                            {selectedMedia?.id === item.id && (
                              <span className="ml-auto text-purple-400 flex-shrink-0">
                                ✓
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected video preview */}
                  {selectedMedia?.object?.url && (
                    <div>
                      <p className="text-white text-sm font-semibold mb-2">
                        Preview
                      </p>
                      <video
                        key={selectedMedia.id}
                        src={selectedMedia.object.url}
                        controls
                        preload="metadata"
                        playsInline
                        className="w-full rounded-lg bg-black"
                        style={{ maxHeight: "200px" }}
                      />
                    </div>
                  )}

                  {/* Caption */}
                  <div>
                    <p className="text-white text-sm font-semibold mb-2">
                      Caption
                    </p>
                    <textarea
                      placeholder="Write your caption..."
                      value={postCaption}
                      onChange={(e) => setPostCaption(e.target.value)}
                      rows={3}
                      className="w-full bg-gray-700/70 border border-gray-600/50 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-purple-500 resize-none"
                    />
                  </div>

                  {/* Social accounts */}
                  <div>
                    <p className="text-white text-sm font-semibold mb-2">
                      Post to Accounts
                    </p>
                    {pbAccounts.length === 0 ? (
                      <div className="text-gray-500 text-sm py-3 text-center bg-gray-700/30 rounded-lg">
                        No social accounts found in PostBridge.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {pbAccounts.map((account) => (
                          <label
                            key={account.id}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${selectedAccountIds.includes(account.id) ? "border-purple-500 bg-purple-600/20" : "border-gray-600/50 bg-gray-700/30 hover:bg-gray-700/60"}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedAccountIds.includes(account.id)}
                              onChange={() => toggleAccount(account.id)}
                              className="accent-purple-500"
                            />
                            <span className="text-white text-sm font-medium capitalize">
                              {account.platform}
                            </span>
                            <span className="text-gray-400 text-sm">
                              @{account.username}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <p className="text-white text-sm font-semibold mb-2">
                      Category{" "}
                      <span className="text-gray-500 font-normal">
                        (optional)
                      </span>
                    </p>
                    <input
                      type="text"
                      placeholder="e.g. Marketing, Product..."
                      value={newPostCategory}
                      onChange={(e) => setNewPostCategory(e.target.value)}
                      className="w-full bg-gray-700/70 border border-gray-600/50 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-purple-500"
                    />
                  </div>

                  {createError && (
                    <p className="text-red-400 text-sm">{createError}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleCreatePost}
                      disabled={creating}
                      className="flex-1 py-3 bg-purple-600 border-none rounded-lg text-white text-sm font-semibold cursor-pointer hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creating ? "Creating Draft..." : "Create Draft"}
                    </button>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 py-3 bg-gray-700/70 border border-gray-600/50 rounded-lg text-gray-400 text-sm font-semibold cursor-pointer hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule / Approve Modal ──────────────────────────────── */}
      {showScheduleModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-5"
          onClick={() => {
            setShowScheduleModal(false);
            setScheduleClipId(null);
          }}
        >
          <div
            className="bg-gray-800 rounded-2xl border border-gray-600/50 max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white mb-1">
              📅 Approve & Schedule
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Set a publish time, or leave blank to post immediately.
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-white text-sm font-semibold block mb-2">
                  Schedule for
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full bg-gray-700/70 border border-gray-600/50 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-purple-500"
                />
                <p className="text-gray-500 text-xs mt-1.5">
                  Leave empty to post immediately when approved.
                </p>
              </div>
              {scheduledAt && (
                <div>
                  <label className="text-white text-sm font-semibold block mb-2">
                    Timezone
                  </label>
                  <select
                    value={scheduleTimezone}
                    onChange={(e) => setScheduleTimezone(e.target.value)}
                    className="w-full bg-gray-700/70 border border-gray-600/50 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {!TIMEZONES.find((t) => t.value === scheduleTimezone) && (
                      <option value={scheduleTimezone}>
                        {scheduleTimezone} (detected)
                      </option>
                    )}
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleScheduleApprove}
                  disabled={schedulingLoading}
                  className="flex-1 py-3 bg-green-600 border-none rounded-lg text-white text-sm font-semibold cursor-pointer hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {schedulingLoading
                    ? "Approving..."
                    : scheduledAt
                      ? "✓ Schedule Post"
                      : "✓ Approve Now"}
                </button>
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setScheduleClipId(null);
                  }}
                  className="flex-1 py-3 bg-gray-700/70 border border-gray-600/50 rounded-lg text-gray-400 text-sm font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Clip Modal ───────────────────────────────────────── */}
      {showEditModal && editingClip && (
        <div
          className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-0 sm:p-5"
          onClick={() => {
            setShowEditModal(false);
            setEditingClip(null);
          }}
        >
          <div
            className="bg-gray-800 rounded-t-2xl sm:rounded-2xl border border-gray-600/50 max-w-xl w-full p-5 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-white mb-6">✏️ Edit Post</h2>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-white text-sm font-semibold mb-2">Caption</p>
                <textarea
                  placeholder="Write your caption..."
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-700/70 border border-gray-600/50 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-purple-500 resize-none"
                />
              </div>
              <div>
                <p className="text-white text-sm font-semibold mb-2">Title</p>
                <input
                  type="text"
                  placeholder="Title..."
                  value={editingClip.title}
                  onChange={(e) =>
                    setEditingClip({ ...editingClip, title: e.target.value })
                  }
                  className="w-full bg-gray-700/70 border border-gray-600/50 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <p className="text-white text-sm font-semibold mb-2">
                  Category
                </p>
                <input
                  type="text"
                  placeholder="Category (optional)..."
                  value={editingClip.category || ""}
                  onChange={(e) =>
                    setEditingClip({ ...editingClip, category: e.target.value })
                  }
                  className="w-full bg-gray-700/70 border border-gray-600/50 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-purple-500"
                />
              </div>
              {/* Social accounts — only for PostBridge clips */}
              {editingClip.postbridge_post_id && (
                <div>
                  <p className="text-white text-sm font-semibold mb-2">
                    Post to Accounts
                  </p>
                  {loadingEditAccounts ? (
                    <div className="text-gray-400 text-sm py-3 text-center">
                      Loading accounts...
                    </div>
                  ) : editAccounts.length === 0 ? (
                    <div className="text-gray-500 text-sm py-3 text-center bg-gray-700/30 rounded-lg">
                      No social accounts found in PostBridge.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {editAccounts.map((account) => (
                        <label
                          key={account.id}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${editAccountIds.includes(account.id) ? "border-purple-500 bg-purple-600/20" : "border-gray-600/50 bg-gray-700/30 hover:bg-gray-700/60"}`}
                        >
                          <input
                            type="checkbox"
                            checked={editAccountIds.includes(account.id)}
                            onChange={() => toggleEditAccount(account.id)}
                            className="accent-purple-500"
                          />
                          <span className="text-white text-sm font-medium capitalize">
                            {account.platform}
                          </span>
                          <span className="text-gray-400 text-sm">
                            @{account.username}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleUpdateClip}
                  className="flex-1 py-3 bg-purple-600 border-none rounded-lg text-white text-sm font-semibold cursor-pointer hover:bg-purple-500 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingClip(null);
                  }}
                  className="flex-1 py-3 bg-gray-700/70 border border-gray-600/50 rounded-lg text-gray-400 text-sm font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClipCard({
  clip,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  showActions,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const embed = getVideoEmbed(clip.clip_url);

  return (
    <div
      className={`bg-gray-800/70 rounded-xl border overflow-hidden transition-all ${isHovered ? "border-purple-500/50 -translate-y-1 shadow-lg shadow-purple-900/20" : "border-gray-600/50"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video / thumbnail */}
      <div className="aspect-[4/5] bg-black relative overflow-hidden">
        {embed.type === "iframe" ? (
          <iframe
            src={embed.src}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        ) : embed.type === "video" && !videoError ? (
          <video
            src={embed.src}
            controls
            preload="metadata"
            playsInline
            className="w-full h-full object-cover"
            style={{
              filter: isHovered ? 'grayscale(0%)' : 'grayscale(100%)',
              transition: 'filter 0.3s ease'
            }}
            onError={() => setVideoError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center gap-2 text-white">
            <span className="text-4xl">📱</span>
            <span className="text-xs text-white/70 px-3 text-center">
              {clip.title || "PostBridge Post"}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-white text-sm font-semibold leading-snug">
            {clip.suggested_caption || clip.title || "Untitled"}
          </h3>
          <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
            <button
              onClick={onEdit}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 4px",
                color: "#9ca3af",
                fontSize: "13px",
              }}
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={onDelete}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 4px",
                color: "#9ca3af",
                fontSize: "13px",
              }}
              title="Delete"
            >
              🗑
            </button>
          </div>
        </div>
        <div className="flex gap-2 mb-3 flex-wrap">
          {clip.category && (
            <span className="px-2 py-1 bg-gray-900 rounded text-xs text-gray-400">
              {clip.category}
            </span>
          )}
          {clip.suggested_caption && (
            <span className="px-2 py-1 bg-gray-900 rounded text-xs text-gray-400 truncate max-w-[120px]">
              {clip.suggested_caption}
            </span>
          )}
        </div>
        {showActions && (
          <div className="flex gap-2">
            <button
              onClick={onApprove}
              className="flex-1 py-2 bg-green-600 border-none rounded-md text-white text-sm font-semibold cursor-pointer hover:bg-green-500 transition-colors"
            >
              ✓ Approve
            </button>
            <button
              onClick={onReject}
              className="flex-1 py-2 bg-red-600 border-none rounded-md text-white text-sm font-semibold cursor-pointer hover:bg-red-500 transition-colors"
            >
              ✕ Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(VideoCue);

