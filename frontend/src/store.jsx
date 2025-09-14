import { createContext, useContext, useMemo, useState, useEffect } from 'react'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Check localStorage for saved theme, default to 'dark'
    const savedTheme = localStorage.getItem('theme')
    return savedTheme || 'dark'
  })

  // Apply theme to document on mount and when theme changes
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.add('theme-light')
    } else {
      root.classList.remove('theme-light')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const [users, setUsers] = useState({
    'u1': { id: 'u1', handle: 'canvas_guard', name: 'CanvasGuard', verified: true, avatar: 'https://ui-avatars.com/api/?name=C+G&background=111827&color=fff' },
    'u2': { id: 'u2', handle: 'inkfox', name: 'Ink Fox', verified: true, avatar: 'https://ui-avatars.com/api/?name=Ink+Fox&background=111827&color=fff' },
    'u3': { id: 'u3', handle: 'pixel_painter', name: 'Pixel Painter', verified: false, avatar: 'https://ui-avatars.com/api/?name=Pixel+Painter&background=111827&color=fff' },
    'u4': { id: 'u4', handle: 'aurora_art', name: 'Aurora Art', verified: false, avatar: 'https://ui-avatars.com/api/?name=Aurora+Art&background=111827&color=fff' },
    'me': { id: 'me', handle: 'you', name: 'You', verified: false, avatar: 'https://ui-avatars.com/api/?name=You&background=111827&color=fff' },
  })

  const [posts, setPosts] = useState([
    { id: 'p1', authorId: 'u1', createdAt: Date.now() - 1000 * 60 * 60, text: 'Welcome to CanvasGuard. Protect, empower, connect.', mediaUrl: '', license: ['no_ai'], watermarked: true, likes: new Set(), reposts: new Set(), replies: [] },
    { id: 'p2', authorId: 'u1', createdAt: Date.now() - 1000 * 30, text: 'Sample illustration from Unsplash (credit in alt).', mediaUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop', license: ['no_ai', 'credit_required'], watermarked: true, likes: new Set(['me']), reposts: new Set(), replies: [] },
    { id: 'p3', authorId: 'u2', createdAt: Date.now() - 1000 * 90, text: 'New ink sketch: fox spirit guardian.', mediaUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop', license: ['no_ai'], watermarked: true, likes: new Set(), reposts: new Set(['me']), replies: [] },
    { id: 'p4', authorId: 'u3', createdAt: Date.now() - 1000 * 120, text: 'Pixel landscape study. Free to repost with credit.', mediaUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop', license: ['credit_required'], watermarked: false, likes: new Set(['me']), reposts: new Set(), replies: [] },
    { id: 'p5', authorId: 'u4', createdAt: Date.now() - 1000 * 300, text: 'Aurora over the mountains — reference practice.', mediaUrl: 'https://images.unsplash.com/photo-1445219184880-7ef53f79c5b9?q=80&w=1200&auto=format&fit=crop', license: ['no_ai', 'no_commercial'], watermarked: true, likes: new Set(), reposts: new Set(), replies: [] },
    // dummy posts for current user profile
    { id: 'p_me_1', authorId: 'me', createdAt: Date.now() - 1000 * 45, text: 'My first CanvasGuard post! 🚀', mediaUrl: 'https://images.unsplash.com/photo-1496317899792-9d7dbcd928a1?q=80&w=1200&auto=format&fit=crop', license: ['no_ai'], watermarked: true, likes: new Set(), reposts: new Set(), replies: [] },
    { id: 'p_me_2', authorId: 'me', createdAt: Date.now() - 1000 * 25, text: 'Sharing a WIP sketch today.', mediaUrl: 'https://images.unsplash.com/photo-1526312426976-593c2b999d95?q=80&w=1200&auto=format&fit=crop', license: ['no_ai'], watermarked: true, likes: new Set(), reposts: new Set(), replies: [] },
  ])

  const [communities, setCommunities] = useState([
    {
      id: 'c_art',
      name: 'Art',
      description: 'Share illustrations, paintings, and concept art',
      posts: [
        { id: 'cp_art_1', authorId: 'u1', text: 'Warm-up figure sketch', mediaUrl: 'https://images.unsplash.com/photo-1526312426976-593c2b999d95?q=80&w=1200&auto=format&fit=crop', createdAt: Date.now() - 1000 * 60 * 10 },
        { id: 'cp_art_2', authorId: 'u3', text: 'Color study at dusk', mediaUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop', createdAt: Date.now() - 1000 * 60 * 5 },
      ],
    },
    {
      id: 'c_gaming',
      name: 'Gaming',
      description: 'Game art, fan art, and pixel art',
      posts: [
        { id: 'cp_g_1', authorId: 'u2', text: 'Boss concept sheet', mediaUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop', createdAt: Date.now() - 1000 * 60 * 15 },
        { id: 'cp_g_2', authorId: 'u4', text: '8-bit forest tileset', mediaUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop', createdAt: Date.now() - 1000 * 60 * 2 },
      ],
    },
    {
      id: 'c_webdev',
      name: 'Web Dev',
      description: 'UI mocks, icons, and SVG art',
      posts: [
        { id: 'cp_w_1', authorId: 'u1', text: 'SVG gradient experiment', mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop', createdAt: Date.now() - 1000 * 60 * 25 },
        { id: 'cp_w_2', authorId: 'u2', text: 'Icon set WIP', mediaUrl: 'https://images.unsplash.com/photo-1481277542470-605612bd2d61?q=80&w=1200&auto=format&fit=crop', createdAt: Date.now() - 1000 * 60 * 8 },
      ],
    },
  ])

  function createPost(authorId, text, options = {}) {
    const id = `p${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`
    const { mediaUrl = '', license = [], watermarked = false } = options
    const post = { id, authorId, createdAt: Date.now(), text, mediaUrl, license, watermarked, likes: new Set(), reposts: new Set(), replies: [] }
    setPosts(prev => [post, ...prev])
  }

  function addComment(postId, userId, text) {
    const reply = { id: `r${Math.random().toString(36).slice(2)}`, userId, text, createdAt: Date.now() }
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, replies: [...p.replies, reply] } : p))
  }

  function toggleLike(postId, userId) {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const likes = new Set(p.likes)
      likes.has(userId) ? likes.delete(userId) : likes.add(userId)
      return { ...p, likes }
    }))
  }

  function toggleRepost(postId, userId) {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const reposts = new Set(p.reposts)
      reposts.has(userId) ? reposts.delete(userId) : reposts.add(userId)
      return { ...p, reposts }
    }))
  }

  function createCommunityPost(communityId, authorId, text, mediaUrl) {
    setCommunities(prev => prev.map(c => {
      if (c.id !== communityId) return c
      const newPost = {
        id: `cp_${communityId}_${Math.random().toString(36).slice(2)}`,
        authorId,
        text,
        mediaUrl,
        createdAt: Date.now(),
      }
      return { ...c, posts: [newPost, ...c.posts] }
    }))
  }

  const value = useMemo(() => ({ 
    users, posts, communities, createPost, toggleLike, toggleRepost, addComment, createCommunityPost,
    theme, toggleTheme 
  }), [users, posts, communities, theme])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}


