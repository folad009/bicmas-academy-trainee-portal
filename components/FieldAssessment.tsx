import React, { useState, useMemo, useEffect } from "react";
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
  const [note, setNote] = useState("");
  const [moduleTopic, setModuleTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create stable object URLs from images, with cleanup
  const mediaUrls = useMemo(() => {
    return mediaFiles.map((file) => URL.createObjectURL(file));
  }, [mediaFiles]);

  // Revoke object URLs when component unmounts or images change
  useEffect(() => {
    return () => {
      mediaUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [mediaUrls]);

  // ----------------------------
  // Media handling (max 4, or 1 video)
  // ----------------------------
  const handleMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files: File[] = Array.from(e.target.files);

    if (files.length === 0) return;

    // Filter files by MIME type
    const videos = files.filter((f) => f.type.startsWith("video/"));
    const images = files.filter((f) => f.type.startsWith("image/"));

    // Determine type and set media
    if (videos.length > 0) {
      // Only one video allowed
      setMediaType("video");
      setMediaFiles([videos[0]]);
    } else if (images.length > 0) {
      setMediaType("image");
      setMediaFiles((prev) => {
        const combined = [...prev, ...images];
        return combined.slice(0, MAX_IMAGES);
      });
    }
    // Non-image/non-video files are ignored

    e.target.value = "";
  };

  const removeMedia = (index?: number) => {
    if (mediaType === "video") {
      setMediaFiles([]);
      setMediaType(null);
      return;
    }

    if (mediaType === "image" && index !== undefined) {
      setMediaFiles((prev) => {
        const updated = prev.filter((_, i) => i !== index);
        if (updated.length === 0) setMediaType(null);
        return updated;
      });
    }
  };

  // ----------------------------
  // Submit
  // ----------------------------
  const handleSubmit = async () => {
    if (mediaFiles.length === 0) {
      alert("Upload up to 4 images or one video.");
      return;
    }

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("moduleTopic", moduleTopic);
    formData.append("note", note);

    if (mediaType === "video") {
      formData.append("video", mediaFiles[0]);
    } else {
      mediaFiles.forEach((file) => formData.append("images", file));
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/fieldTask", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: formData,
      });

      // Check response status
      if (!response.ok) {
        let errorMessage = "Failed to submit assessment";
        // Read response body once as text
        let body = "";
        try {
          body = await response.text();
        } catch {
          body = "";
        }

        // Try to parse as JSON to extract message
        if (body) {
          try {
            const errorData = JSON.parse(body);
            errorMessage =
              errorData.message || `Server error (${response.status}): ${body}`;
          } catch {
            // If not valid JSON, use raw body text
            errorMessage = `Server error (${response.status}): ${body}`;
          }
        } else {
          errorMessage = `Server error (${response.status})`;
        }

        setError(errorMessage);
        console.error("Assessment submission failed", {
          status: response.status,
          error: errorMessage,
        });
        alert(errorMessage);
        return;
      }

      // Reset after success
      setMediaFiles([]);
      setMediaType(null);
      setModuleTopic("");
      setNote("");
      setError(null);
      alert("Assessment submitted successfully!");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
      console.error("Assessment submission error", e);
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // UI
  // ----------------------------
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
          className="w-full border rounded-lg p-3 mb-2"
        />

        <textarea
          placeholder="Describe what you did..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border rounded-lg p-3"
        />

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Upload Media (Max 4 images or 1 video)
          </label>
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
        </div>

        {mediaType === "image" && mediaFiles.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {mediaUrls.map((url, i) => (
              <div key={i} className="relative">
                <img
                  src={url}
                  alt={`Assessment image ${i + 1}`}
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

        {mediaType === "video" && mediaFiles[0] && (
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
      </div>
    </div>
  );
};
