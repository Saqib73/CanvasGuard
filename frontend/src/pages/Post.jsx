import { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Post() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [watermarked, setWatermarked] = useState(true);
  const [isUploaded, setIsUploaded] = useState(false);
  const [publicid, setPublicid] = useState();
  const [url, seturl] = useState();
  const [isUploading, setIsUploading] = useState(false);
  const [noAI, setNoAI] = useState(true);
  const [licenseCredit, setLicenseCredit] = useState(true);
  const [noCommercial, setNoCommercial] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  function onFileChange(e) {
    const f = e.target.files?.[0];
    setFile(f || null);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview("");
    }
  }

  const uploadFile = async () => {
    const toastId = toast.loading("Uploading File...");
    setIsUploading(true);
    try {
      const formData = new FormData();
      if (file) formData.append("files", file);
      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER}/api/v1/posts/upload`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/from-data",
          },
        }
      );
      toast.success(data.message, {
        id: toastId,
      });
      console.log(data);
      setPublicid(data.public_id);
      seturl(data.url);
      console.log(publicid);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Something Went Wrong", {
        id: toastId,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const applyWatermark = async () => {
    setIsUploading(true);
    const toastId = toast.loading("Applying watermark...");
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER}/api/v1/posts/watermark`,
        {
          public_id: publicid,
          url,
          type: "image",
        },
        {
          withCredentials: true,
        }
      );
      toast.success(data.message, {
        id: toastId,
      });
      console.log("data after watermark-->", data);
      setFile(data.url);
      setPublicid(data.public_id);
      seturl(data.url);
      setPreview(data.url);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Something Went Wrong", {
        id: toastId,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePost = async () => {
    setIsCreating(true);

    const toastId = toast.loading("Creating Post...");
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER}/api/v1/posts/createPost`,
        {
          public_id: publicid,
          description: text,
        },
        {
          withCredentials: true,
        }
      );
      toast.success(data.message, {
        id: toastId,
      });
      console.log(data);
      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Something Went Wrong", {
        id: toastId,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <div className="sticky top-0 backdrop-blur bg-black/60 border-b border-neutral-800 p-3 font-semibold">
        Post
      </div>
      <div className="p-4 space-y-4 min-h-[50vh]">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Say something about your art..."
          className="w-full bg-neutral-900/70 border border-neutral-800 rounded-lg p-3 outline-none min-h-24"
        />

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            onChange={onFileChange}
            type="file"
            accept="image/*"
            className="text-sm"
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={noAI}
              onChange={(e) => setNoAI(e.target.checked)}
            />{" "}
            No AI training
          </label>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={licenseCredit}
              onChange={(e) => setLicenseCredit(e.target.checked)}
            />{" "}
            Reposts allowed with credit
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={noCommercial}
              onChange={(e) => setNoCommercial(e.target.checked)}
            />{" "}
            No commercial use
          </label>
        </div>

        {preview && (
          <div className="relative">
            <img
              src={preview}
              alt="preview"
              className="max-h-80 rounded-lg shadow-xl shadow-black/40"
            />
            {/* {watermarked && (
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="text-white/30 text-4xl font-black select-none rotate-[-20deg]">
                  CANVASGUARD
                </div>
              </div>
            )} */}
          </div>
        )}

        {preview && (
          <div>
            <button
              onClick={uploadFile}
              disabled={isUploading}
              className="px-3 py-1 rounded-full border border-neutral-700 text-sm"
            >
              Upload File
            </button>
            <button
              onClick={applyWatermark}
              disabled={isUploading}
              className="px-3 py-1 rounded-full border border-neutral-700 text-sm"
            >
              Apply Watermark
            </button>
          </div>
        )}

        <div className="flex gap-2 text-xs">
          {noAI && (
            <span className="px-2 py-1 rounded-full bg-neutral-800 border border-neutral-700">
              No AI
            </span>
          )}
          {watermarked && (
            <span className="px-2 py-1 rounded-full bg-neutral-800 border border-neutral-700">
              Watermarked
            </span>
          )}
          {licenseCredit && (
            <span className="px-2 py-1 rounded-full bg-neutral-800 border border-neutral-700">
              Credit required
            </span>
          )}
          {noCommercial && (
            <span className="px-2 py-1 rounded-full bg-neutral-800 border border-neutral-700">
              No commercial
            </span>
          )}
        </div>

        <div className="flex justify-end">
          <button
            disabled={isCreating}
            onClick={handlePost}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 rounded-full font-semibold"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
