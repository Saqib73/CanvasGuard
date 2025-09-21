import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useStore } from '../store.jsx'
import Tweet from '../components/Tweet'

export default function Profile() {
  const { id } = useParams()
  const { users, posts } = useStore()
  const [mode, setMode] = useState('posts')
  const user = users[id] || users['me']
  const userPosts = useMemo(() => posts.filter(p => p.authorId === (users[id] ? id : 'me')), [posts, id, users])
  const isOwnProfile = !id || id === 'me'

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      {/* Cover Photo */}
      <div className="w-full h-40 bg-sky-700" />
      
      {/* Profile Header */}
      <div className="px-4 -mt-10 flex items-end gap-4">
        <img src={user.avatar} alt="avatar" className="h-24 w-24 rounded-full ring-4 ring-neutral-300 dark:ring-black" />
        <div className="flex-1" />
        {isOwnProfile && (
          <Link 
            to="/edit-profile" 
            className="px-4 py-2 bg-cg-card hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full border border-neutral-300 dark:border-neutral-700 text-cg-text text-sm font-semibold transition-colors duration-200"
          >
            Edit profile
          </Link>
        )}
      </div>
      
      {/* Profile Info */}
      <div className="px-4 mt-3">
        <div className="flex items-center gap-2 text-xl font-bold">
          {user.name} {user.verified && <span className="text-sky-400">✔</span>}
        </div>
        <div className="text-neutral-500 dark:text-neutral-400">@{user.handle}</div>
      </div>
      
      <div className="px-4 mt-3 text-[15px] text-cg-text">
        Download Free Exclusive PSD Files, PSD graphics, PSD Templates, PSD backgrounds and many PhotoShop resources.
      </div>
      
      <div className="px-4 mt-3 flex flex-wrap gap-4 text-sm text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-2">
          <span>🔗</span>
          <a className="hover:underline" href="#">https://psd.zone</a>
        </div>
        <div className="flex items-center gap-2">
          <span>📍</span>
          <span>Freiburg, Germany</span>
        </div>
        <div className="flex items-center gap-2">
          <span>📅</span>
          <span>Joined August 2022</span>
        </div>
      </div>
      
      <div className="px-4 mt-3 flex gap-6 text-sm">
        <div><span className="font-semibold">2191</span> <span className="text-neutral-500 dark:text-neutral-400">Following</span></div>
        <div><span className="font-semibold">984K</span> <span className="text-neutral-500 dark:text-neutral-400">Followers</span></div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="mt-4 border-b border-neutral-300 dark:border-neutral-800 grid grid-cols-3 text-center text-sm">
        <button 
          onClick={() => setMode('posts')} 
          className={`py-3 ${mode === 'posts' ? 'font-semibold border-b-2 border-sky-500' : 'text-neutral-500 dark:text-neutral-400'}`}
        >
          Posts
        </button>
        <button 
          onClick={() => setMode('media')} 
          className={`py-3 ${mode === 'media' ? 'font-semibold border-b-2 border-sky-500' : 'text-neutral-500 dark:text-neutral-400'}`}
        >
          Media
        </button>
        <button 
          onClick={() => setMode('likes')} 
          className={`py-3 ${mode === 'likes' ? 'font-semibold border-b-2 border-sky-500' : 'text-neutral-500 dark:text-neutral-400'}`}
        >
          Likes
        </button>
      </div>

      {/* Content Area */}
      <div>
        {mode === 'media' ? (
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {userPosts.filter(p => p.mediaUrl).map(p => (
              <div key={p.id} className="relative overflow-hidden rounded-xl border border-neutral-300 dark:border-neutral-800">
                <img src={p.mediaUrl} alt="art" className="w-full h-56 object-cover" />
                {p.watermarked && (
                  <div className="absolute inset-0 grid place-items-center pointer-events-none">
                    <div className="text-white/25 text-3xl font-black select-none rotate-[-20deg]">CANVASGUARD</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div>
            {userPosts.map(p => <Tweet key={p.id} post={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}


