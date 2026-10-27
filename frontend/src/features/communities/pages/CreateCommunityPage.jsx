import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useCreateCommunity } from "../api/communities.hooks";
import { Button } from "../../../components/ui/Button";

export const CreateCommunityPage = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [coverArt, setCoverArt] = useState(null);
  const [preview, setPreview] = useState("");

  const navigate = useNavigate();
  const { mutateAsync: createCommunity, isPending } = useCreateCommunity();

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    setCoverArt(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleCreate = async () => {
    if (!name || !description || !coverArt) {
      toast.error("Please fill all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("rules", rules);
    formData.append("files", coverArt);

    try {
      await createCommunity(formData);
      toast.success("Community created!");
      navigate("/communities");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error creating community");
    }
  };

  return (
    <div className="max-w-xl h-full mx-auto p-6 bg-base-200 text-base-content rounded-2xl shadow-xl mt-4 overflow-y-auto no-scrollbar border border-base-300">
      <h1 className="text-2xl font-bold mb-4">Create Community</h1>

      <label className="block mb-2 font-semibold text-sm">Community Name *</label>
      <input
        className="w-full p-2.5 rounded-xl bg-base-100 border border-base-300 focus:outline-none focus:border-primary text-base-content"
        placeholder="e.g. DigitalArtists"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label className="block mt-4 mb-2 font-semibold text-sm">Description *</label>
      <textarea
        className="w-full p-2.5 rounded-xl bg-base-100 border border-base-300 focus:outline-none focus:border-primary text-base-content"
        rows={3}
        placeholder="Describe your community..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <label className="block mt-4 mb-2 font-semibold text-sm">Rules (optional)</label>
      <textarea
        className="w-full p-2.5 rounded-xl bg-base-100 border border-base-300 focus:outline-none focus:border-primary text-base-content"
        rows={3}
        placeholder="Community rules..."
        value={rules}
        onChange={(e) => setRules(e.target.value)}
      />

      <label className="block mt-4 mb-2 font-semibold text-sm">Cover Art *</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleCoverChange}
        className="w-full p-2 bg-base-100 border border-base-300 rounded-xl"
      />

      {preview && (
        <img
          src={preview}
          alt="Cover Preview"
          className="mt-4 w-full h-48 object-cover rounded-xl border border-base-300"
        />
      )}

      <Button
        onClick={handleCreate}
        loading={isPending}
        disabled={isPending}
        className="mt-6 w-full"
      >
        Create Community
      </Button>
    </div>
  );
};

export default CreateCommunityPage;
