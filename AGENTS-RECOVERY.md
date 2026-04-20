# AI Agent Command Center - Context Recovery Instructions

## Quick Reference
- **Project**: AI Agent Command Center (agents.html)
- **Location**: `nicelycontrol-boards/public/agents.html`
- **Current Control Tag**: `control-agents-float-2026-04-19`
- **Local URL**: `file:///C:/Users/Administrator/.openclaw/workspace/nicelycontrol-boards/public/agents.html`
- **Production URL**: https://nicelycontrol.com/agents.html

---

## Current State (Last Updated: 2026-04-19 8:40 PM)

### What's Built

1. **3-Panel Layout**
   - Left: Agent fleet list with status dots (green=online, yellow=working)
   - Center: Toggle between Card view and Orbit view
   - Right: Main menu + Agent detail panel (3 tabs: Agent, Chat, Tasks)

2. **Orbit View Features** ✅ COMPLETE
   - Only shows agents that are currently working
   - **Agents float all over the screen** (not just around center)
   - **Enter from sides** - fade in from off-screen positions
   - **8-second animation cycles** (fast and lively)
   - **Avoid center hub** - 180px protected zone around Pacino
   - **6 different float patterns** for variety
   - Dynamic updates when agents start/stop working
   - **Tooltips on hover** showing: Name, Description, Current Task
   - Hover pauses animation and shows enhanced glow
   - Pulsing glow animations for hub and agents

3. **Card View**
   - Shows working agents as cards
   - Click to open agent detail

4. **Agent Detail Panel**
   - 3 tabs: Agent (info), Chat (messages), Tasks (task list)
   - Clickable agent icon to change (emoji picker or image upload)
   - Edit popup for name, description, about, capabilities
   - Task modals showing task details

5. **Settings Panel**
   - Toggle agent glows on/off

6. **Task System**
   - Auto-generates tasks every 1.5 seconds
   - Assigns to available agents
   - Progress bars show completion
   - Completed tasks move to "Recently Completed" list

---

## Control Version History

| Tag | Commit | Description |
|-----|--------|-------------|
| `control-agents-float-2026-04-19` | 729fab9 | Latest: Floating agents from sides, 8s animations, tooltips |
| `control-agents-tooltip-2026-04-19` | caffd39 | Added hover tooltips |
| `control-agents-2026-04-19` | 8632941 | Initial control version |

---

## How to Resume Work

### Step 1: Verify Control Version
```bash
cd nicelycontrol-boards
git log --oneline -3
# Should show: 729fab9 Update orbit agents: faster animations...
```

### Step 2: Check Current State
```bash
git status
# Should be clean (no uncommitted changes)
```

### Step 3: Open the File
- Local: `file:///C:/Users/Administrator/.openclaw/workspace/nicelycontrol-boards/public/agents.html`
- Production: https://nicelycontrol.com/agents.html

### Step 4: Ask Chad
"I'm ready to continue work on the AI Agent Command Center. What would you like me to work on?"

---

## Common Tasks

### Deploy to Production
```bash
cd nicelycontrol-boards
npx vercel --prod --yes --token $env:VERCEL_TOKEN
```

### Add New Agent Type
1. Add to `agents` object in JavaScript
2. Define: id, name, emoji, type, status, capabilities
3. Add color to `orbitColors` object
4. Add tasks to `taskTemplates`

### Fix Card View Sizing
1. Find `switchCenterView()` function
2. Add resize handler when switching from orbit to card view
3. Ensure cards fill available space properly

### Adjust Animation Speed
1. Find animation keyframes (float1, float2, etc.)
2. Change duration in `initOrbitAgents()` - currently 8s
3. Lower = faster, Higher = slower

---

## Architecture

### HTML Structure
```
.header (title + settings icon)
.main-container
  .fleet-panel (left - agent list)
  .command-panel (center)
    .lead-agent-hub (Pacino stats)
    .working-area (card view)
    #orbit-view (orbit view - full screen)
      #orbit-agents-container (floating agents)
      center hub (Pacino)
    view toggle buttons
  .menu-panel (right)
    #main-menu-view (tasks)
    #agent-detail-panel (agent details)
#orbit-tooltip (hover tooltip)
#icon-modal (change icon)
#task-modal (task details)
#edit-popup (edit agent)
```

### Key JavaScript Functions
- `init()` - Initialize everything
- `initOrbitAgents()` - Create orbit agent elements
- `updateOrbitView()` - Show/hide working agents, start animations
- `pauseOrbitAgent()` - Pause on hover, show tooltip
- `resumeOrbitAgent()` - Resume animation, hide tooltip
- `showOrbitTooltip()` - Display tooltip with agent info
- `assignTask()` - Give task to agent
- `completeTask()` - Finish task, update UI
- `simulateActivity()` - Auto-generate tasks

### CSS Animation Keyframes
- `float1` through `float6` - Different float patterns
- `hubPulse` - Center hub pulsing glow
- Animation duration: 8s (fast)

---

## Chad's Directives

1. **Orbit agents should:**
   - ✅ Be fast (8s cycles)
   - ✅ Enter from sides (not appear in center)
   - ✅ Float all over screen
   - ✅ Avoid touching center hub
   - ✅ Show tooltips on hover

2. **Keep it simple** - No excessive animations
3. **Tooltips clean and informative** - Name, Description, Task
4. **Card view compact**
5. **Orbit view lively but not distracting**

---

## Recovery Commands

### Rollback to latest control:
```bash
cd nicelycontrol-boards
git checkout control-agents-float-2026-04-19
```

### See what changed since control:
```bash
git diff control-agents-float-2026-04-19 HEAD
```

### List all control tags:
```bash
git tag -l "control-*"
```

### If agents.html is missing:
1. Check: `git ls-files public/agents.html`
2. If not in git, check `dashboard-source.html` in root workspace
3. Ask Chad for latest version

---

## Last Session Summary (2026-04-19 Evening)

**What we did:**
1. Created control version system
2. Added tooltips to orbit agents (Name, Description, Task)
3. **Completely rebuilt orbit animations:**
   - 6 float patterns covering full screen
   - 8-second fast animations
   - Agents enter from sides (fade in)
   - Agents avoid center hub (180px zone)
   - Smooth fade out when leaving

**Current State:**
- ✅ Tooltips working
- ✅ Fast animations (8s)
- ✅ Side entry
- ✅ Full screen floating
- ✅ Center hub protected
- ✅ All committed and tagged

**Potential Next Steps:**
- Deploy to production
- Add sound effects on task complete
- Particle trails behind agents
- Different speeds per agent
- 3D perspective view
- Card view sizing fix

---

## Emergency Contacts

If completely lost:
1. Read this file
2. Check git history: `git log --oneline -10`
3. Open local file and test
4. Ask Chad: "I'm ready to continue on the AI Agent Command Center. What should I work on?"

---

*This document is the source of truth. Update it after every session with what was built and what's next.*
