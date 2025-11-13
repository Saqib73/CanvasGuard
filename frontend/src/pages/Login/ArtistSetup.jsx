import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { userExists } from "../../redux/reducers/auth";
import { MdBrush } from "react-icons/md";

export default function ArtistSetupForm() {
  const [form, setForm] = useState({
    artStyles: "",
    baseFee: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Setting up your artist profile...");
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER}/api/v1/auth/artistProfile`,
        {
          ...form,
          artStyles: form.artStyles.split(",").map((s) => s.trim()),
        },
        { withCredentials: true }
      );

      toast.success(data.message, { id: toastId });
      dispatch(userExists(data.user));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Something went wrong", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-950 text-white">
      {/* Left section - Image / Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden bg-gradient-to-br from-green-600 via-emerald-700 to-emerald-900">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 p-10 text-center max-w-lg">
          <MdBrush className="mx-auto text-5xl text-white/80 mb-4" />
          <h1 className="text-4xl font-bold mb-3">Show the World Your Art</h1>
          <p className="text-neutral-200 text-lg leading-relaxed">
            Create your artist profile, define your style, and start accepting
            commissions effortlessly.
          </p>
        </div>
        <img
          src="https://images.unsplash.com/photo-1508341591423-4347099e1f58?auto=format&fit=crop&w=1400&q=80"
          alt="Artist workspace"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
      </div>

      {/* Right section - Form */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-8 sm:p-10 md:p-16">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Artist Setup
            </h2>
            <p className="text-neutral-400 text-sm mt-2">
              Tell us about your art style and base fee.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Art Styles
              </label>
              <input
                type="text"
                name="artStyles"
                placeholder="e.g. digital, watercolor, realism"
                onChange={handleChange}
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Base Fee (₹)
              </label>
              <input
                type="number"
                name="baseFee"
                placeholder="e.g. 500"
                onChange={handleChange}
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Description
              </label>
              <textarea
                name="bio"
                rows="4"
                placeholder="Describe your art style, themes, or inspiration..."
                onChange={handleChange}
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 transition-all font-medium py-2.5 rounded-lg shadow-md"
            >
              {loading ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
