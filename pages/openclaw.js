import Head from 'next/head';
import NavigationSidebar from '../components/NavigationSidebar';
import withAuth from '../lib/withAuth';

function OpenClaw() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <Head><title>OpenClaw</title></Head>
      <NavigationSidebar />
      <main className="flex-1 text-white p-4 md:p-8 md:pt-8 pt-16 overflow-hidden relative">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl 2xl:text-4xl font-bold gradient-text mb-1">🤖 OpenClaw Board</h1>
            <p className="text-sm text-gray-400">OpenClaw automation dashboard</p>
          </div>

          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="text-6xl mb-6">🤖</div>
            <h2 className="text-2xl font-semibold text-white mb-3">OpenClaw Dashboard Coming Soon</h2>
            <p className="text-gray-400">
              This board will show OpenClaw automations, cron jobs, and system status.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default withAuth(OpenClaw);
