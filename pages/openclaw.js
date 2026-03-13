import Head from 'next/head';
import NavigationSidebar from '../components/NavigationSidebar';
import withAuth from '../lib/withAuth';

function OpenClaw() {
  return (
    <div className="flex min-h-screen">
      <Head><title>OpenClaw</title></Head>
      <NavigationSidebar />
      <main className="flex-1 p-8 md:p-8 pt-16 md:pt-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold gradient-text mb-1">🤖 OpenClaw Board</h1>
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
