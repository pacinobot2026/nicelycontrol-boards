import Head from "next/head";
import { useEffect } from "react";

function ApiDocs() {
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
        });
        return;
      }
      setTimeout(initSwagger, 100);
    }

    const bundle = document.createElement("script");
    bundle.src = "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js";
    bundle.onload = () => {
      const preset = document.createElement("script");
      preset.src = "https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js";
      preset.onload = initSwagger;
      document.body.appendChild(preset);
    };
    document.body.appendChild(bundle);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#111827" }}>
      <Head>
        <title>API Docs</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
        <style>{`
          /* ── Dark theme overrides for Swagger UI ── */
          .swagger-ui { color: #e2e8f0; }
          .swagger-ui .wrapper { background: transparent; padding: 0; max-width: none; }
          .swagger-ui .scheme-container { background: #111827; border-bottom: 1px solid #1e293b; box-shadow: none; padding: 16px 0; }
          .swagger-ui .info { margin: 20px 0; }
          .swagger-ui .info .title { color: #f1f5f9; }
          .swagger-ui .info .description p,
          .swagger-ui .info .description li { color: #94a3b8; }
          .swagger-ui .info .description h2,
          .swagger-ui .info .description h3 { color: #e2e8f0; }
          .swagger-ui .info .description code { background: #1e293b; color: #a78bfa; padding: 2px 6px; border-radius: 4px; }
          .swagger-ui .info .description pre { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 12px; }
          .swagger-ui .info .description a { color: #818cf8; }
          .swagger-ui .opblock { border-radius: 8px !important; border: 1px solid #1e293b !important; margin-bottom: 8px; background: #111827; }
          .swagger-ui .opblock .opblock-summary { border-bottom: 1px solid #1e293b; padding: 8px 16px; }
          .swagger-ui .opblock .opblock-summary-description { color: #94a3b8; }
          .swagger-ui .opblock .opblock-summary-path span { color: #e2e8f0 !important; }
          .swagger-ui .opblock .opblock-section-header { background: #0f172a; border-bottom: 1px solid #1e293b; }
          .swagger-ui .opblock .opblock-section-header h4 { color: #e2e8f0; }
          .swagger-ui .opblock-body { background: #0f172a; }
          .swagger-ui .opblock-body pre { background: #0f172a !important; color: #e2e8f0; border: 1px solid #1e293b; border-radius: 6px; }
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
          .swagger-ui .opblock-tag { color: #f1f5f9 !important; border-bottom: 1px solid #1e293b; }
          .swagger-ui .opblock-tag:hover { background: rgba(255,255,255,0.03); }
          .swagger-ui .opblock-tag small { color: #64748b !important; }
          .swagger-ui table thead tr td,
          .swagger-ui table thead tr th { color: #94a3b8; border-bottom: 1px solid #1e293b; }
          .swagger-ui .parameters-col_description p,
          .swagger-ui .parameter__name,
          .swagger-ui .parameter__type,
          .swagger-ui .parameter__in { color: #cbd5e1; }
          .swagger-ui .parameter__name.required::after { color: #ef4444; }
          .swagger-ui .responses-inner { background: transparent; }
          .swagger-ui .response-col_status { color: #e2e8f0; }
          .swagger-ui .response-col_description { color: #94a3b8; }
          .swagger-ui .response-col_links { color: #94a3b8; }
          .swagger-ui .responses-table thead td { color: #64748b; }
          .swagger-ui section.models { border: 1px solid #1e293b; border-radius: 8px; background: #111827; }
          .swagger-ui section.models h4 { color: #e2e8f0; border-bottom: 1px solid #1e293b; }
          .swagger-ui section.models .model-container { background: #0f172a; margin: 0; padding: 12px; border-bottom: 1px solid #1e293b; }
          .swagger-ui .model-title { color: #e2e8f0; }
          .swagger-ui .model { color: #94a3b8; }
          .swagger-ui .prop-type { color: #818cf8; }
          .swagger-ui input[type=text],
          .swagger-ui input[type=password],
          .swagger-ui input[type=search],
          .swagger-ui input[type=email],
          .swagger-ui input[type=file],
          .swagger-ui textarea,
          .swagger-ui select { background: #0f172a !important; color: #e2e8f0 !important; border: 1px solid #334155 !important; border-radius: 6px; }
          .swagger-ui select option { background: #1e293b; color: #e2e8f0; }
          .swagger-ui .btn { border-radius: 6px; }
          .swagger-ui .btn.execute { background: #7c3aed; border-color: #7c3aed; color: #fff; }
          .swagger-ui .btn.execute:hover { background: #6d28d9; }
          .swagger-ui .btn.cancel { border-color: #475569; color: #94a3b8; }
          .swagger-ui .btn.authorize { background: #059669; border-color: #059669; color: #fff; }
          .swagger-ui .btn.authorize svg { fill: #fff; }
          .swagger-ui .dialog-ux .modal-ux { background: #111827; border: 1px solid #1e293b; border-radius: 12px; }
          .swagger-ui .dialog-ux .modal-ux-header { border-bottom: 1px solid #1e293b; }
          .swagger-ui .dialog-ux .modal-ux-header h3 { color: #f1f5f9; }
          .swagger-ui .dialog-ux .modal-ux-content p,
          .swagger-ui .dialog-ux .modal-ux-content label { color: #94a3b8; }
          .swagger-ui .dialog-ux .backdrop-ux { background: rgba(0,0,0,0.7); }
          .swagger-ui .topbar { display: none; }
          .swagger-ui .try-out__btn { border-color: #475569; color: #94a3b8; }
          .swagger-ui .try-out__btn:hover { color: #e2e8f0; border-color: #818cf8; }
          .swagger-ui .curl-command .copy-to-clipboard { background: #1e293b; border: 1px solid #334155; border-radius: 4px; }
          .swagger-ui .loading-container .loading::after { color: #94a3b8; }
          .swagger-ui ::-webkit-scrollbar { width: 6px; height: 6px; }
          .swagger-ui ::-webkit-scrollbar-track { background: #0f172a; }
          .swagger-ui ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
          .swagger-ui .markdown p,
          .swagger-ui .markdown li { color: #94a3b8; }
          .swagger-ui .markdown code { background: #1e293b; color: #a78bfa; }
          .swagger-ui .renderedMarkdown p { color: #94a3b8; }
          .swagger-ui .highlight-code { background: #0f172a !important; }
          .swagger-ui .microlight { background: #0f172a !important; color: #e2e8f0 !important; border: 1px solid #1e293b; border-radius: 6px; padding: 12px !important; font-size: 13px; }
          .swagger-ui .servers > label { color: #94a3b8; }
          .swagger-ui .servers select { background: #0f172a; color: #e2e8f0; border: 1px solid #334155; }
          .swagger-ui svg.arrow { fill: #94a3b8; }
          .swagger-ui .expand-operation svg { fill: #64748b; }
          .swagger-ui .copy-to-clipboard { background: #1e293b; }
          .swagger-ui .copy-to-clipboard button { background: transparent; }
          .swagger-ui .responses-wrapper .col_header { color: #94a3b8; }
          .swagger-ui .response .response-col_description__inner p { color: #94a3b8; }
          .swagger-ui .tab li { color: #64748b; }
          .swagger-ui .tab li.active { color: #e2e8f0; }
          .swagger-ui .tab li button.tablinks { color: inherit; background: transparent; }
        `}</style>
      </Head>
      <div id="swagger-ui" className="p-4 md:p-6" />
    </div>
  );
}

export default ApiDocs;
