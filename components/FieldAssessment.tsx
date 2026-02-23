import React, { useState, useMemo, useEffect } from "react";
import { getAccessToken } from "../utils/auth";
import { X } from "lucide-react";

type Props = {
  userId: string;
};

const MAX_IMAGES = 4;

export const FieldAssessmentPage: React.FC<Props> = ({ userId }) => {
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [moduleTopic, setModuleTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create stable object URLs from images, with cleanup
  const imageUrls = useMemo(() => {
    return images.map(img => URL.createObjectURL(img));
  }, [images]);

  // Revoke object URLs when component unmounts or images change
  useEffect(() => {
    return () => {
      imageUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imageUrls]);

  // ----------------------------
  // Image handling (max 4, additive)
  // ----------------------------
  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selected = Array.from(e.target.files);

    // Cannot mix with video
    setVideo(null);

    setImages((prev) => {
      const combined = [...prev, ...selected];
      return combined.slice(0, MAX_IMAGES);
    });

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ----------------------------
  // Video handling
  // ----------------------------
  const handleVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    setVideo(e.target.files[0]);
    setImages([]); // cannot mix
    e.target.value = "";
  };

  const removeVideo = () => {
    setVideo(null);
  };

  // ----------------------------
  // Submit
  // ----------------------------
  const handleSubmit = async () => {
    if (!video && images.length === 0) {
      alert("Upload up to 4 images or one video.");
      return;
    }

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("moduleTopic", moduleTopic);
    formData.append("note", note);

    if (video) {
      formData.append("video", video);
    } else {
      images.forEach((img) => formData.append("images", img));
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/field-assessments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: formData,
      });

      // Check response status
      if (!response.ok) {
        let errorMessage = "Failed to submit assessment";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, try to get text
          try {
            const errorText = await response.text();
            errorMessage = `Server error (${response.status}): ${errorText}`;
          } catch {
            errorMessage = `Server error (${response.status})`;
          }
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
      setImages([]);
      setVideo(null);
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
            Upload Images ({images.length}/{MAX_IMAGES})
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={video !== null || images.length >= MAX_IMAGES}
            onChange={handleImages}
          />
        </div>

        {/* Video upload */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Or Upload Video
          </label>
          <input
            type="file"
            accept="video/*"
            disabled={images.length > 0 || video !== null}
            onChange={handleVideo}
          />
        </div>

        {/* Image previews */}
        {images.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative">
                <img
                  src={imageUrls[i]}
                  className="w-24 h-24 object-cover rounded-lg border"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Video preview */}
        {video && (
          <div className="relative">
            <video
              src={URL.createObjectURL(video)}
              controls
              className="w-full max-h-64 rounded-lg border"
            />
            <button
              onClick={removeVideo}
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