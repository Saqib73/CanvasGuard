import { useState } from "react";
import axios from "axios";

const CreateCommunity = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [coverArt, setCoverArt] = useState(null);
  const [preview, setPreview] = useState("");

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    setCoverArt(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleCreate = async () => {
    if (!name || !description || !coverArt) {
      alert("Please fill all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("rules", rules);
    formData.append("files", coverArt);

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER}/api/v1/community/create`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(data);
      alert("Community created!");
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Error creating community");
    }
  };

  return (
    <div className="max-w-xl h-full mx-auto p-6 bg-gray-900 text-white rounded-xl shadow-xl mt-10 overflow-scroll">
      <h1 className="text-2xl font-bold mb-4">Create Community</h1>

      <label className="block mb-2 font-semibold">Community Name *</label>
      <input
        className="w-full p-2 rounded bg-gray-800 border border-gray-700"
        placeholder="e.g. DigitalArtists"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label className="block mt-4 mb-2 font-semibold">Description *</label>
      <textarea
        className="w-full p-2 rounded bg-gray-800 border border-gray-700"
        rows={3}
        placeholder="Describe your community..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <label className="block mt-4 mb-2 font-semibold">Rules (optional)</label>
      <textarea
        className="w-full p-2 rounded bg-gray-800 border border-gray-700"
        rows={3}
        placeholder="Community rules..."
        value={rules}
        onChange={(e) => setRules(e.target.value)}
      />

      <label className="block mt-4 mb-2 font-semibold">Cover Art *</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleCoverChange}
        className="w-full p-2 bg-gray-800 border border-gray-700 rounded"
      />

      {preview && (
        <img
          src={preview}
          alt="Cover Preview"
          className="mt-4 w-full h-48 object-cover rounded-lg border border-gray-700"
        />
      )}

      <button
        onClick={handleCreate}
        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-semibold"
      >
        Create Community
      </button>
    </div>
  );
};

export default CreateCommunity;
