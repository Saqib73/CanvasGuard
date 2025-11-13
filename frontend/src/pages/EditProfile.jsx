import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { useUpdateProfileMutation } from "../redux/api/api.js";
import toast from "react-hot-toast";

export default function EditProfile() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: user.name || "",
    bio: user.bio || "",
  });

  const [preview, setPreview] = useState(user.profilePic?.url || "");
  const [file, setFile] = useState(null);

  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSave = async () => {
    const toastId = toast.loading("Updating...");
    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("bio", formData.bio);
      if (file) fd.append("file", file); // backend expects req.file

      // const { data } = await axios.put(
      //   `${import.meta.env.VITE_SERVER}/api/v1/user/me`,
      //   fd,
      //   {
      //     headers: {
      //       "Content-Type": "multipart/form-data",
      //     },
      //     withCredentials: true,
      //   }
      // );

      const res = await updateProfile(fd).unwrap();
      console.log("Profile updated:", res);
      toast.success("profile updated", {
        id: toastId,
      });
      navigate(`/artist/${res.user.userName}`);
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error("error", {
        id: toastId,
      });
    }
  };

  const handleCancel = () => {
    navigate("/artist/me");
  };

  if (isLoading) return <div>Loading...</div>;

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
            disabled={isLoading}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded-full text-sm font-semibold disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Picture */}
          <div className="relative flex flex-col items-center mt-4">
            <div className="relative">
              <img
                src={preview}
                alt="avatar"
                className="h-28 w-28 rounded-full object-cover ring-4 ring-black"
              />
              <label
                htmlFor="profilePic"
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white text-2xl hover:bg-black/70 transition-colors cursor-pointer"
              >
                📷
              </label>
              <input
                type="file"
                id="profilePic"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="pt-8 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Display Name
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full rounded-lg p-2 bg-gray-600/50"
                placeholder="Display name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full rounded-xl min-h-32 p-2 bg-gray-600/50"
                placeholder="Tell us about yourself"
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
              disabled={isLoading}
              className="px-6 py-2 bg-sky-500 hover:bg-sky-600 rounded-full text-sm font-semibold disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
