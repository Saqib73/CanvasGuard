import { useState } from 'react'
import { useStore } from '../store.jsx'
import Composer from '../components/Composer'
import Tweet from '../components/Tweet'

export default function Home() {
  const { posts } = useStore()
  const [active, setActive] = useState('For you')

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-[rgb(var(--cg-bg))]">
        <div className="grid grid-cols-4 text-center bg-neutral-100 text-black font-semibold">
          {['For you','Following','Art','Commissions'].map(tab => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`py-4 ${active===tab ? 'border-b-2 border-neutral-700' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="border-b border-neutral-300" />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="cg-card mx-4 mt-4">
          <Composer />
        </div>
        <div>
          {posts.map(p => (
            <Tweet key={p.id} post={p} />
          ))}
        </div>
      </div>
    </div>
  )
}


