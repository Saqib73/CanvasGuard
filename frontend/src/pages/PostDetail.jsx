import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useStore } from '../store.jsx'
import Tweet from '../components/Tweet'

export default function PostDetail() {
  const { id } = useParams()
  const { posts, users, addComment } = useStore()
  const post = posts.find(p => p.id === id)
  const [comment, setComment] = useState('')

  // Seed dummy comments when opening a post if none exist yet
  useEffect(() => {
    if (post && Array.isArray(post.replies) && post.replies.length === 0) {
      addComment(post.id, 'u2', 'Stunning work! The textures are amazing.')
      addComment(post.id, 'u3', 'Love the vibes here ✨')
    }
    // we intentionally only run on first mount for this post id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id])

  if (!post) return <div className="p-6">Post not found.</div>

  return (
    <div>
      <div className="sticky top-0 backdrop-blur bg-black/60 border-b border-neutral-800 p-3 font-semibold">Post</div>
      <Tweet post={post} />
      <div className="p-4 min-h-[50vh]">
        <div className="cg-card p-4">
          <div className="font-semibold mb-2">Add a comment</div>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Write your reply..." className="w-full bg-transparent outline-none resize-none min-h-20" />
          <div className="flex justify-end">
            <button disabled={!comment.trim()} onClick={() => { addComment(post.id, 'me', comment.trim()); setComment('') }} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 rounded-full font-semibold">Reply</button>
          </div>
        </div>

        <div className="mt-4">
          {post.replies.map(r => (
            <div key={r.id} className="flex gap-3 p-4 border-b border-neutral-800">
              <img alt="avatar" src={users[r.userId]?.avatar} className="h-9 w-9 rounded-full ring-1 ring-neutral-800" />
              <div>
                <div className="text-sm text-neutral-300">
                  <span className="font-semibold">{users[r.userId]?.name || 'User'}</span>
                  <span className="text-neutral-500 ml-2">@{users[r.userId]?.handle}</span>
                </div>
                <div className="text-[15px] leading-5 mt-1 whitespace-pre-wrap">{r.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


