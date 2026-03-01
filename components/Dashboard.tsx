import React from "react";
import {
  Course,
  CourseStatus,
  User,
  UserStats,
  LearningPath,
  Badge,
} from "../types";
import { CourseCard } from "./CourseCard";
import {
  Clock,
  BookOpen,
  Award,
  Flame,
  TrendingUp,
  TrendingDown,
  Map,
  CheckCircle2,
  Lock,
  PlayCircle,
  MoreHorizontal,
  Coins,
  Shield,
  Zap,
  Star,
  Medal,
  Trophy,
} from "lucide-react";

interface DashboardProps {
  courses: Course[];
  learningPath?: LearningPath | null;
  stats: UserStats;
  onStartCourse: (id: string) => void;
  onDownload: (id: string) => void;
  onRemoveDownload: (id: string) => void;
  isOfflineMode: boolean;
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({
  courses,
  learningPath,
  stats,
  onStartCourse,
  onDownload,
  onRemoveDownload,
  isOfflineMode,
  user,
}) => {
  const inProgress = courses.filter(
    (c) => c.status === CourseStatus.InProgress,
  );

  // --- Widget Components ---

  const InsightCard = ({
    label,
    value,
    subtext,
    icon: Icon,
    color,
    trend,
    trendDirection = "up",
  }: any) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div
          className={`p-2 rounded-xl bg-opacity-10 ${color.bg} ${color.text}`}
        >
          <Icon size={20} />
        </div>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${
              trendDirection === "up"
                ? "text-[#008080] bg-[#008080]/10"
                : "text-red-600 bg-red-50"
            }`}
          >
            {trendDirection === "up" ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            {trend}
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800 mt-2 truncate">
          {value}
        </div>
        <div className="text-xs text-slate-500 font-medium mt-1 truncate">
          {label}
        </div>
      </div>
    </div>
  );

  const currentCourse =
    courses.find((c) => c.status === CourseStatus.InProgress) ||
    courses.find((c) => c.status === CourseStatus.NotStarted);

  const WeeklyActivityChart = ({ data }: { data: number[] }) => {
    const days = ["M", "T", "W", "T", "F", "S", "S"];
    const maxVal = Math.max(...data, 1);

    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl text-[#008080]/70 flex items-center gap-2">
            <Clock size={20} className="text-[#008080]" />
            Learning Activity
          </h3>
          <span className="text-xs text-slate-400">Last 7 Days</span>
        </div>
        <div className="flex items-end justify-between flex-1 gap-2">
          {data.map((val, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 flex-1 group cursor-pointer"
            >
              <div className="w-full relative h-32 bg-slate-50 rounded-lg overflow-hidden flex items-end">
                <div
                  className="w-full bg-[#008080]/70 hover:bg-[#008080]transition-all duration-500 rounded-t-lg"
                  style={{
                    height: `${(val / maxVal) * 100}%`,
                    opacity: val === 0 ? 0 : 1,
                  }}
                ></div>
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {val}m
                </div>
              </div>
              <span className="text-xs font-medium text-slate-400 group-hover:text-[#008080]">
                {days[i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const LearningPathWidget = ({ path }: { path: LearningPath }) => {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
          <div className="flex justify-between items-start mb-2">
            <div className="flex text-xl items-center gap-2 text-[#008080] font-semibold text-sm uppercase tracking-wide">
              <Map size={20} /> Learning Path
            </div>
            <div className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-md">
              {path.progress}%
            </div>
          </div>
          <h3 className="text-lg font-bold text-slate-900">{path.title}</h3>
          <p className="text-sm text-slate-500 mt-1 line-clamp-1">
            {path.description}
          </p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="relative space-y-0">
            {/* Vertical Line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-100 z-0"></div>

            {path.steps?.map((step, idx) => {
              const isCurrent = step.status === "in-progress";
              const isCompleted = step.status === "completed";
              const isLocked = step.status === "locked";

              return (
                <div
                  key={step.id}
                  className={`relative z-10 flex gap-4 pb-8 last:pb-0 group ${isLocked ? "opacity-50" : ""}`}
                >
                  <div className="shrink-0 mt-1">
                    {isCompleted ? (
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center border-4 border-white shadow-sm">
                        <CheckCircle2 size={20} />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-10 h-10 rounded-full bg-[#008080] text-white flex items-center justify-center border-4 border-[#008080]/2 shadow-md ring-2 ring-[#008080]/50 ring-offset-2">
                        <PlayCircle
                          size={20}
                          fill="currentColor"
                          className="text-white"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border-4 border-white">
                        <Lock size={18} />
                      </div>
                    )}
                  </div>

                  <div
                    className={`flex-1 rounded-xl p-4 border transition-all ${isCurrent ? "bg-[#008080]/10 border-[#008080]/2 shadow-sm" : "bg-white border-[#008080]/2"}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-medium text-slate-400 mb-1">
                          STEP {idx + 1} • {step.type.toUpperCase()}
                        </div>
                        <h4
                          className={`font-bold ${isCurrent ? "text-[#008080]" : "text-slate-800"}`}
                        >
                          {step.title}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1">
                          {step.description}
                        </p>
                      </div>
                      {step.estimatedTime && (
                        <span className="text-xs text-slate-400 bg-white px-2 py-1 rounded border border-[#008080]/2 whitespace-nowrap">
                          {step.estimatedTime}
                        </span>
                      )}
                    </div>

                    {isCurrent && step.courseId && (
                      <button
                        onClick={() => onStartCourse(step.courseId!)}
                        className="mt-4 w-full bg-[#008080] hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        Continue Journey <MoreHorizontal size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case "shield":
        return Shield;
      case "zap":
        return Zap;
      case "star":
        return Star;
      case "medal":
        return Medal;
      case "trophy":
        return Trophy;
      default:
        return Award;
    }
  };

  const BadgesWidget = ({ badges }: { badges: Badge[] }) => {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-full mt-lg-2">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Award size={18} className="text-yellow-500" />
            Achievements
          </h3>
          <span className="text-xs font-medium text-blue-600 hover:underline cursor-pointer">
            View All
          </span>
        </div>

        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {badges.map((badge) => {
            const Icon = getBadgeIcon(badge.icon);
            return (
              <div
                key={badge.id}
                className={`flex-shrink-0 w-32 p-4 rounded-xl border flex flex-col items-center text-center gap-3 transition-colors ${badge.isLocked ? "bg-slate-50 border-slate-100 opacity-60" : "bg-yellow-50/30 border-yellow-100"}`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${badge.isLocked ? "bg-slate-200 text-slate-400" : "bg-yellow-100 text-yellow-600 shadow-sm"}`}
                >
                  {badge.isLocked ? <Lock size={20} /> : <Icon size={24} />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 leading-tight mb-1">
                    {badge.name}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight line-clamp-2">
                    {badge.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* 1. Header & Stats Overview */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">
              Hi{" "}
              <span className="font-semibold text-green-500">{user.name}</span>,
              welcome back. Let's get some BICMAS coins!
            </p>
          </div>
          <div className="hidden md:block text-right">
            <div className="text-sm text-slate-500">Current Focus</div>
            <div className="font-semibold text-[#008080]">
              {learningPath?.title || "Van Sales Rep Certification"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         
          <InsightCard
            label="BICMAS Coins"
            value={stats.bicmasCoins}
            icon={Coins}
            color={{ bg: "bg-yellow-500", text: "text-yellow-600" }}
            trend="Rewards"
            trendDirection="up"
          />
          <InsightCard
            label="Learning Hours"
            value={stats.totalLearningHours}
            icon={Clock}
            color={{ bg: "bg-blue-500", text: "text-blue-500" }}
            trend="+2.5h"
            trendDirection="up"
          />
          <InsightCard
            label="Courses Done"
            value={stats.completedCourses}
            icon={Award}
            color={{ bg: "bg-purple-500", text: "text-purple-500" }}
            trend={`${stats.completedCoursesTrend > 0 ? "+" : ""}${stats.completedCoursesTrend}`}
            trendDirection={stats.completedCoursesTrend >= 0 ? "up" : "down"}
          />
          <InsightCard
            label="Avg. Score"
            value={`${stats.averageScore}%`}
            icon={TrendingUp}
            color={{ bg: "bg-emerald-500", text: "text-emerald-500" }}
            trend={`${stats.scoreTrend > 0 ? "+" : ""}${stats.scoreTrend}%`}
            trendDirection={stats.scoreTrend >= 0 ? "up" : "down"}
          />
        </div>
      </section>

      {/* 2. Main Dashboard Split: Learning Path & Activity */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 mni-h-screen">
        {/* Left: Learning Path (Takes 2 columns on large screens) */}
        <div className="lg:col-span-2 h-full">
          {learningPath ? (
            <LearningPathWidget path={learningPath} />
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
              No learning path assigned yet.
            </div>
          )}
        </div>

        {/* Right: Activity Chart & Quick Actions (Takes 1 column) */}
        <div className="space-y-6 flex flex-col h-full">
          <div className="flex-1">
            <WeeklyActivityChart data={stats.weeklyActivity} />
          </div>

          {/* Mini 'Next Up' Card */}
          <div className="bg-gradient-to-br from-[#008080]/50 to-[#008080] rounded-2xl p-6 text-white shadow-lg flex-1 flex flex-col justify-center">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <BookOpen size={20} />
              </div>
              <span className="text-indigo-100 text-xs font-medium uppercase tracking-wider">
                Recommended
              </span>
            </div>
            
            <h4 className="font-bold text-lg mb-2">
              {currentCourse?.title || "You're all caught up"}
            </h4>
            <p className="text-indigo-100 text-sm mb-4 line-clamp-2">
              {currentCourse
                ? `Continue learning (${currentCourse.progress}%)`
                : "No pending courses"}
            </p>
            {currentCourse && (
              <button
                onClick={() => onStartCourse(currentCourse.id)}
                className="bg-white text-[#008080] py-2 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors w-full"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. Badges & Jump Back In */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Badges Widget */}
        <div className="lg:col-span-1">
          <BadgesWidget badges={stats.badges} />
        </div>

        {/* Jump Back In */}
        <div className="lg:col-span-2">
          {inProgress.length > 0 ? (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">
                  Jump Back In
                </h3>
                <button className="text-blue-600 text-sm font-medium hover:underline">
                  View Library
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inProgress.slice(0, 2).map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    progress={course.progress}
                    status={course.status}
                    onStart={onStartCourse}
                    onDownload={onDownload}
                    onRemoveDownload={onRemoveDownload}
                    isOfflineMode={isOfflineMode}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center h-full flex flex-col justify-center items-center text-slate-500">
              <CheckCircle2 size={48} className="mb-4 text-slate-300" />
              <p>You're all caught up! Check the library for new courses.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
