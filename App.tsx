
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ScormPlayer } from './components/ScormPlayer';
import { LoginPage } from './components/LoginPage';
import { CertificateModal } from './components/CertificateModal';
import { Community } from './components/Community';
import { Course, CourseStatus, User, LearningPath, UserStats } from './types';
import { Search, Filter, Download, LogOut } from 'lucide-react';
import { CourseCard } from './components/CourseCard';

// Mock Data
const MOCK_USER_TEMPLATE: User = {
  id: 'u1',
  name: 'Alex Johnson',
  email: 'alex.j@bicmas.edu',
  role: 'Trainee',
  avatar: 'https://picsum.photos/200'
};

const MOCK_STATS: UserStats = {
  streakDays: 12,
  totalLearningHours: 48.5,
  completedCourses: 4,
  averageScore: 92,
  weeklyActivity: [45, 60, 30, 90, 20, 0, 15], // M T W T F S S (minutes)
  scoreTrend: 5.2,
  completedCoursesTrend: 2,
  bicmasCoins: 1250,
  badges: [
    { id: 'b1', name: 'Safety First', description: 'Complete the Basic Safety Course', icon: 'shield', earnedDate: '2023-10-15', isLocked: false },
    { id: 'b2', name: 'Fast Learner', description: 'Finish a module in record time', icon: 'zap', earnedDate: '2023-11-02', isLocked: false },
    { id: 'b3', name: 'Quiz Master', description: 'Score 100% on a final exam', icon: 'star', earnedDate: '2023-11-10', isLocked: false },
    { id: 'b4', name: 'Dedicated', description: 'Maintain a 7-day streak', icon: 'medal', isLocked: true },
    { id: 'b5', name: 'Community Voice', description: 'Post 5 helpful forum replies', icon: 'trophy', isLocked: true }
  ]
};

const MOCK_LEARNING_PATH: LearningPath = {
  id: 'lp1',
  title: 'Senior Safety Officer Certification',
  description: 'A comprehensive journey to becoming a certified safety lead.',
  progress: 35,
  totalSteps: 5,
  completedSteps: 1,
  steps: [
    {
      id: 'step1',
      courseId: 'c1',
      title: 'Foundation: Workplace Safety',
      description: 'Master the basics of hazard identification and response.',
      status: 'completed',
      type: 'course',
      estimatedTime: '1h 30m'
    },
    {
      id: 'step2',
      courseId: 'c2',
      title: 'Compliance: Data & Privacy',
      description: 'Understand the legal frameworks surrounding data protection.',
      status: 'in-progress',
      type: 'course',
      estimatedTime: '2h 15m'
    },
    {
      id: 'step3',
      title: 'Mid-Term Safety Assessment',
      description: 'A multiple-choice evaluation of core safety concepts.',
      status: 'locked',
      type: 'assessment',
      estimatedTime: '45m'
    },
    {
      id: 'step4',
      courseId: 'c3',
      title: 'Leadership: Communication',
      description: 'Learn to effectively communicate safety protocols to teams.',
      status: 'locked',
      type: 'course',
      estimatedTime: '3h'
    },
    {
      id: 'step5',
      title: 'Final Certification Exam',
      description: 'The final step to earning your Senior Safety Officer badge.',
      status: 'locked',
      type: 'milestone',
      estimatedTime: '2h'
    }
  ]
};

