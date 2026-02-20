import React from "react";
import { Course, CourseStatus } from "../types";
import {
  Play,
  CheckCircle,
  Download,
  Trash2,
  Award,
  Clock,
} from "lucide-react";

interface CourseCardProps {
  course: Course;
  onStart: (courseId: string) => void;
  onDownload: (courseId: string) => void;
  onRemoveDownload: (courseId: string) => void;
  isOfflineMode: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onStart,
  onDownload,
  onRemoveDownload,
  isOfflineMode,
}) => {
  const progress = Math.round(Math.min(100, Math.max(0, course.progress ?? 0)));
  const isCompleted = progress === 100;
  const isDisabled = isOfflineMode && !course.isDownloaded;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onDownload(course.id);
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all hover:shadow-md ${isDisabled ? "opacity-50 grayscale" : ""}`}
    >
      <div className="relative h-40 overflow-hidden group">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {!isDisabled && (
            <button
              onClick={() => onStart(course.id)}
              className="bg-white text-slate-900 rounded-full p-3 hover:scale-110 transition-transform"
            >
              <Play size={24} fill="currentColor" />
            </button>
          )}
        </div>

        {course.category === "Mandatory" && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
            MANDATORY
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-slate-900 line-clamp-2 leading-tight">
            {course.title}
          </h3>
          {isCompleted && (
            <CheckCircle size={18} className="text-green-500 shrink-0 ml-2" />
          )}
        </div>

        <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">
          {course.description}
        </p>

        <div className="mt-auto space-y-3">
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isCompleted ? "bg-green-500" : "bg-blue-600"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>{progress}% Complete</span>
            {course.deadline && (
              <span>
                Due: {new Date(course.deadline!).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <button
              onClick={() => onStart(course.id)}
              disabled={isDisabled}
              className={`text-sm font-medium ${isDisabled ? "cursor-not-allowed" : "text-blue-600 hover:text-blue-700"}`}
            >
              {progress === 100
                ? "Completed"
                : progress > 0
                  ? "Resume"
                  : "Start Course"}
            </button>

            <div className="flex items-center gap-2">
              {isCompleted && (
                <div className="text-yellow-600 flex items-center gap-1 text-xs font-medium bg-yellow-50 px-2 py-1 rounded-full">
                  <Award size={12} /> Certified
                </div>
              )}

              {course.isDownloaded ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveDownload(course.id);
                  }}
                  className="text-green-600 hover:text-red-500 transition-colors p-1"
                  title="Remove Download"
                >
                  <Trash2 size={16} />
                </button>
              ) : (
                <button
                  onClick={handleDownload}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                  title="Download for Offline"
                  disabled={isOfflineMode} // Cannot download while offline
                >
                  {isOfflineMode ? <Clock size={16} /> : <Download size={16} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
