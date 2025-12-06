import React, { useState, useEffect, useRef } from 'react';
import { Course, ScormModule } from '../types';
import { ChevronLeft, ChevronRight, Menu, CheckCircle, X, Sparkles, Lock, Award, Download, Share2, Play, Pause, RotateCcw, Volume2, Maximize } from 'lucide-react';
import { getGeminiResponse } from '../services/geminiService';

interface ScormPlayerProps {
  course: Course;
  onBack: () => void;
  onUpdateProgress: (courseId: string, progress: number, completedModules: number) => void;
  onViewCertificate: () => void;
}

export const ScormPlayer: React.FC<ScormPlayerProps> = ({ course, onBack, onUpdateProgress, onViewCertificate }) => {
  const [modules, setModules] = useState<ScormModule[]>(course.modules);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAiChat, setShowAiChat] = useState(false);
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);
  
  // Media Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(100); // Simulated duration in seconds
  const playerIntervalRef = useRef<number | null>(null);
  
  // AI Chat State
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: `Hi! I'm your BICMAS AI Tutor. I can help you with "${course.title}". Ask me anything!` }
  ]);
  const [isThinking, setIsThinking] = useState(false);

  // Initialize duration based on module string (mock logic)
  useEffect(() => {
    const durationStr = modules[activeModuleIndex].duration;
    const mins = parseInt(durationStr) || 5;
    setDuration(mins * 60);
    setCurrentTime(0);
    setIsPlaying(false);
    if (playerIntervalRef.current) window.clearInterval(playerIntervalRef.current);
  }, [activeModuleIndex]);

  // Player Timer Logic
  useEffect(() => {
    if (isPlaying) {
        playerIntervalRef.current = window.setInterval(() => {
            setCurrentTime(prev => {
                if (prev >= duration) {
                    setIsPlaying(false);
                    // Auto-complete module when media finishes
                    if (!modules[activeModuleIndex].isCompleted) {
                        handleMarkComplete();
                    }
                    return duration;
                }
                return prev + 1;
            });
        }, 1000); // 1x speed simulation
    } else {
        if (playerIntervalRef.current) window.clearInterval(playerIntervalRef.current);
    }
    return () => {
        if (playerIntervalRef.current) window.clearInterval(playerIntervalRef.current);
    };
  }, [isPlaying, duration, activeModuleIndex, modules]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(Number(e.target.value));
  };

  const isModuleLocked = (index: number, currentModules: ScormModule[]) => {
    if (index === 0) return false;
    return !currentModules[index - 1].isCompleted;
  };

  // 1. Load progress
  useEffect(() => {
    const savedState = localStorage.getItem(`scorm_progress_${course.id}`);
    if (savedState) {
      try {
        const { index, savedModules, completed } = JSON.parse(savedState);
        const mergedModules = course.modules.map((m, i) => ({
            ...m,
            isCompleted: savedModules[i]?.isCompleted || m.isCompleted
        }));
        setModules(mergedModules);
        
        let validIndex = index;
        if (validIndex > 0 && isModuleLocked(validIndex, mergedModules)) {
            const firstLocked = mergedModules.findIndex((_, idx) => isModuleLocked(idx, mergedModules));
            validIndex = firstLocked !== -1 ? Math.max(0, firstLocked - 1) : mergedModules.length - 1;
        }
        setActiveModuleIndex(validIndex);
        setIsCourseCompleted(completed);
      } catch (e) {
        console.error("Failed to restore course progress", e);
      }
    }
  }, [course.id]);

  // 2. Save progress
  useEffect(() => {
    const stateToSave = {
        index: activeModuleIndex,
        savedModules: modules,
        completed: isCourseCompleted
    };
    localStorage.setItem(`scorm_progress_${course.id}`, JSON.stringify(stateToSave));
  }, [activeModuleIndex, modules, isCourseCompleted, course.id]);

  const activeModule = modules[activeModuleIndex];

  const handleMarkComplete = () => {
    const updatedModules = [...modules];
    if (!updatedModules[activeModuleIndex].isCompleted) {
        updatedModules[activeModuleIndex].isCompleted = true;
        setModules(updatedModules);
        
        const completedCount = updatedModules.filter(m => m.isCompleted).length;
        const progress = Math.round((completedCount / updatedModules.length) * 100);
        onUpdateProgress(course.id, progress, completedCount);
    }
  };

  const handleNext = () => {
    handleMarkComplete();
    if (activeModuleIndex < modules.length - 1) {
      setActiveModuleIndex(prev => prev + 1);
    } else {
      setIsCourseCompleted(true);
    }
  };

  const handlePrev = () => {
    if (activeModuleIndex > 0) {
      setActiveModuleIndex(prev => prev - 1);
      setIsCourseCompleted(false);
    }
  };

  const handleSidebarClick = (index: number) => {
    if (isModuleLocked(index, modules)) return;
    setActiveModuleIndex(index);
    setIsCourseCompleted(false);
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userMsg = aiInput;
    setAiMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setAiInput('');
    setIsThinking(true);

    const context = `Course: ${course.title}. Module: ${activeModule?.title || 'Summary'}. Content: ${activeModule?.content || 'Course Completed'}`;
    const response = await getGeminiResponse(userMsg, context);

    setIsThinking(false);
    setAiMessages(prev => [...prev, { role: 'model', text: response }]);
  };

  if (isCourseCompleted) {
    return (
        <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col h-screen w-screen overflow-hidden">
             <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
                    <ChevronLeft size={20} /> Back to Dashboard
                </button>
                <div className="font-semibold text-slate-800">{course.title}</div>
                <div className="w-8"></div>
             </header>

             <main className="flex-1 flex flex-col items-center justify-center p-6 animate-in zoom-in duration-500">
                <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl border border-slate-100 overflow-hidden text-center p-12">
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                        <Award size={48} />
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Congratulations!</h1>
                    <p className="text-lg text-slate-600 mb-8">
                        You have successfully completed <br/>
                        <span className="font-bold text-slate-800">"{course.title}"</span>
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onClick={onViewCertificate}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-blue-200"
                        >
                            <Download size={20} /> Download Certificate
                        </button>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <button onClick={() => { setActiveModuleIndex(0); setIsCourseCompleted(false); }} className="text-sm text-slate-400 hover:text-blue-600">
                            Review Course Content
                        </button>
                    </div>
                </div>
             </main>
        </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-screen w-screen">
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="hover:bg-slate-800 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-medium text-slate-300 uppercase tracking-wider">BICMAS Player</h1>
            <span className="font-semibold text-lg leading-none">{course.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
             <div className="text-xs text-slate-400">Total Progress</div>
             <div className="font-mono text-emerald-400">
                {Math.round((modules.filter(m => m.isCompleted).length / modules.length) * 100)}%
             </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg sm:hidden"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className={`${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full opacity-0'} transition-all duration-300 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 absolute sm:relative z-20 h-full shadow-xl sm:shadow-none`}>
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-700">Course Modules</h2>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {modules.map((module, idx) => {
              const locked = isModuleLocked(idx, modules);
              const isActive = idx === activeModuleIndex;
              return (
                <button
                    key={module.id}
                    onClick={() => handleSidebarClick(idx)}
                    disabled={locked}
                    className={`w-full text-left p-3 rounded-lg text-sm flex items-start gap-3 transition-colors ${
                    isActive 
                        ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                        : locked
                        ? 'opacity-50 cursor-not-allowed bg-slate-50'
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                >
                    <div className="mt-0.5">
                    {module.isCompleted ? (
                        <CheckCircle size={16} className="text-green-500" />
                    ) : locked ? (
                        <Lock size={16} className="text-slate-400" />
                    ) : (
                        <div className={`w-4 h-4 rounded-full border-2 ${isActive ? 'border-blue-500' : 'border-slate-300'}`} />
                    )}
                    </div>
                    <div>
                        <span className="block font-medium">{module.title}</span>
                        <span className="text-xs text-slate-400">{module.duration}</span>
                    </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 bg-white relative overflow-hidden flex flex-col">
           <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
              <div className="prose prose-slate max-w-none">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-slate-900 m-0">{activeModule.title}</h2>
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">
                        Module {activeModuleIndex + 1} of {modules.length}
                    </span>
                </div>
                
                {/* Simulated Media Player with Seek Bar */}
                <div className="bg-slate-900 rounded-xl overflow-hidden shadow-xl mb-8 group">
                   <div className="aspect-video bg-slate-800 relative flex items-center justify-center">
                       {/* Placeholder Visuals */}
                       <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                       <PlayCircleAnimation isPlaying={isPlaying} />
                       
                       {/* Big Play Button Overlay */}
                       {!isPlaying && (
                           <button 
                             onClick={() => setIsPlaying(true)}
                             className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors"
                           >
                               <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center pl-1 hover:scale-110 transition-transform shadow-lg">
                                   <Play size={40} className="text-slate-900" fill="currentColor" />
                               </div>
                           </button>
                       )}
                   </div>

                   {/* Player Controls */}
                   <div className="bg-slate-900 p-4 text-white">
                      {/* Seek Bar */}
                      <div className="flex items-center gap-4 mb-2">
                          <span className="text-xs font-mono text-slate-400 w-10 text-right">{formatTime(currentTime)}</span>
                          <div className="flex-1 relative h-2 group/seek">
                              <div className="absolute inset-0 bg-slate-700 rounded-full"></div>
                              <div 
                                className="absolute top-0 left-0 h-full bg-blue-500 rounded-full relative" 
                                style={{ width: `${(currentTime / duration) * 100}%` }}
                              >
                                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/seek:opacity-100 transition-opacity"></div>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max={duration} 
                                value={currentTime}
                                onChange={handleSeek}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                              />
                          </div>
                          <span className="text-xs font-mono text-slate-400 w-10">{formatTime(duration)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                              <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-blue-400 transition-colors">
                                  {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                              </button>
                              <button onClick={() => { setCurrentTime(0); setIsPlaying(true); }} className="hover:text-blue-400 transition-colors text-slate-400">
                                  <RotateCcw size={20} />
                              </button>
                              <div className="flex items-center gap-2 group/vol">
                                  <Volume2 size={20} className="text-slate-400" />
                                  <div className="w-20 h-1 bg-slate-700 rounded-full overflow-hidden">
                                      <div className="w-3/4 h-full bg-slate-400"></div>
                                  </div>
                              </div>
                          </div>
                          <button className="hover:text-blue-400 transition-colors text-slate-400">
                              <Maximize size={20} />
                          </button>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed mb-8 shadow-sm">
                   <h3 className="text-lg font-bold text-slate-900 mb-2">Key Takeaways</h3>
                   <p className="mb-4 text-lg">{activeModule.content}</p>
                   <p className="mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                   <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                </div>
              </div>
           </div>

           <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center max-w-4xl mx-auto w-full">
              <button 
                onClick={handlePrev} 
                disabled={activeModuleIndex === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent font-medium"
              >
                <ChevronLeft size={20} /> Previous Module
              </button>

              <button 
                onClick={handleNext} 
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-transform active:scale-95 ${
                    activeModule.isCompleted 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
                disabled={!activeModule.isCompleted}
                title={!activeModule.isCompleted ? "Complete the module content first" : ""}
              >
                {activeModuleIndex === modules.length - 1 ? 'Finish & Claim Certificate' : 'Next Module'} <ChevronRight size={20} />
              </button>
           </div>
        </main>
      </div>

      <div className="fixed bottom-6 right-6 z-30">
        <button 
          onClick={() => setShowAiChat(!showAiChat)}
          className="bg-indigo-600 text-white p-4 rounded-full shadow-lg shadow-indigo-300 hover:bg-indigo-700 transition-transform hover:scale-105 flex items-center gap-2"
        >
           <Sparkles size={24} />
           <span className="font-medium pr-1">AI Tutor</span>
        </button>
      </div>

      {showAiChat && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col z-30 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
           <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
             <div className="flex items-center gap-2">
               <Sparkles size={18} />
               <span className="font-semibold">BICMAS AI Assistant</span>
             </div>
             <button onClick={() => setShowAiChat(false)} className="hover:bg-indigo-500 rounded p-1"><X size={16} /></button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isThinking && (
                 <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex gap-1">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                 </div>
              )}
           </div>

           <form onSubmit={handleAiSubmit} className="p-3 border-t border-slate-100 bg-white">
             <div className="flex gap-2">
               <input 
                 type="text" 
                 value={aiInput}
                 onChange={(e) => setAiInput(e.target.value)}
                 placeholder="Ask about this module..."
                 className="flex-1 bg-slate-100 border-0 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm"
               />
               <button type="submit" disabled={!aiInput.trim() || isThinking} className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                 <ChevronRight size={20} />
               </button>
             </div>
           </form>
        </div>
      )}
    </div>
  );
};

// Simple visual component for the "video player" background
const PlayCircleAnimation = ({ isPlaying }: { isPlaying: boolean }) => {
    if (!isPlaying) return null;
    return (
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="w-full h-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 animate-pulse"></div>
        </div>
    );
};