const MOCK_COURSES: Course[] = [
  {
    id: 'c1',
    title: 'Workplace Safety Fundamentals',
    description: 'Essential safety protocols for the modern workplace environment. Covers fire safety, ergonomics, and emergency response.',
    thumbnail: 'https://picsum.photos/400/200?random=1',
    category: 'Mandatory',
    status: CourseStatus.Completed, // Changed to match path
    progress: 100,
    totalModules: 4,
    completedModules: 4,
    deadline: '2023-11-30',
    isDownloaded: true,
    certificateUrl: '#',
    modules: [
      { id: 'm1', title: 'Introduction to Safety', duration: '10 min', isCompleted: true, content: 'Safety is everyone\'s responsibility. In this module, we explore the core pillars of a safe working environment including personal protective equipment (PPE) and situational awareness.' },
      { id: 'm2', title: 'Fire Hazards', duration: '15 min', isCompleted: true, content: 'Understanding fire classifications (A, B, C, D, K) is crucial. This module details how to use fire extinguishers correctly using the PASS method.' },
      { id: 'm3', title: 'Ergonomics', duration: '20 min', isCompleted: true, content: 'Proper posture prevents long-term injury. Learn how to set up your desk, lift heavy objects, and take breaks effectively.' },
      { id: 'm4', title: 'Emergency Response', duration: '15 min', isCompleted: true, content: 'What to do when the alarm sounds. Evacuation routes, assembly points, and the role of fire wardens.' }
    ]
  },
  {
    id: 'c2',
    title: 'Data Privacy & GDPR',
    description: 'Understanding how to handle sensitive personal data in compliance with international regulations.',
    thumbnail: 'https://picsum.photos/400/200?random=2',
    category: 'Mandatory',
    status: CourseStatus.InProgress,
    progress: 33,
    totalModules: 3,
    completedModules: 1,
    deadline: '2023-12-15',
    isDownloaded: false,
    modules: [
        { id: 'm1', title: 'What is PII?', duration: '10 min', isCompleted: true, content: 'Personally Identifiable Information (PII) includes names, emails, and biometric data. Learn how to identify it.' },
        { id: 'm2', title: 'GDPR Principles', duration: '25 min', isCompleted: false, content: 'Lawfulness, fairness, transparency. We dive deep into the 7 key principles of GDPR.' },
        { id: 'm3', title: 'Handling Breaches', duration: '15 min', isCompleted: false, content: 'Reporting mechanisms and timelines. Who to contact if you suspect a data leak.' }
    ]
  },
  {
    id: 'c3',
    title: 'Effective Communication',
    description: 'Soft skills training for better team collaboration and leadership.',
    thumbnail: 'https://picsum.photos/400/200?random=3',
    category: 'Recommended',
    status: CourseStatus.NotStarted,
    progress: 0,
    totalModules: 2,
    completedModules: 0,
    isDownloaded: false,
    certificateUrl: '#',
    modules: [
         { id: 'm1', title: 'Active Listening', duration: '15 min', isCompleted: false, content: 'Listening is more than hearing. It involves feedback, body language, and withholding judgment.' },
         { id: 'm2', title: 'Clear Writing', duration: '15 min', isCompleted: false, content: 'Writing emails that get read. Structuring your thoughts for impact.' }
    ]
  }
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User>(MOCK_USER_TEMPLATE);
  const [activeView, setActiveView] = useState('dashboard');
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [learningPath, setLearningPath] = useState<LearningPath>(MOCK_LEARNING_PATH);
  const [stats, setStats] = useState<UserStats>(MOCK_STATS);
  // Initialize offline state based on navigator status
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [selectedCertificate, setSelectedCertificate] = useState<Course | null>(null);

  // Filters for Library
  const [filter, setFilter] = useState<'All' | 'Mandatory' | 'Recommended' | 'Completed'>('All');

  // Network Detection & Auto-Sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Automatically attempt sync if there are pending items
      if (pendingSync > 0) {
        setTimeout(() => setPendingSync(0), 1500);
      }
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingSync]);

  const handleLogin = (email: string) => {
    setUser(prev => ({ ...prev, email }));
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveView('dashboard');
  };

  const handleStartCourse = (id: string) => {
    setActiveCourseId(id);
  };

  const handleUpdateProgress = (courseId: string, progress: number, completedModules: number) => {
    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        const newStatus = progress === 100 ? CourseStatus.Completed : CourseStatus.InProgress;
        return { ...c, progress, completedModules, status: newStatus };
      }
      return c;
    }));
    
    // Update stats simulation and award coins
    setStats(prev => ({
      ...prev,
      totalLearningHours: prev.totalLearningHours + 0.1,
      bicmasCoins: prev.bicmasCoins + 10 // Award coins for progress
    }));

    // Simulate sync need if offline
    if (isOffline) {
      setPendingSync(prev => prev + 1);
    }
  };

  const handleDownload = (courseId: string) => {
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, isDownloaded: true } : c));
  };

  const handleRemoveDownload = (courseId: string) => {
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, isDownloaded: false } : c));
  };

  const toggleOffline = () => {
    // Manual toggle for simulation/testing
    if (isOffline) {
       setTimeout(() => setPendingSync(0), 2000);
    }
    setIsOffline(!isOffline);
  };

  const filteredCourses = courses.filter(c => {
    if (isOffline && !c.isDownloaded) return false; // In offline mode, only show downloaded
    if (filter === 'All') return true;
    if (filter === 'Completed') return c.status === CourseStatus.Completed;
    return c.category === filter;
  });

  const renderLibrary = () => (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search courses..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
         </div>
         
         <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {['All', 'Mandatory', 'Recommended', 'Completed'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f}
              </button>
            ))}
         </div>
      </div>

      {isOffline && (
        <div className="bg-orange-50 border border-orange-100 text-orange-800 p-4 rounded-xl flex items-center gap-3">
          <Download size={20} />
          <span>Showing only downloaded courses available for offline learning.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map(course => (
            <CourseCard 
              key={course.id} 
              course={course} 
              onStart={handleStartCourse}
              onDownload={handleDownload}
              onRemoveDownload={handleRemoveDownload}
              isOfflineMode={isOffline}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-slate-400">
            No courses found for this filter.
          </div>
        )}
      </div>
    </div>
  );

  const renderCertificates = () => (
    <div className="animate-in fade-in zoom-in duration-300">
       <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
         <div className="p-6 border-b border-slate-100">
           <h2 className="text-xl font-bold text-slate-800">My Certificates</h2>
         </div>
         <div className="divide-y divide-slate-100">
           {courses.filter(c => c.status === CourseStatus.Completed).map(course => (
             <div key={course.id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-yellow-50 rounded-lg flex items-center justify-center text-yellow-600">
                      <Filter size={32} /> {/* Mock Certificate Icon */}
                   </div>
                   <div>
                     <h3 className="font-bold text-slate-900">{course.title}</h3>
                     <p className="text-sm text-slate-500">Completed on {new Date().toLocaleDateString()}</p>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedCertificate(course)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <Download size={16} /> Download PDF
                </button>
             </div>
           ))}
           {courses.filter(c => c.status === CourseStatus.Completed).length === 0 && (
             <div className="p-12 text-center text-slate-500">
               Complete a course to earn your first certificate!
             </div>
           )}
         </div>
       </div>
    </div>
  );

  const renderProfile = () => (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in duration-300">
       <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
          <div className="relative inline-block">
            <img src={user.avatar} alt="Profile" className="w-32 h-32 rounded-full border-4 border-white shadow-lg mx-auto" />
            <div className="absolute bottom-2 right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-4">{user.name}</h2>
          <p className="text-slate-500">{user.role} • {user.email}</p>
          <button 
            onClick={handleLogout}
            className="mt-6 px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <LogOut size={16} /> Sign Out
          </button>
       </div>

       <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Account Settings</h3>
          </div>
          <div className="p-6 space-y-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
               <input type="email" value={user.email} disabled className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500" />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Language Preference</label>
               <select className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800">
                 <option>English (US)</option>
                 <option>Spanish</option>
                 <option>French</option>
               </select>
             </div>
             <div className="flex items-center justify-between py-2">
               <span className="text-slate-700">Email Notifications</span>
               <div className="w-11 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
               </div>
             </div>
          </div>
       </div>
    </div>
  );

  if (!isAuthenticated) return <LoginPage onLogin={handleLogin} />;

  return (
    <>
      {activeCourseId ? (
        <ScormPlayer 
          course={courses.find(c => c.id === activeCourseId)!} 
          onBack={() => setActiveCourseId(null)} 
          onUpdateProgress={handleUpdateProgress}
          onViewCertificate={() => setSelectedCertificate(courses.find(c => c.id === activeCourseId) || null)}
        />
      ) : (
        <Layout 
          activeView={activeView} 
          onChangeView={setActiveView} 
          user={user}
          isOffline={isOffline}
          toggleOffline={toggleOffline}
          pendingSync={pendingSync}
        >
          {activeView === 'dashboard' && (
            <Dashboard 
              courses={courses} 
              learningPath={learningPath}
              stats={stats}
              onStartCourse={handleStartCourse}
              onDownload={handleDownload}
              onRemoveDownload={handleRemoveDownload}
              isOfflineMode={isOffline}
              user={user}
            />
          )}
          {activeView === 'library' && renderLibrary()}
          {activeView === 'community' && <Community user={user} />}
          {activeView === 'certificates' && renderCertificates()}
          {activeView === 'profile' && renderProfile()}
        </Layout>
      )}

      {/* Certificate Confirmation Modal */}
      <CertificateModal 
        isOpen={!!selectedCertificate}
        onClose={() => setSelectedCertificate(null)}
        onConfirm={() => setSelectedCertificate(null)}
        courseTitle={selectedCertificate?.title || ''}
        recipientName={user.name}
        certificateUrl={selectedCertificate?.certificateUrl}
      />
    </>
  );
}
