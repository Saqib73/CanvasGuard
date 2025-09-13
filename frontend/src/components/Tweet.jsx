import { useStore } from '../store.jsx'

function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

import { Link } from 'react-router-dom'

export default function Tweet({ post }) {
  const { users, toggleLike, toggleRepost } = useStore()
  const author = users[post.authorId]
  const isLiked = post.likes.has('me')
  const isReposted = post.reposts.has('me')

  return (
    <div className="flex gap-3 p-4 border-b border-neutral-800 hover:bg-black/5 transition-colors">
      <img alt="avatar" src={author?.avatar} className="h-10 w-10 rounded-full ring-1 ring-neutral-800" />
      <div className="flex-1">
        <div className="flex gap-2 items-center text-sm">
          <span className="font-semibold">{author?.name}</span>
          {author?.verified && <span className="text-sky-400">✔</span>}
          <span className="text-neutral-400">@{author?.handle}</span>
        </div>
        <Link to={`/post/${post.id}`} className="block whitespace-pre-wrap text-[15px] leading-5 mt-1 hover:underline">
          {post.text}
        </Link>
        {post.mediaUrl && (
          <Link to={`/post/${post.id}`} className="mt-2 block overflow-hidden rounded-2xl border border-neutral-800 shadow-lg shadow-black/30">
            <div className="relative">
              <img src={post.mediaUrl} alt="media" className="max-h-[480px] w-full object-cover" />
              {post.watermarked && (
                <div className="absolute inset-0 grid place-items-center pointer-events-none">
                  <div className="text-white/25 text-5xl font-black select-none rotate-[-20deg]">CANVASGUARD</div>
                </div>
              )}
            </div>
          </Link>
        )}
        <div className="flex gap-2 mt-2 text-xs text-neutral-500">
          {post.license?.includes('no_ai') && <span className="cg-chip">No AI</span>}
          {post.license?.includes('credit_required') && <span className="cg-chip">Credit required</span>}
          {post.license?.includes('no_commercial') && <span className="cg-chip">No commercial</span>}
        </div>
        <div className="flex justify-between text-neutral-400 text-sm mt-3 max-w-md">
          <button className={`hover:text-sky-400 flex items-center gap-2`} onClick={() => { }}>
            <span>💬</span>
            <span>Reply</span>
          </button>
          <button className={`${isReposted ? 'text-green-500' : 'hover:text-green-500'} flex items-center gap-2`} onClick={() => toggleRepost(post.id, 'me')}>
            <span>🔁</span>
            <span>Repost {post.reposts.size ? formatCount(post.reposts.size) : ''}</span>
          </button>
          <button className={`${isLiked ? 'text-pink-500' : 'hover:text-pink-500'} flex items-center gap-2`} onClick={() => toggleLike(post.id, 'me')}>
            <span>❤</span>
            <span>Like {post.likes.size ? formatCount(post.likes.size) : ''}</span>
          </button>
          <button className="hover:text-neutral-200 flex items-center gap-2" onClick={() => { }}>
            <span>📤</span>
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  )
}


