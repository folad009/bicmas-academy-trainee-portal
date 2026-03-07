import React, { useState, useEffect } from "react";
import { getAccessToken } from "../utils/auth";
import { X } from "lucide-react";

type Props = {
  userId: string;
};

type MediaType = "image" | "video" | null;

const MAX_IMAGES = 4;

export const FieldAssessmentPage: React.FC<Props> = ({ userId }) => {
  const [mediaType, setMediaType] = useState<MediaType>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [moduleTopic, setModuleTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------------------
     Create object URLs safely
  ----------------------------*/
  useEffect(() => {
    const urls = mediaFiles.map((file) => URL.createObjectURL(file));
    setMediaUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [mediaFiles]);

  /* ---------------------------
     Handle media selection
  ----------------------------*/
  const handleMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;

    if (!files) return;

    const video = files.find((f) => f.type.startsWith("video/"));
    const images = files.filter((f) => f.type.startsWith("image/"));

    if (video) {
      setMediaType("video");
      setMediaFiles([video]);
      e.target.value = "";
      return;
    }

    if (images.length > 0) {
      setMediaType("image");
      setMediaFiles((prev) => [...prev, ...images].slice(0, MAX_IMAGES));
    }

    e.target.value = "";
  };

  /* ---------------------------
     Remove media
  ----------------------------*/
  const removeMedia = (index?: number) => {
    if (mediaType === "video") {
      setMediaFiles([]);
      setMediaType(null);
      return;
    }

    if (index !== undefined) {
      const updated = mediaFiles.filter((_, i) => i !== index);
      setMediaFiles(updated);
      if (updated.length === 0) setMediaType(null);
    }
  };

  /* ---------------------------
     Submit assessment
  ----------------------------*/
  const handleSubmit = async () => {
    if (!mediaFiles.length) {
      alert("Upload up to 4 images or one video.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = getAccessToken();
      if (!token) throw new Error("Authentication required");

      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("moduleTopic", moduleTopic);
      formData.append("note", note);

      if (mediaType === "video") {
        formData.append("video", mediaFiles[0]);
      } else {
        mediaFiles.forEach((file) => formData.append("images", file));
      }

      const res = await fetch("https://bicmas-academy-main-backend-production.up.railway.app/api/v1/field-tasks", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const text = await res.text();

      if (!res.ok) {
        let message = `Server error (${res.status})`;

        try {
          const json = JSON.parse(text);
          message = json.message || message;
        } catch {
          if (text) message = text;
        }

        throw new Error(message);
      }

      alert("Assessment submitted successfully!");

      setMediaFiles([]);
      setMediaType(null);
      setModuleTopic("");
      setNote("");
      setError(null);

    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("Assessment submission failed:", message);
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------
     UI
  ----------------------------*/
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold">Field Task</h2>
        <p className="text-slate-500">
          Upload up to 4 photos or one video as proof of field activity.
        </p>

        <input
          type="text"
          placeholder="Module Topic"
          value={moduleTopic}
          onChange={(e) => setModuleTopic(e.target.value)}
          className="w-full border rounded-lg p-3"
        />

        <textarea
          placeholder="Describe what you did..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border rounded-lg p-3"
        />

        <input
          type="file"
          accept="image/*,video/*"
          multiple={mediaType !== "video"}
          disabled={
            mediaType === "video" ||
            (mediaType === "image" && mediaFiles.length >= MAX_IMAGES)
          }
          onChange={handleMedia}
        />

        {mediaType === "image" && (
          <div className="flex gap-3 flex-wrap">
            {mediaUrls.map((url, i) => (
              <div key={i} className="relative">
                <img
                  src={url}
                  className="w-24 h-24 object-cover rounded-lg border"
                />
                <button
                  onClick={() => removeMedia(i)}
                  className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {mediaType === "video" && mediaUrls[0] && (
          <div className="relative">
            <video
              src={mediaUrls[0]}
              controls
              className="w-full max-h-64 rounded-lg border"
            />
            <button
              onClick={() => removeMedia()}
              className="absolute top-2 right-2 bg-black text-white rounded-full p-1"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 bg-[#008080] text-white rounded-lg"
        >
          {loading ? "Submitting..." : "Submit Assessment"}
        </button>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
};