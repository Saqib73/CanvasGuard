import { useMemo, useState } from 'react'
import { useStore } from '../store.jsx'
import Tweet from '../components/Tweet'

export default function Explore() {
  const { posts } = useStore()
  const [filterNoAI, setFilterNoAI] = useState(false)
  const [filterWatermarked, setFilterWatermarked] = useState(false)

  const filtered = useMemo(() => posts.filter(p => {
    if (filterNoAI && !p.license?.includes('no_ai')) return false
    if (filterWatermarked && !p.watermarked) return false
    return true
  }), [posts, filterNoAI, filterWatermarked])

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 backdrop-blur bg-black/60 border-b border-neutral-800 p-3 font-semibold">Explore</div>
      <div className="p-3 flex gap-3 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={filterNoAI} onChange={e => setFilterNoAI(e.target.checked)} /> Only Non-AI</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={filterWatermarked} onChange={e => setFilterWatermarked(e.target.checked)} /> Watermarked Only</label>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {filtered.map(p => <Tweet key={p.id} post={p} />)}
      </div>
    </div>
  )
}


