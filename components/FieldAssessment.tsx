import React, { useState } from "react";
import { getAccessToken } from "../utils/auth";

type Props = {
  userId: string;
};

export const FieldAssessmentPage: React.FC<Props> = ({ userId }) => {
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
      setVideo(null);
    }
  };

  const handleVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setVideo(e.target.files[0]);
      setImages([]);
    }
  };

  const handleSubmit = async () => {
    if (!video && images.length === 0) {
      alert("Upload images or a video");
      return;
    }

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("note", note);

    if (video) {
      formData.append("video", video);
    } else {
      images.forEach((img) => formData.append("images", img));
    }

    setLoading(true);

    await fetch("/api/field-assessments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      },
      body: formData
    });

    setLoading(false);
    setImages([]);
    setVideo(null);
    setNote("");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold">Field Assessment</h2>
        <p className="text-slate-500">
          Upload photos or a video as proof of field activity.
        </p>

        <textarea
          placeholder="Describe what you did..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border rounded-lg p-3"
        />

        <div>
          <label className="block text-sm font-medium mb-1">
            Upload Images
          </label>
          <input type="file" accept="image/*" multiple onChange={handleImages} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Or Upload Video
          </label>
          <input type="file" accept="video/*" onChange={handleVideo} />
        </div>

        {images.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {images.map((img, i) => (
              <img
                key={i}
                src={URL.createObjectURL(img)}
                className="w-24 h-24 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        {video && (
          <video
            src={URL.createObjectURL(video)}
            controls
            className="w-full max-h-64 rounded-lg"
          />
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg"
        >
          {loading ? "Submitting..." : "Submit Assessment"}
        </button>
      </div>
    </div>
  );
};