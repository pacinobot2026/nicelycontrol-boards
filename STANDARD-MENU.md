# STANDARD HAMBURGER MENU - USE THIS IN ALL BOARDS

All boards should have this EXACT menu structure (only changing the highlighted board):

```jsx
<div style={{ padding: '8px 12px', color: '#9ca3af', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
  Boards
</div>
<a href="/videocue" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: '#fff', textDecoration: 'none', borderRadius: '8px' }}>
  <span style={{ fontSize: '20px' }}>⊞</span>
  <span style={{ fontSize: '14px' }}>Video Cue</span>
</a>
<a href="/articles" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: '#fff', textDecoration: 'none', borderRadius: '8px' }}>
  <span style={{ fontSize: '20px' }}>◈</span>
  <span style={{ fontSize: '14px' }}>Article Board</span>
</a>
<a href="/ideas" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: '#fff', textDecoration: 'none', borderRadius: '8px' }}>
  <span style={{ fontSize: '20px' }}>☆</span>
  <span style={{ fontSize: '14px' }}>Idea Board</span>
</a>
<a href="/resourcelibrary" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: '#fff', textDecoration: 'none', borderRadius: '8px' }}>
  <span style={{ fontSize: '20px' }}>▣</span>
  <span style={{ fontSize: '14px' }}>Resource Library</span>
</a>
<a href="/wishlist" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: '#fff', textDecoration: 'none', borderRadius: '8px' }}>
  <span style={{ fontSize: '20px' }}>⊡</span>
  <span style={{ fontSize: '14px' }}>Wish List</span>
</a>
<a href="/projects" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: '#fff', textDecoration: 'none', borderRadius: '8px' }}>
  <span style={{ fontSize: '20px' }}>▶</span>
  <span style={{ fontSize: '14px' }}>Projects</span>
</a>
<div style={{ height: '1px', background: '#374151', margin: '8px 0' }} />
<a href="https://dashboard-gilt-one-zc4y5uu95v.vercel.app" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: '#fff', textDecoration: 'none', borderRadius: '8px' }}>
  <span style={{ fontSize: '20px' }}>⚡</span>
  <span style={{ fontSize: '14px' }}>Command Center</span>
</a>
<a href="https://dashboard-gilt-one-zc4y5uu95v.vercel.app/commands" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: '#fff', textDecoration: 'none', borderRadius: '8px' }}>
  <span style={{ fontSize: '20px' }}>⌘</span>
  <span style={{ fontSize: '14px' }}>Custom Commands</span>
</a>
<a href="https://kanban-rho-ivory.vercel.app" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: '#fff', textDecoration: 'none', borderRadius: '8px' }}>
  <span style={{ fontSize: '20px' }}>▦</span>
  <span style={{ fontSize: '14px' }}>Team Board</span>
</a>
```

To highlight the current board, add to that board's link:
`, background: 'rgba(139, 92, 246, 0.2)'`

Example for Video Board:
`borderRadius: '8px', background: 'rgba(139, 92, 246, 0.2)' }>`
