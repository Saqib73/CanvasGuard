import { useState } from 'react'
import { useStore } from '../store.jsx'

export default function Composer() {
  const { createPost } = useStore()
  const [text, setText] = useState('')
  return (
    <div className="flex gap-3 p-4 border-b border-neutral-300 dark:border-neutral-800 transition-colors duration-200">
      <div className="h-10 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700 ring-1 ring-neutral-300 dark:ring-neutral-800" />
      <div className="flex-1">
        <textarea 
          value={text} 
          onChange={e => setText(e.target.value)} 
          placeholder="What is happening?!" 
          className="w-full bg-transparent outline-none resize-none min-h-16 text-lg placeholder:text-neutral-500 dark:placeholder:text-neutral-500 text-cg-text" 
        />
        <div className="flex justify-between items-center pt-2">
          <div className="text-neutral-500 dark:text-neutral-400 text-sm">Compose</div>
          <button 
            disabled={!text.trim()} 
            onClick={() => { createPost('me', text.trim()); setText('') }} 
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 rounded-full font-semibold shadow-lg shadow-sky-500/20 transition-colors duration-200"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  )
}


