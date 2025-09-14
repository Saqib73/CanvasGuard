import { useStore } from '../store.jsx'

export default function ThemeDemo() {
  const { theme } = useStore()
  
  return (
    <div className="cg-card p-4 m-4">
      <h3 className="text-lg font-semibold mb-2 text-cg-text">Theme Demo</h3>
      <p className="text-cg-text mb-2">Current theme: <span className="font-mono bg-cg-card px-2 py-1 rounded">{theme}</span></p>
      <div className="space-y-2 text-sm">
        <div className="text-cg-text">This text uses the theme-aware color</div>
        <div className="text-neutral-500 dark:text-neutral-400">This text adapts to theme</div>
        <div className="bg-cg-card p-2 rounded border border-neutral-300 dark:border-neutral-800">
          This card uses theme-aware background and borders
        </div>
      </div>
    </div>
  )
}
