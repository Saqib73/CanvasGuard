import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store.jsx'

export default function EditProfile() {
  const navigate = useNavigate()
  const { users } = useStore()
  const user = users['me']
  
  const [formData, setFormData] = useState({
    name: user.name,
    handle: user.handle,
    bio: 'Download Free Exclusive PSD Files, PSD graphics, PSD Templates, PSD backgrounds and many PhotoShop resources.',
    website: 'https://psd.zone',
    location: 'Freiburg, Germany'
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = () => {
    // Here you would typically save the data to your store or API
    console.log('Saving profile:', formData)
    navigate('/artist/me')
  }

  const handleCancel = () => {
    navigate('/artist/me')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-[rgb(var(--cg-bg))] border-b border-neutral-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <button 
            onClick={handleCancel}
            className="p-2 hover:bg-neutral-800 rounded-full"
          >
            <span className="text-xl">←</span>
          </button>
          <h1 className="text-xl font-bold">Edit Profile</h1>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded-full text-sm font-semibold"
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Cover Photo Section */}
          <div className="relative">
            <div className="w-full h-40 bg-sky-700 rounded-t-2xl" />
            <div className="absolute -bottom-6 left-4">
              <div className="relative">
                <img 
                  src={user.avatar} 
                  alt="avatar" 
                  className="h-24 w-24 rounded-full ring-4 ring-black" 
                />
                <button className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white text-2xl hover:bg-black/70 transition-colors">
                  📷
                </button>
              </div>
            </div>
            <button className="absolute top-4 right-4 px-4 py-2 bg-black/50 hover:bg-black/70 text-white rounded-full text-sm font-semibold">
              Edit cover photo
            </button>
          </div>

          {/* Form Fields */}
          <div className="pt-8 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Display Name</label>
              <input 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full cg-input" 
                placeholder="Display name" 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Handle</label>
              <input 
                name="handle"
                value={formData.handle}
                onChange={handleInputChange}
                className="w-full cg-input" 
                placeholder="Handle" 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Bio</label>
              <textarea 
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full cg-input min-h-32" 
                placeholder="Tell us about yourself" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Website</label>
                <input 
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full cg-input" 
                  placeholder="Website" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Location</label>
                <input 
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full cg-input" 
                  placeholder="Location" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Joined</label>
              <input 
                className="w-full cg-input" 
                placeholder="August 2022" 
                readOnly 
                disabled
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-neutral-800">
            <button 
              onClick={handleCancel}
              className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-full border border-neutral-700 text-sm font-semibold"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-sky-500 hover:bg-sky-600 rounded-full text-sm font-semibold"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
