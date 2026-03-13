import Head from "next/head";
import { useEffect, useState, useCallback } from "react";
import NavigationSidebar from "../components/NavigationSidebar";
import withAuth from "../lib/withAuth";

const TABS = [
  { key: "all", label: "All Endpoints", icon: "{ }" },
  { key: "Clips", label: "Clips", icon: "▶" },
  { key: "Articles", label: "Articles", icon: "📰" },
  { key: "Bookmarks", label: "Bookmarks", icon: "🔖" },
  { key: "Ideas", label: "Ideas", icon: "💡" },
  { key: "Projects", label: "Projects", icon: "📂" },
  { key: "Shopping", label: "Shopping", icon: "🛒" },
  { key: "Vault", label: "Vault", icon: "🔐" },
  { key: "Settings", label: "Settings", icon: "⚙" },
  { key: "PostBridge", label: "PostBridge", icon: "🌉" },
];

function ApiDocs() {
  const [activeTab, setActiveTab] = useState("all");
  const [ready, setReady] = useState(false);

  const filterByTag = useCallback(
    (tag) => {
      const sections = document.querySelectorAll(
        "#swagger-ui .opblock-tag-section",
      );
      const info = document.querySelector("#swagger-ui .swagger-ui .info");
      const schemes = document.querySelector(
        "#swagger-ui .swagger-ui .scheme-container",
      );
      const models = document.querySelector(
        "#swagger-ui .swagger-ui section.models",
      );

      if (info) info.style.display = tag === "all" ? "" : "none";
      if (schemes) schemes.style.display = tag === "all" ? "" : "none";
      if (models) models.style.display = tag === "all" ? "" : "none";

      sections.forEach((section) => {
        const heading = section.querySelector("h3.opblock-tag");
        if (!heading) return;
        const tagAttr =
          heading.getAttribute("data-tag") ||
          heading.getAttribute("id")?.replace("operations-tag-", "") ||
          heading.textContent.trim().split("\n")[0].trim();

        if (tag === "all") {
          section.style.display = "";
        } else {
          section.style.display = tagAttr === tag ? "" : "none";
        }
      });
    },
    [],
  );

  useEffect(() => {
    if (ready) filterByTag(activeTab);
  }, [activeTab, ready, filterByTag]);

  useEffect(() => {
    function initSwagger() {
      if (window.SwaggerUIBundle) {
        window.SwaggerUIBundle({
          url: "/api/swagger",
          dom_id: "#swagger-ui",
          presets: [
            window.SwaggerUIBundle.presets.apis,
            window.SwaggerUIStandalonePreset,
          ],
          layout: "BaseLayout",
          deepLinking: true,
          persistAuthorization: true,
          onComplete: () => setReady(true),
        });
        return;
      }
      setTimeout(initSwagger, 100);
    }

    const bundle = document.createElement("script");
    bundle.src =
      "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js";
    bundle.onload = () => {
      const preset = document.createElement("script");
      preset.src =
        "https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js";
      preset.onload = initSwagger;
      document.body.appendChild(preset);
    };
    document.body.appendChild(bundle);
  }, []);

  return (
    <div className="flex min-h-screen">
      <Head>
        <title>API Docs</title>
        <link
          rel="stylesheet"
          href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
        />
        <style>{`
          /* ── Dark theme overrides for Swagger UI ── */

          /* Wrapper & body */
          .swagger-ui { color: #e2e8f0; }
          .swagger-ui .wrapper { background: transparent; padding: 0; max-width: none; }
          .swagger-ui .scheme-container { background: #111827; border-bottom: 1px solid #1e293b; box-shadow: none; padding: 16px 0; }

          /* Info header */
          .swagger-ui .info { margin: 20px 0; }
          .swagger-ui .info .title { color: #f1f5f9; }
          .swagger-ui .info .description p,
          .swagger-ui .info .description li { color: #94a3b8; }
          .swagger-ui .info .description h2,
          .swagger-ui .info .description h3 { color: #e2e8f0; }
          .swagger-ui .info .description code { background: #1e293b; color: #a78bfa; padding: 2px 6px; border-radius: 4px; }
          .swagger-ui .info .description pre { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 12px; }
          .swagger-ui .info .description a { color: #818cf8; }

          /* Operation blocks */
          .swagger-ui .opblock { border-radius: 8px !important; border: 1px solid #1e293b !important; margin-bottom: 8px; background: #111827; }
          .swagger-ui .opblock .opblock-summary { border-bottom: 1px solid #1e293b; padding: 8px 16px; }
          .swagger-ui .opblock .opblock-summary-description { color: #94a3b8; }
          .swagger-ui .opblock .opblock-summary-path span { color: #e2e8f0 !important; }
          .swagger-ui .opblock .opblock-section-header { background: #0f172a; border-bottom: 1px solid #1e293b; }
          .swagger-ui .opblock .opblock-section-header h4 { color: #e2e8f0; }
          .swagger-ui .opblock-body { background: #0f172a; }
          .swagger-ui .opblock-body pre { background: #0f172a !important; color: #e2e8f0; border: 1px solid #1e293b; border-radius: 6px; }

          /* HTTP method colors */
          .swagger-ui .opblock.opblock-get { background: rgba(16,185,129,0.05); border-color: #065f46 !important; }
          .swagger-ui .opblock.opblock-get .opblock-summary { border-color: #065f46; }
          .swagger-ui .opblock.opblock-post { background: rgba(59,130,246,0.05); border-color: #1e3a5f !important; }
          .swagger-ui .opblock.opblock-post .opblock-summary { border-color: #1e3a5f; }
          .swagger-ui .opblock.opblock-put { background: rgba(245,158,11,0.05); border-color: #78350f !important; }
          .swagger-ui .opblock.opblock-put .opblock-summary { border-color: #78350f; }
          .swagger-ui .opblock.opblock-delete { background: rgba(239,68,68,0.05); border-color: #7f1d1d !important; }
          .swagger-ui .opblock.opblock-delete .opblock-summary { border-color: #7f1d1d; }
          .swagger-ui .opblock.opblock-patch { background: rgba(168,85,247,0.05); border-color: #581c87 !important; }
          .swagger-ui .opblock.opblock-patch .opblock-summary { border-color: #581c87; }

          /* Tags / section headers */
          .swagger-ui .opblock-tag { color: #f1f5f9 !important; border-bottom: 1px solid #1e293b; }
          .swagger-ui .opblock-tag:hover { background: rgba(255,255,255,0.03); }
          .swagger-ui .opblock-tag small { color: #64748b !important; }

          /* Tables */
          .swagger-ui table thead tr td,
          .swagger-ui table thead tr th { color: #94a3b8; border-bottom: 1px solid #1e293b; }
          .swagger-ui .parameters-col_description p,
          .swagger-ui .parameter__name,
          .swagger-ui .parameter__type,
          .swagger-ui .parameter__in { color: #cbd5e1; }
          .swagger-ui .parameter__name.required::after { color: #ef4444; }

          /* Response section */
          .swagger-ui .responses-inner { background: transparent; }
          .swagger-ui .response-col_status { color: #e2e8f0; }
          .swagger-ui .response-col_description { color: #94a3b8; }
          .swagger-ui .response-col_links { color: #94a3b8; }
          .swagger-ui .responses-table thead td { color: #64748b; }

          /* Models */
          .swagger-ui section.models { border: 1px solid #1e293b; border-radius: 8px; background: #111827; }
          .swagger-ui section.models h4 { color: #e2e8f0; border-bottom: 1px solid #1e293b; }
          .swagger-ui section.models .model-container { background: #0f172a; margin: 0; padding: 12px; border-bottom: 1px solid #1e293b; }
          .swagger-ui .model-title { color: #e2e8f0; }
          .swagger-ui .model { color: #94a3b8; }
          .swagger-ui .prop-type { color: #818cf8; }

          /* Inputs, selects, textareas */
          .swagger-ui input[type=text],
          .swagger-ui input[type=password],
          .swagger-ui input[type=search],
          .swagger-ui input[type=email],
          .swagger-ui input[type=file],
          .swagger-ui textarea,
          .swagger-ui select { background: #0f172a !important; color: #e2e8f0 !important; border: 1px solid #334155 !important; border-radius: 6px; }
          .swagger-ui select option { background: #1e293b; color: #e2e8f0; }

          /* Buttons */
          .swagger-ui .btn { border-radius: 6px; }
          .swagger-ui .btn.execute { background: #7c3aed; border-color: #7c3aed; color: #fff; }
          .swagger-ui .btn.execute:hover { background: #6d28d9; }
          .swagger-ui .btn.cancel { border-color: #475569; color: #94a3b8; }
          .swagger-ui .btn.authorize { background: #059669; border-color: #059669; color: #fff; }
          .swagger-ui .btn.authorize svg { fill: #fff; }

          /* Auth dialog */
          .swagger-ui .dialog-ux .modal-ux { background: #111827; border: 1px solid #1e293b; border-radius: 12px; }
          .swagger-ui .dialog-ux .modal-ux-header { border-bottom: 1px solid #1e293b; }
          .swagger-ui .dialog-ux .modal-ux-header h3 { color: #f1f5f9; }
          .swagger-ui .dialog-ux .modal-ux-content p,
          .swagger-ui .dialog-ux .modal-ux-content label { color: #94a3b8; }
          .swagger-ui .dialog-ux .backdrop-ux { background: rgba(0,0,0,0.7); }

          /* Topbar (hide default) */
          .swagger-ui .topbar { display: none; }

          /* Try-it-out area */
          .swagger-ui .try-out__btn { border-color: #475569; color: #94a3b8; }
          .swagger-ui .try-out__btn:hover { color: #e2e8f0; border-color: #818cf8; }

          /* Curl command */
          .swagger-ui .curl-command .copy-to-clipboard { background: #1e293b; border: 1px solid #334155; border-radius: 4px; }

          /* Loading */
          .swagger-ui .loading-container .loading::after { color: #94a3b8; }

          /* Scrollbar */
          .swagger-ui ::-webkit-scrollbar { width: 6px; height: 6px; }
          .swagger-ui ::-webkit-scrollbar-track { background: #0f172a; }
          .swagger-ui ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }

          /* Markdown inside descriptions */
          .swagger-ui .markdown p,
          .swagger-ui .markdown li { color: #94a3b8; }
          .swagger-ui .markdown code { background: #1e293b; color: #a78bfa; }
          .swagger-ui .renderedMarkdown p { color: #94a3b8; }

          /* Highlight.js code blocks */
          .swagger-ui .highlight-code { background: #0f172a !important; }
          .swagger-ui .microlight { background: #0f172a !important; color: #e2e8f0 !important; border: 1px solid #1e293b; border-radius: 6px; padding: 12px !important; font-size: 13px; }

          /* Server select area */
          .swagger-ui .servers > label { color: #94a3b8; }
          .swagger-ui .servers select { background: #0f172a; color: #e2e8f0; border: 1px solid #334155; }

          /* Arrow icons */
          .swagger-ui svg.arrow { fill: #94a3b8; }
          .swagger-ui .expand-operation svg { fill: #64748b; }

          /* Copy button */
          .swagger-ui .copy-to-clipboard { background: #1e293b; }
          .swagger-ui .copy-to-clipboard button { background: transparent; }

          /* Response body */
          .swagger-ui .responses-wrapper .col_header { color: #94a3b8; }
          .swagger-ui .response .response-col_description__inner p { color: #94a3b8; }

          /* Tab headers */
          .swagger-ui .tab li { color: #64748b; }
          .swagger-ui .tab li.active { color: #e2e8f0; }
          .swagger-ui .tab li button.tablinks { color: inherit; background: transparent; }
        `}</style>
      </Head>
      <NavigationSidebar />

      <main className="flex-1 pt-16 md:pt-0 min-w-0 overflow-x-auto flex flex-col">
        {/* Editor tab bar */}
        <div
          className="flex items-center overflow-x-auto border-b border-gray-700/50 shrink-0"
          style={{ background: "#0d1117" }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap
                border-r border-gray-700/50 transition-colors cursor-pointer
                ${
                  activeTab === tab.key
                    ? "bg-[#111827] text-white border-t-2 border-t-purple-500"
                    : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 border-t-2 border-t-transparent"
                }
              `}
              style={{ minHeight: 38 }}
            >
              <span className="text-[11px] opacity-70">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Breadcrumb / status bar */}
        <div
          className="flex items-center gap-2 px-4 py-1.5 border-b border-gray-800 text-[11px] text-gray-500 shrink-0"
          style={{ background: "#0f1520" }}
        >
          <span className="text-gray-600">api</span>
          <span className="text-gray-700">/</span>
          <span className="text-gray-400">
            {activeTab === "all" ? "swagger.json" : `${activeTab.toLowerCase()}.json`}
          </span>
          <span className="ml-auto text-gray-600">
            {ready ? "OpenAPI 3.0.3" : "Loading…"}
          </span>
        </div>

        {/* Swagger UI content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6" style={{ background: "#111827" }}>
          <div
            id="swagger-ui"
            className="rounded-xl overflow-hidden"
          />
        </div>

        {/* Bottom status bar */}
        <div
          className="flex items-center gap-4 px-4 py-1 border-t border-gray-800 text-[11px] text-gray-600 shrink-0"
          style={{ background: "#0d1117" }}
        >
          <span>REST</span>
          <span>UTF-8</span>
          <span className="ml-auto">
            {activeTab === "all" ? "All Endpoints" : activeTab}
          </span>
        </div>
      </main>
    </div>
  );
}

export default withAuth(ApiDocs);
