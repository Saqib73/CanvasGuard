import { useMemo, useState } from 'react'
import { useStore } from '../store.jsx'

export default function Communities() {
  const { users, communities, createCommunityPost } = useStore()
  const [activeCommunityId, setActiveCommunityId] = useState(communities[0]?.id || 'c_art')
  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [fileDataUrl, setFileDataUrl] = useState('')

  const activeCommunity = useMemo(() => communities.find(c => c.id === activeCommunityId) || communities[0], [communities, activeCommunityId])

  function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return setFileDataUrl('')
    const reader = new FileReader()
    reader.onload = () => setFileDataUrl(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  function submitPost() {
    const media = fileDataUrl || imageUrl.trim()
    if (!media) return
    createCommunityPost(activeCommunity.id, 'me', text.trim() || 'Shared an artwork', media)
    setText('')
    setImageUrl('')
    setFileDataUrl('')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 backdrop-blur bg-black/60 border-b border-neutral-800 p-3 font-semibold">Communities</div>
      <div className="flex-1 overflow-y-auto no-scrollbar p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 space-y-2">
            {communities.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCommunityId(c.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border ${activeCommunityId === c.id ? 'border-sky-500 bg-sky-500/10' : 'border-neutral-800 hover:bg-neutral-800/50'}`}
              >
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-neutral-400">{c.description}</div>
              </button>
            ))}
          </div>
          <div className="col-span-2 space-y-4">
            <div className="cg-card p-4">
              <div className="font-semibold mb-2">Post to {activeCommunity?.name}</div>
              <textarea value={text} onChange={e => setText(e.target.value)} className="w-full bg-transparent outline-none resize-none min-h-20" placeholder="Say something about your art..." />
              <div className="grid grid-cols-2 gap-3 mt-2">
                <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Paste image URL" className="cg-input" />
                <input type="file" accept="image/*" onChange={onFileChange} className="cg-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neutral-700 file:text-white" />
              </div>
              <div className="flex justify-end mt-3">
                <button disabled={!imageUrl.trim() && !fileDataUrl} onClick={submitPost} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 rounded-full font-semibold">Post</button>
              </div>
            </div>

            <div className="space-y-3">
              {activeCommunity?.posts.map(p => (
                <div key={p.id} className="cg-card overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <img alt="avatar" src={users[p.authorId]?.avatar} className="h-9 w-9 rounded-full ring-1 ring-neutral-800" />
                    <div>
                      <div className="text-sm font-semibold">{users[p.authorId]?.name || 'User'}</div>
                      <div className="text-xs text-neutral-400">@{users[p.authorId]?.handle}</div>
                    </div>
                  </div>
                  {p.mediaUrl && (
                    <div className="border-t border-neutral-800">
                      <img src={p.mediaUrl} alt="art" className="w-full max-h-[480px] object-cover" />
                    </div>
                  )}
                  {p.text && <div className="p-4 text-[15px] leading-5">{p.text}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


