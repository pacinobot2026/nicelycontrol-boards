import { useState, useEffect } from 'react';
import Head from 'next/head';
import NavigationSidebar from '../components/NavigationSidebar';
import withAuth from '../lib/withAuth';

// Animated counter hook
function useCounter(end, duration = 1500, startDelay = 0) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const delayTimer = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(delayTimer);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;

    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(end * easeOut));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, started]);

  return count;
}

// Animated money hook
function useMoney(end, duration = 2000, startDelay = 0) {
  const [amount, setAmount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const delayTimer = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(delayTimer);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;

    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAmount(end * easeOut);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, started]);

  return amount;
}

// Calculate next cron job time
function getNextCronTime(schedule, now) {
  const next = new Date(now);

  if (schedule.includes('Every 30min')) {
    const mins = next.getMinutes();
    const nextMins = mins < 30 ? 30 : 60;
    next.setMinutes(nextMins, 0, 0);
    if (nextMins === 60) {
      next.setMinutes(0);
      next.setHours(next.getHours() + 1);
    }
  } else if (schedule.includes('8:00 AM')) {
    next.setHours(8, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
  } else if (schedule.includes('10am & 4pm')) {
    const hour = now.getHours();
    if (hour < 10) {
      next.setHours(10, 0, 0, 0);
    } else if (hour < 16) {
      next.setHours(16, 0, 0, 0);
    } else {
      next.setDate(next.getDate() + 1);
      next.setHours(10, 0, 0, 0);
    }
  } else if (schedule.includes('2am')) {
    next.setHours(2, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
  } else if (schedule.includes('Real-time')) {
    next.setMinutes(next.getMinutes() + 1, 0, 0);
  } else if (schedule.includes('Weekly')) {
    next.setDate(next.getDate() + 7);
  }

  return next;
}

function formatCountdown(ms) {
  if (ms <= 0) return "NOW!";

  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 60000) % 60;
  const hours = Math.floor(ms / 3600000);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loaded, setLoaded] = useState(false);
  const [nextJob, setNextJob] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Define cronJobs FIRST so it's available for useEffect
  const cronJobs = [
    { name: 'Morning Briefing', schedule: '8:00 AM daily', status: 'active' },
    { name: 'Health Check', schedule: '10am & 4pm', status: 'active' },
    { name: 'Heartbeat Poll', schedule: 'Every 30min', status: 'active' },
    { name: 'Memory Backup', schedule: 'Daily 2am', status: 'active' },
    { name: 'Email Watch', schedule: 'Real-time', status: 'active' },
    { name: 'Update Check', schedule: 'Weekly', status: 'paused' },
  ];

  // Timer effect - now cronJobs is in scope
  useEffect(() => {
    // Initial calculation
    const calcNext = () => {
      const now = new Date();

      // Find the next cron job
      const activeJobs = cronJobs.filter(j => j.status === 'active');
      let nearestJob = null;

      for (const job of activeJobs) {
        const nextTime = getNextCronTime(job.schedule, now);
        if (!nearestJob || nextTime < nearestJob.time) {
          nearestJob = { name: job.name, schedule: job.schedule, time: nextTime };
        }
      }

      if (nearestJob !== null) {
        const jobInfo = nearestJob;
        setNextJob({
          name: jobInfo.name,
          schedule: jobInfo.schedule,
          timeLeft: jobInfo.time.getTime() - now.getTime()
        });
      }
      setCurrentTime(now);
    };

    calcNext(); // Run immediately
    const timer = setInterval(calcNext, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  // API Keys - AI Providers
  const aiApiKeys = [
    { provider: 'Anthropic', status: 'connected', masked: 'sk-ant-•••••hKTgAA' },
    { provider: 'Moonshot', status: 'connected', masked: 'sk-•••••3Kx9' },
    { provider: 'OpenAI', status: 'connected', masked: 'sk-•••••Qw2m' },
  ];

  // API Keys - 3rd Party Integrations
  const integrationKeys = [
    { provider: 'Zoom', status: 'connected', masked: 'eyJ•••••Rk2' },
    { provider: 'Vimeo', status: 'connected', masked: '8f3•••••a91' },
    { provider: 'MintBird / PopLinks', status: 'connected', masked: 'z12•••••huW' },
    { provider: 'Global Control', status: 'connected', masked: 'gc-•••••x7k' },
    { provider: 'Course Sprout', status: 'connected', masked: 'cs-•••••m3p' },
    { provider: 'Letterman', status: 'connected', masked: 'lm-•••••q2n' },
    { provider: 'SaaSOnboard', status: 'connected', masked: 'sob-•••••f4j' },
    { provider: 'AgentMail', status: 'connected', masked: 'am-•••••k8w' },
  ];

  // API Spend tracking
  const apiSpend = [
    { provider: 'Anthropic', spent: 12.47, limit: 50, percent: 25 },
    { provider: 'Moonshot', spent: 3.20, limit: 20, percent: 16 },
    { provider: 'OpenAI', spent: 1.85, limit: 10, percent: 19 },
  ];

  // Tasks from Kanban
  const tasks = [
    { title: 'OpenClaw containers (Gaurav & Pranay)', status: 'backlog', priority: 'high' },
    { title: 'Brian Anderson NDA offer', status: 'backlog', priority: 'high' },
    { title: 'OpenClaw ads', status: 'backlog', priority: 'high' },
    { title: 'OpenClaw webinar', status: 'in-progress', priority: 'high' },
    { title: 'JV script for Zoo launch', status: 'backlog', priority: 'med' },
    { title: 'Model switching command', status: 'done' },
    { title: 'Dashboard redesign', status: 'done' },
  ];

  // Configuration data
  const models = [
    { name: 'Claude Opus 4.5', provider: 'Anthropic', status: 'active' },
    { name: 'Kimi K2.5', provider: 'Moonshot', status: 'active' },
    { name: 'Kimi K2 Thinking', provider: 'Moonshot', status: 'available' },
    { name: 'Claude Sonnet 3.5', provider: 'Anthropic', status: 'available' },
    { name: 'Claude Haiku 3.5', provider: 'Anthropic', status: 'available' },
  ];

  const channels = [
    { name: 'Telegram', type: 'Primary', status: 'connected' },
    { name: 'Discord', type: 'Community', status: 'connected' },
  ];

  const features = [
    'Auto Model Selection',
    'Memory Persistence',
    'Kanban Integration',
    'Browser Automation',
    'Skill System',
    'Cron Scheduling',
  ];

  const tasksByStatus = {
    backlog: tasks.filter(t => t.status === 'backlog'),
    inProgress: tasks.filter(t => t.status === 'in-progress'),
    done: tasks.filter(t => t.status === 'done'),
  };

  // Animated counters
  const modelCount = useCounter(models.length, 1000, 200);
  const integrationCount = useCounter(integrationKeys.length, 1000, 300);
  const cronCount = useCounter(cronJobs.length, 1000, 400);
  const channelCount = useCounter(channels.length, 1000, 500);
  const totalSpend = useMoney(17.52, 2000, 600);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <Head><title>Command Center</title></Head>
      <NavigationSidebar />
      <main className="flex-1 text-white p-4 md:p-8 md:pt-8 pt-16 overflow-hidden relative">
      {/* Hamburger Menu - Top Right */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="hamburger-menu fixed top-4 right-4 z-[1001] bg-gray-800 border border-gray-700 rounded-lg p-3 text-white cursor-pointer shadow-lg"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Publications Menu Dropdown */}
      {mobileMenuOpen && (
        <>
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-[999]"
          />
          <div className="fixed top-[72px] right-4 bg-gray-800 border border-gray-700 rounded-xl p-2 z-[1000] min-w-[200px] shadow-xl">
            <div className="px-3 py-2 text-gray-400 text-xs font-semibold uppercase">
              Publications
            </div>
            <a href="/videocue" className="flex items-center gap-3 px-3 py-3 text-white no-underline rounded-lg hover:bg-gray-700 transition-colors">
              <span className="text-xl">🎬</span>
              <span className="text-sm">Video Board</span>
            </a>
            <a href="/articles" className="flex items-center gap-3 px-3 py-3 text-white no-underline rounded-lg hover:bg-gray-700 transition-colors">
              <span className="text-xl">📰</span>
              <span className="text-sm">Article Board</span>
            </a>
            <a href="/ideas" className="flex items-center gap-3 px-3 py-3 text-white no-underline rounded-lg hover:bg-gray-700 transition-colors">
              <span className="text-xl">💡</span>
              <span className="text-sm">Idea Board</span>
            </a>
            <a href="/resourcelibrary" className="flex items-center gap-3 px-3 py-3 text-white no-underline rounded-lg hover:bg-gray-700 transition-colors">
              <span className="text-xl">📑</span>
              <span className="text-sm">Resource Library</span>
            </a>
            <a href="/wishlist" className="flex items-center gap-3 px-3 py-3 text-white no-underline rounded-lg hover:bg-gray-700 transition-colors">
              <span className="text-xl">🛒</span>
              <span className="text-sm">Wishlist</span>
            </a>
            <a href="/projects" className="flex items-center gap-3 px-3 py-3 text-white no-underline rounded-lg hover:bg-gray-700 transition-colors">
              <span className="text-xl">📂</span>
              <span className="text-sm">Projects</span>
            </a>
            <div className="h-px bg-gray-700 my-2" />
            <a href="/" className="flex items-center gap-3 px-3 py-3 text-white no-underline rounded-lg bg-purple-900/20 transition-colors">
              <span className="text-xl">🎛️</span>
              <span className="text-sm">Command Center</span>
            </a>
            <a href="/teamboard" className="flex items-center gap-3 px-3 py-3 text-white no-underline rounded-lg hover:bg-gray-700 transition-colors">
              <span className="text-xl">👥</span>
              <span className="text-sm">Team Board</span>
            </a>
            <a href="/openclaw" className="flex items-center gap-3 px-3 py-3 text-white no-underline rounded-lg hover:bg-gray-700 transition-colors">
              <span className="text-xl">🤖</span>
              <span className="text-sm">OpenClaw Board</span>
            </a>
          </div>
        </>
      )}

      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-float delay-500" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-float delay-1000" />
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto relative">
        <div className={`flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 ${loaded ? 'animate-fadeInUp' : 'opacity-0'}`}>
          <div>
            <h1 className="text-2xl md:text-3xl 2xl:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
              OpenClaw — Personal AI Agent
            </h1>
            <p className="text-gray-400 mt-1 text-sm md:text-base">Full Configuration Overview</p>
          </div>
          <div className="text-left md:text-right">
            <div className="text-xl md:text-2xl font-mono text-cyan-400 tabular-nums animate-numberFlash">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-gray-500 text-xs md:text-sm">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <a
              href="/commands"
              className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs transition-colors"
            >
              🎬 Command Center →
            </a>
          </div>
        </div>

        {/* Next Cron Job Banner */}
        {nextJob && (
          <div className={`mb-6 ${loaded ? 'animate-fadeInUp delay-100' : 'opacity-0'}`}>
            <div className="bg-gradient-to-r from-cyan-900/50 via-blue-900/50 to-purple-900/50 rounded-xl p-4 border border-cyan-500/30 animate-pulseGlow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl animate-bounceSoft">⏰</div>
                  <div>
                    <div className="text-xs text-cyan-400 uppercase tracking-wide">Next Cron Job</div>
                    <div className="font-bold text-lg">{nextJob.name}</div>
                    <div className="text-xs text-gray-400">{nextJob.schedule}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Runs In</div>
                  <div className={`text-2xl md:text-3xl font-mono font-bold tabular-nums ${nextJob.timeLeft < 60000 ? 'text-red-400 animate-numberFlash' : 'text-cyan-400'}`}>
                    {formatCountdown(nextJob.timeLeft)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className={`grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6 ${loaded ? 'animate-fadeInUp delay-200' : 'opacity-0'}`}>
          <StatCard label="AI Models" value={modelCount} icon="🧠" />
          <StatCard label="Integrations" value={integrationCount} icon="🔌" />
          <StatCard label="Cron Jobs" value={cronCount} icon="⏰" />
          <StatCard label="Channels" value={channelCount} icon="📡" />
          <StatCard label="Session Life" value="365d" icon="♾️" isText />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* API Keys */}
            <div className={`bg-gray-900/50 rounded-xl p-4 md:p-6 border border-gray-700/50 ${loaded ? 'animate-slideInLeft delay-300' : 'opacity-0'}`}>
              <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                <span>🔑</span> AI API Keys
              </h2>
              <div className="space-y-2">
                {aiApiKeys.map((key, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-cyan-500/50 hover:bg-gray-800/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${key.status === 'connected' ? 'bg-green-500 animate-statusPulse' : 'bg-red-500'}`} />
                      <div>
                        <div className="font-medium">{key.provider}</div>
                        <div className="text-xs text-gray-500 font-mono">{key.masked}</div>
                      </div>
                    </div>
                    <StatusBadge status={key.status} />
                  </div>
                ))}
              </div>
            </div>

            {/* API Spend */}
            <div className={`bg-gray-900/50 rounded-xl p-4 md:p-6 border border-gray-700/50 ${loaded ? 'animate-slideInLeft delay-400' : 'opacity-0'}`}>
              <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                <span>💰</span> API Spend (This Month)
              </h2>
              <div className="space-y-3">
                {apiSpend.map((spend, i) => (
                  <SpendBar key={i} spend={spend} delay={i * 300 + 800} loaded={loaded} />
                ))}
                <div className="text-right text-sm text-gray-400 pt-2 border-t border-gray-700">
                  Total: <span className="text-cyan-400 font-medium animate-numberFlash">${totalSpend.toFixed(2)}</span> / $80.00
                </div>
              </div>
            </div>

            {/* AI Model Stack */}
            <div className={`bg-gray-900/50 rounded-xl p-4 md:p-6 border border-gray-700/50 ${loaded ? 'animate-slideInLeft delay-500' : 'opacity-0'}`}>
              <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                <span>🧠</span> AI Model Stack
              </h2>
              <div className="space-y-2">
                {models.map((model, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-cyan-500/50 hover:bg-gray-800/70 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-xs text-gray-500">{model.provider}</div>
                    </div>
                    <StatusBadge status={model.status} />
                  </div>
                ))}
              </div>
            </div>

            {/* Cron Jobs */}
            <div className={`bg-gray-900/50 rounded-xl p-4 md:p-6 border border-gray-700/50 ${loaded ? 'animate-slideInLeft delay-600' : 'opacity-0'}`}>
              <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                <span>⏰</span> Automated Cron Jobs
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {cronJobs.map((job, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-300">
                    <div>
                      <div className="font-medium text-sm">{job.name}</div>
                      <div className="text-xs text-gray-500">{job.schedule}</div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${job.status === 'active' ? 'bg-green-500 animate-statusPulse' : 'bg-yellow-500'}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Tasks */}
            <div className={`bg-gray-900/50 rounded-xl p-4 md:p-6 border border-gray-700/50 ${loaded ? 'animate-slideInRight delay-300' : 'opacity-0'}`}>
              <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                <span>📋</span> Tasks
              </h2>
              <div className="space-y-4">
                {tasksByStatus.inProgress.length > 0 && (
                  <div>
                    <div className="text-xs text-yellow-400 font-medium mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full animate-statusPulse"></span> In Progress ({tasksByStatus.inProgress.length})
                    </div>
                    {tasksByStatus.inProgress.map((task, i) => (
                      <TaskItem key={i} task={task} />
                    ))}
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span> Backlog ({tasksByStatus.backlog.length})
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {tasksByStatus.backlog.slice(0, 5).map((task, i) => (
                      <TaskItem key={i} task={task} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-green-400 font-medium mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-statusPulse"></span> Done ({tasksByStatus.done.length})
                  </div>
                  {tasksByStatus.done.slice(0, 3).map((task, i) => (
                    <TaskItem key={i} task={task} />
                  ))}
                </div>
              </div>
            </div>

            {/* Channels */}
            <div className={`bg-gray-900/50 rounded-xl p-4 md:p-6 border border-gray-700/50 ${loaded ? 'animate-slideInRight delay-400' : 'opacity-0'}`}>
              <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                <span>📡</span> Connected Channels
              </h2>
              <div className="space-y-2">
                {channels.map((channel, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-300">
                    <div>
                      <div className="font-medium">{channel.name}</div>
                      <div className="text-xs text-gray-500">{channel.type}</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${channel.status === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {channel.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Integrations */}
            <div className={`bg-gray-900/50 rounded-xl p-4 md:p-6 border border-gray-700/50 ${loaded ? 'animate-slideInRight delay-500' : 'opacity-0'}`}>
              <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                <span>🔌</span> 3rd Party Integrations
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {integrationKeys.map((key, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${key.status === 'connected' ? 'bg-green-500 animate-statusPulse' : 'bg-red-500'}`} />
                      <div>
                        <div className="font-medium text-sm">{key.provider}</div>
                        <div className="text-xs text-gray-500 font-mono">{key.masked}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className={`bg-gray-900/50 rounded-xl p-4 md:p-6 border border-gray-700/50 ${loaded ? 'animate-slideInRight delay-600' : 'opacity-0'}`}>
              <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                <span>⚡</span> Key Features
              </h2>
              <div className="flex flex-wrap gap-2">
                {features.map((feature, i) => (
                  <span key={i} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs text-cyan-400 hover:bg-cyan-500/20 hover:scale-105 transition-all duration-300 cursor-default">
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Logo */}
            <div className={`bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50 text-center ${loaded ? 'animate-scaleIn delay-700' : 'opacity-0'}`}>
              <div className="text-6xl mb-4 animate-bounceSoft">🦞</div>
              <div className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                OpenClaw
              </div>
              <div className="text-gray-500 text-sm mt-1">Personal AI Agent</div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-gray-600">WINDOWS VPS</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    </div>
  );
}

function StatCard({ label, value, icon, isText }) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-3 md:p-4 border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 animate-pulseGlow">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="text-xl md:text-2xl">{icon}</div>
        <div>
          <div className={`text-xl md:text-2xl font-bold text-cyan-400 tabular-nums ${!isText ? 'animate-numberFlash' : ''}`}>
            {value}
          </div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    available: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    offline: 'bg-red-500/20 text-red-400 border-red-500/30',
    connected: 'bg-green-500/20 text-green-400 border-green-500/30',
    missing: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs border ${styles[status] || styles.available}`}>
      {status}
    </span>
  );
}

function TaskItem({ task }) {
  const priorityColors = {
    high: 'text-red-400',
    med: 'text-yellow-400',
    low: 'text-gray-400',
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-800/30 rounded text-sm hover:bg-gray-800/50 transition-all duration-300">
      <span className={task.status === 'done' ? 'line-through text-gray-500' : ''}>
        {task.title}
      </span>
      {task.priority && (
        <span className={`text-xs ${priorityColors[task.priority]}`}>
          [{task.priority}]
        </span>
      )}
    </div>
  );
}

function SpendBar({ spend, delay, loaded }) {
  const [width, setWidth] = useState(0);
  const amount = useMoney(spend.spent, 1500, delay);

  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => setWidth(spend.percent), delay);
      return () => clearTimeout(timer);
    }
  }, [spend.percent, delay, loaded]);

  return (
    <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-cyan-500/30 transition-all duration-300">
      <div className="flex justify-between mb-2">
        <span className="font-medium">{spend.provider}</span>
        <span className="text-sm">
          <span className="text-cyan-400 tabular-nums">${amount.toFixed(2)}</span>
          <span className="text-gray-500"> / ${spend.limit.toFixed(2)}</span>
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default withAuth(Dashboard);
