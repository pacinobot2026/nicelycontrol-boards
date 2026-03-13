import { useState } from "react";
import Head from "next/head";
import NavigationSidebar from "../components/NavigationSidebar";
import withAuth from "../lib/withAuth";

const commands = [
  {
    name: "/idea",
    category: "content",
    group: "resources",
    description: "Add idea to Idea Board with suggested category",
    steps: [
      "Ask what the idea is",
      "Suggest the category",
      "Create idea in board",
    ],
  },
  {
    name: "/resource",
    category: "content",
    group: "resources",
    description: "Add resource to Resource Library with suggested category",
    steps: [
      "Ask what the resource is",
      "Suggest the category",
      "Create resource in library",
    ],
  },
  {
    name: "/create business",
    category: "business",
    group: "resources",
    description:
      "PRODUCT CREATION ENGINE \u2014 Full 6-stage revenue mode from idea to scale",
    steps: [
      "STAGE 1: Generate 10 opportunities with scoring",
      "STAGE 2: Build business blueprint",
      "STAGE 3: Build product + sales page + VSL + Stripe",
      "STAGE 4: Create traffic assets (organic + paid + email)",
      "STAGE 5: Deploy traffic + launch ads",
      "STAGE 6: Optimization + scale plan",
      "\u2705 Updates Business Board throughout process",
    ],
    shortcut: 'Type "/create business" to start full product creation',
  },
  {
    name: "/salespage",
    category: "business",
    group: "resources",
    description: "Build professional Next.js sales page and deploy to Vercel",
    steps: [
      "Ask for product name and offer details",
      "Generate sales page structure",
      "Create with headline, video embed, bullet points, CTA",
      "Deploy to Vercel",
      "Return live URL",
    ],
  },
  {
    name: "/salescopy",
    category: "business",
    group: "resources",
    description: "Generate high-converting sales copy using proven frameworks",
    steps: [
      "Ask about product/offer",
      "Choose framework (PAS, AIDA, etc.)",
      "Generate headline, subheadline, bullets",
      "Create CTA and urgency elements",
      "Deliver formatted copy",
    ],
  },
  {
    name: "/vsl",
    category: "business",
    group: "resources",
    description:
      "Create complete VSL - script, audio, and video with text slides",
    steps: [
      "Generate VSL script (pattern interrupt \u2192 problem \u2192 solution \u2192 offer)",
      "Create audio with ElevenLabs (Chad's voice)",
      "Generate word-level timestamps with Whisper",
      "Build text slides synced to audio",
      "Compile final video with FFmpeg",
      "Upload to Vimeo or return file",
    ],
  },
  {
    name: "/videoavatar",
    category: "business",
    group: "resources",
    description: "Generate AI avatar video with HeyGen or ElevenLabs",
    steps: [
      "Ask for script/message",
      "Choose avatar style",
      "Generate with HeyGen or ElevenLabs",
      "Return video URL or file",
    ],
  },
  {
    name: "/broadcast",
    category: "email",
    group: "titanium",
    description: "Create and send broadcast email via Global Control",
    steps: [
      "Ask what email is about",
      "Rewrite content + create subject/pre-header",
      "Create PopLink for URL",
      "ASK: Re-engage inactives? (YES/NO)",
      "YES \u2192 Pull from GC segments (Inactive\u2192New\u2192Passive\u2192Dead)",
      'NO \u2192 Send test \u2192 Wait for "send it"',
    ],
    shortcut: 'Type "/broadcast" or say "write me an email"',
    logo: "/logos/globalcontrol.png",
  },
  {
    name: "/emailstats",
    category: "email",
    group: "titanium",
    description: "Get email performance stats from Global Control",
    steps: [
      "Ask: Broadcast or Workflow?",
      "Ask for date or date range",
      "Pull stats from GC API",
      "Show: Subject, Sent, Opens, Clicks",
    ],
    logo: "/logos/globalcontrol.png",
  },
  {
    name: "/reactivation",
    category: "email",
    group: "titanium",
    description:
      "Long-term progressive campaign from CSV file (not instant broadcast)",
    steps: [
      "Ask how many contacts",
      "Ask pace (Mild/Normal/Aggressive)",
      "Upload CSV/XLS file",
      "Verify emails (EmailListVerify)",
      "Choose GC tag + workflow",
      "Progressive daily sending via cron jobs",
      "Kanban board tracking",
      "Pause/Resume/Cancel anytime",
    ],
    logo: "/logos/globalcontrol.png",
  },
  {
    name: "/replay",
    category: "content",
    group: "titanium",
    description: "Create Course Sprout lesson from Vimeo video",
    steps: [
      "Ask for Vimeo URL",
      "Ask for lesson title (or auto-generate)",
      "Download transcript from Vimeo API",
      "Create lesson with short + long descriptions (NO EMOJIS)",
      "Add goal block (10 pts, comments, user input)",
      "Defaults: Course 340, Chapter 958",
    ],
    logo: "/logos/coursesprout.png",
  },
  {
    name: "/article",
    category: "content",
    group: "titanium",
    description: "Create Letterman article with full workflow",
    steps: [
      "Ask: Blank or AI-generated?",
      "Ask: Local or Niche?",
      "Ask: Word count",
      "Ask: Image URL or generate?",
      "If AI: Generate content from topic/URL",
      "If Local: Apply local SEO strategy",
      "Create as DRAFT with proper formatting",
      "Update SEO settings",
      '\u26a0\ufe0f WAIT for "publish" \u2014 never auto-publish',
    ],
    logo: "/logos/letterman.png",
  },
  {
    name: "/poplink",
    category: "links",
    group: "titanium",
    description: "Create shortened PopLink (auto-generates slug + domain)",
    steps: [
      "User gives destination URL ONLY",
      "Auto-use chadnicely.com domain (ID: 1977)",
      "Auto-generate simple slug",
      "Create via PopLinks API",
      "\u2705 NEVER ask for domain or slug",
    ],
    shortcut: "Just paste the URL you want to shorten",
    logo: "/logos/mintbird.png",
  },
  {
    name: "/leadstep",
    category: "links",
    group: "titanium",
    description: "Create lead capture page in PopLinks",
    steps: [
      "Ask for page name",
      "Ask for headline/offer",
      "Ask for domain (default: chadnicely.com)",
      "Ask for URL slug",
      "Create via PopLinks API",
      "Set up confirmation page",
    ],
    logo: "/logos/mintbird.png",
  },
  {
    name: "/bridgepage",
    category: "links",
    group: "titanium",
    description: "Create or clone bridge page in PopLinks",
    steps: [
      "Ask: Clone existing or create new?",
      "If clone: Ask for source page ID/name",
      "Ask for new name",
      "Ask for destination URL",
      "Ask for domain + slug",
      "Create/clone via PopLinks API",
      "Update headline, video if needed",
    ],
    logo: "/logos/mintbird.png",
  },
  {
    name: "/tag",
    category: "contacts",
    group: "titanium",
    description: "Fire a tag on a contact in Global Control",
    steps: [
      "Ask for contact name",
      "Ask for email",
      "Ask which tag to fire",
      "Fire tag via GC API",
      "Confirm success",
    ],
    logo: "/logos/globalcontrol.png",
  },
  {
    name: "/bulkimport",
    category: "contacts",
    group: "titanium",
    description:
      "Bulk import contacts from CSV and tag them (creates if needed)",
    steps: [
      "Ask for CSV file",
      "Ask for tag name",
      "For each contact in CSV:",
      "  - If exists \u2192 Fire tag (update)",
      "  - If new \u2192 Create contact + fire tag",
      "Generate detailed report with stats",
      "CSV format: email, firstName, lastName",
    ],
    logo: "/logos/globalcontrol.png",
  },
  {
    name: "/contact",
    category: "contacts",
    group: "titanium",
    description: "Get contact history from Global Control",
    steps: [
      "Ask for contact name",
      "Ask for email",
      "Search GC for contact",
      "Show full history: tags, emails, activity, purchases",
    ],
    logo: "/logos/globalcontrol.png",
  },
  {
    name: "/workflow",
    category: "contacts",
    group: "titanium",
    description:
      "Create automated workflow in Global Control (email sequences, automations)",
    steps: [
      "Ask what the workflow should do",
      "Define triggers and actions",
      "Use safe pattern (Kafi-approved):",
      "  1. POST /workflows (create empty container)",
      "  2. GET /workflows/{id} (get current state)",
      "  3. Add flows to existing array",
      "  4. PUT /workflows/{id} (save complete array)",
      "\u26a0\ufe0f Critical: PUT APPENDS flows - always get current state first",
      "Return workflow ID and confirmation",
    ],
    logo: "/logos/globalcontrol.png",
  },
  {
    name: "/sob",
    category: "contacts",
    group: "external",
    description: "Look up user credentials in SaaSOnboard (access management)",
    steps: [
      "Ask for name and email",
      "Ask what product they need",
      "Search SOB API for email",
      "Show access details if found",
      "\u26a0\ufe0f Passwords NOT available via API (security)",
      "Offer to reset password (with confirmation)",
    ],
  },
  {
    name: "/makelive",
    category: "system",
    group: "external",
    description: "Deploy any project to Vercel with one command",
    steps: [
      "Commit & push to GitHub",
      "Ensure Vercel project connected",
      "Trigger Vercel deployment via API",
      "Return live URL + confirm auto-deploy enabled",
    ],
  },
  {
    name: "/systemhealth",
    category: "system",
    group: "external",
    description: "Run health check on all APIs and properties",
    steps: [
      "Check 5 APIs: GC, PopLinks/MintBird, Course Sprout, Letterman, SOB",
      "Check 9 URLs: Key properties",
      "Save results to health-checks/YYYY-MM-DD.json",
      "Report any failures",
      "\u23f0 Runs automatically: 10 AM & 4 PM CST",
    ],
  },
  {
    name: "/teamcall",
    category: "system",
    group: "external",
    description: "Extract assignments from team Zoom call and update dashboard",
    steps: [
      "Fetch latest recording (Meeting ID: 82250425529)",
      "Download and parse transcript",
      "Extract assignments per team member",
      "Update TEAM-KANBAN.md",
      "Post summary to Telegram team room",
    ],
  },
];

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
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCommand, setExpandedCommand] = useState(null);

  const filteredCommands = commands.filter((cmd) => {
    const matchesGroup = selectedGroup === "all" || cmd.group === selectedGroup;
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
              const count = commands.filter((c) => c.group === key).length;
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
