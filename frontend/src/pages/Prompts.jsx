import { useState } from 'react'
import { useStore } from '../store.jsx'

const starterPrompts = [
  { id: 'pr1', title: 'Monthly theme: Night City', description: 'Cyberpunk vibes. Share your illustration.', tag: '#NightCity' },
  { id: 'pr2', title: 'Draw this in your style', description: 'Pick a reference and reinterpret it.', tag: '#DTIYS' },
]

export default function Prompts() {
  const { createPost } = useStore()
  const [promptId, setPromptId] = useState('pr1')
  const active = starterPrompts.find(p => p.id === promptId)

  function submitEntry() {
    createPost('me', `${active.title} ${active.tag}\nMy entry!`, { license: ['no_ai'], watermarked: true })
  }

  return (
    <div>
      <div className="sticky top-0 backdrop-blur bg-black/60 border-b border-neutral-800 p-3 font-semibold">Prompts</div>
      <div className="p-4 space-y-3">
        <select value={promptId} onChange={e => setPromptId(e.target.value)} className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2">
          {starterPrompts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <div className="text-neutral-300 text-sm">{active.description}</div>
        <button onClick={submitEntry} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded-full font-semibold">Join challenge</button>
      </div>
    </div>
  )
}


