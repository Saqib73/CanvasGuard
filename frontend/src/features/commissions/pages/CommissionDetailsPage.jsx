import { MdPhoto } from "react-icons/md";
import { FaChevronDown } from "react-icons/fa6";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { useCreateCommissionRequest } from "../api/commissions.hooks";
import { Button } from "../../../components/ui/Button";

export default function CommissionDetailsPage() {
  const { id } = useParams();
  const today = new Date().toISOString().split("T")[0];
  const [deadline, setDeadline] = useState(today);
  const [description, setDescription] = useState("");
  const [country, setCountry] = useState("United States");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [state, setState] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { mutateAsync: requestCommission, isPending } = useCreateCommissionRequest();

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Please describe what commission you are looking for");
      return;
    }

    try {
      const formData = new FormData();
      if (id) formData.append("artistId", id);
      formData.append("deadline", deadline);
      formData.append("description", description);
      if (file) formData.append("files", file);

      const shippingDetails = {
        country,
        state,
        postal: postal.trim(),
        city,
      };
      formData.append("shippingDetails", JSON.stringify(shippingDetails));

      await requestCommission(formData);
      toast.success("Commission request sent successfully!");
      navigate("/commissions");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to send commission request");
    }
  };

  return (
    <form
      className="overflow-y-auto no-scrollbar w-full h-full p-6 text-base-content"
      onSubmit={handleSubmit}
    >
      <div className="space-y-8 max-w-3xl mx-auto">
        <div className="border-b border-base-300 pb-8">
          <h2 className="text-xl font-bold">Request a Commission</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Provide the details, references, and your preferred deadline for the artist.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="deadline" className="block text-sm font-medium">
                Deadline
              </label>
              <div className="mt-2">
                <input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={deadline}
                  min={today}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-xl bg-base-200 border border-base-300 py-2 px-3 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="col-span-full">
              <label htmlFor="about" className="block text-sm font-medium">
                Commission Description
              </label>
              <div className="mt-2">
                <textarea
                  id="about"
                  name="about"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your character, style, composition, dimensions, or usage requirements..."
                  className="w-full rounded-xl bg-base-200 border border-base-300 p-3 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="col-span-full">
              <label className="block text-sm font-medium">
                Reference Image (Optional)
              </label>
              <div className="mt-2 flex justify-center rounded-2xl border-2 border-dashed border-base-300 px-6 py-8 bg-base-200/50">
                <div className="text-center">
                  <MdPhoto className="mx-auto text-4xl text-neutral-400" />
                  <div className="mt-3 flex text-sm text-neutral-400 justify-center">
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer font-semibold text-primary hover:underline"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        onChange={onFileChange}
                        ref={fileInputRef}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {preview && (
          <div className="relative">
            <img
              src={preview}
              alt="preview"
              className="max-h-60 rounded-xl shadow-lg border border-base-300"
            />
          </div>
        )}

        <div className="border-b border-base-300 pb-8">
          <h2 className="text-lg font-semibold">
            Shipping Information
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            For physical art pieces or prints if applicable.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="country" className="block text-sm font-medium">
                Country
              </label>
              <div className="mt-2 relative">
                <select
                  id="country"
                  name="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full appearance-none rounded-xl bg-base-200 border border-base-300 py-2 pr-8 pl-3 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="India">India</option>
                  <option value="Australia">Australia</option>
                </select>
                <FaChevronDown className="pointer-events-none absolute right-3 top-3 text-xs text-neutral-400" />
              </div>
            </div>

            <div className="sm:col-span-2 sm:col-start-1">
              <label htmlFor="city" className="block text-sm font-medium">
                City (Optional)
              </label>
              <div className="mt-2">
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl bg-base-200 border border-base-300 py-2 px-3 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="region" className="block text-sm font-medium">
                State / Province
              </label>
              <div className="mt-2">
                <input
                  id="region"
                  name="region"
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-xl bg-base-200 border border-base-300 py-2 px-3 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="postal-code" className="block text-sm font-medium">
                ZIP / Postal code
              </label>
              <div className="mt-2">
                <input
                  id="postal-code"
                  name="postal-code"
                  type="text"
                  value={postal}
                  onChange={(e) => setPostal(e.target.value)}
                  className="w-full rounded-xl bg-base-200 border border-base-300 py-2 px-3 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-x-4">
          <Link to="/commissions">
            <Button variant="ghost" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            loading={isPending}
            disabled={isPending}
          >
            Submit Request
          </Button>
        </div>
      </div>
    </form>
  );
}

export const CommissionDetails = CommissionDetailsPage;
