import Head from 'next/head';
import { useEffect } from 'react';

export default function ApiDocs() {
  useEffect(() => {
    // Dynamically load Swagger UI scripts after mount to avoid SSR/hydration issues
    function initSwagger() {
      if (window.SwaggerUIBundle) {
        window.SwaggerUIBundle({
          url: '/api/swagger',
          dom_id: '#swagger-ui',
          presets: [window.SwaggerUIBundle.presets.apis, window.SwaggerUIStandalonePreset],
          layout: 'StandaloneLayout',
          deepLinking: true,
          persistAuthorization: true,
        });
        return;
      }
      // Scripts not loaded yet — retry after a short delay
      setTimeout(initSwagger, 100);
    }

    const bundle = document.createElement('script');
    bundle.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js';
    bundle.onload = () => {
      const preset = document.createElement('script');
      preset.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js';
      preset.onload = initSwagger;
      document.body.appendChild(preset);
    };
    document.body.appendChild(bundle);
  }, []);

  return (
    <>
      <Head>
        <title>API Docs — Vizard Dashboard</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
      </Head>
      <div id="swagger-ui" />
    </>
  );
}
