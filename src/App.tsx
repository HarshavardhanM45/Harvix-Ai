import React, { useState, useEffect, useRef } from 'react';
import { INTERVIEW_CATEGORIES, PROGRAMMING_TOPICS, CORE_CONCEPTS_TOPICS } from './data';
import type { Category, Question, PrepTopic, MCQ } from './data';

const BrandingHeader: React.FC = () => (
  <div className="flex items-center gap-4 mb-8">
    <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.2)] border border-white/10 p-1">
      <img src="/assets/icons/logo.png" alt="HARVIX AI" className="w-full h-full object-cover rounded-full" />
    </div>
    <span className="text-2xl font-black tracking-tighter text-[var(--color-text-main)] font-premium uppercase">
      HARVIX <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">AI</span>
    </span>
  </div>
);

const API = 'http://127.0.0.1:5000';

const App: React.FC = () => {
  // --- Auth ---
  const [currentUser, setCurrentUser] = useState<{ id: number; email: string } | null>(() => {
    const saved = localStorage.getItem('harvix_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [currentPage, setCurrentPage] = useState<string>(() => {
    const saved = localStorage.getItem('harvix_user');
    return saved ? 'portal' : 'login';
  });
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);
  const [lastEvaluation, setLastEvaluation] = useState<{ score: number; feedback: string } | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [completedHomeworks, setCompletedHomeworks] = useState<{ [key: string]: boolean[] }>({});
  const [selectedPrepTopic, setSelectedPrepTopic] = useState<PrepTopic | null>(null);
  const [navigationStack, setNavigationStack] = useState<string[]>([]);
  
  // Quiz State
  const [activeQuiz, setActiveQuiz] = useState<MCQ[] | null>(null);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  const navigateTo = (page: string) => {
    setNavigationStack(prev => [...prev, currentPage]);
    setCurrentPage(page);
    window.scrollTo(0, 0);
    // Reset quiz state when navigating
    setActiveQuiz(null);
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setQuizFinished(false);
    setSelectedAnswer(null);
    setLoadingQuiz(false);
  };

  const goBack = () => {
    if (navigationStack.length > 0) {
      const prevStack = [...navigationStack];
      const prevPage = prevStack.pop();
      setNavigationStack(prevStack);
      if (prevPage) setCurrentPage(prevPage);
    } else {
      setCurrentPage('portal');
    }
    window.scrollTo(0, 0);
  };
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load progress from DB when user logs in
  const loadProgressFromDB = async (userId: number) => {
    try {
      const res = await fetch(`${API}/api/progress/${userId}`);
      const data = await res.json();
      if (res.ok) {
        const homeworks: { [key: string]: boolean[] } = {};
        const completed: string[] = [];
        Object.entries(data).forEach(([topicId, val]: [string, any]) => {
          homeworks[topicId] = val.completedTasks;
          if (val.isCompleted) completed.push(topicId);
        });
        setCompletedHomeworks(homeworks);
        setCompletedTopics(completed);
      }
    } catch (e) {
      console.error('Failed to load progress', e);
    }
  };

  // Save a single topic's progress to DB
  const saveTopicProgressToDB = async (userId: number, topicId: string, tasks: boolean[], isCompleted: boolean) => {
    try {
      await fetch(`${API}/api/progress/${userId}/${topicId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedTasks: tasks, isCompleted })
      });
    } catch (e) {
      console.error('Failed to save progress', e);
    }
  };

  // Auto-recompute completedTopics from homeworks
  useEffect(() => {
    const newCompleted = Object.keys(completedHomeworks).filter(topicId => {
      const topic = PROGRAMMING_TOPICS.find(t => t.id === topicId);
      if (!topic) return false;
      const progress = completedHomeworks[topicId] || [];
      return progress.length === topic.homework.length && progress.every(v => v);
    });
    setCompletedTopics(newCompleted);
  }, [completedHomeworks]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // TTS on Question Change
  useEffect(() => {
    if (currentPage === 'interview' && currentQuestion) {
      if (currentQuestion.question) {
        speakQuestion(currentQuestion.question);
      }
    }
  }, [currentPage, currentQuestionIndex, currentQuestion]);

  const speakQuestion = async (text: string) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
    } catch (error) {
      console.error("TTS Error:", error);
    }
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setTranscribedText('Recording Answer...');
      setFinalTranscript('');
      
      await fetch('http://127.0.0.1:5000/api/start_record', {
        method: 'POST'
      });
    } catch (error) {
      console.error("Start recording error:", error);
      setIsRecording(false);
      alert("Failed to start recording. Ensure the Python backend is running.");
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setTranscribedText('Transcribing your answer...');
      
      const response = await fetch('http://127.0.0.1:5000/api/stop_record', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.text) {
        setFinalTranscript(data.text);
      } else if (data.error) {
        setFinalTranscript(`(Transcription failed: ${data.error})`);
      } else {
        setFinalTranscript("No speech detected.");
      }
      setTranscribedText('');
    } catch (error) {
      console.error("Stop recording error:", error);
      setFinalTranscript("(Connection error - Check backend)");
      setTranscribedText('');
    }
  };

  // --- Auth handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        localStorage.setItem('harvix_user', JSON.stringify(data.user));
        await loadProgressFromDB(data.user.id);
        setLoginEmail('');
        setLoginPassword('');
        navigateTo('portal');
      } else {
        setAuthError(data.error || 'Login failed.');
      }
    } catch {
      setAuthError('Cannot connect to server. Make sure the backend is running.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        localStorage.setItem('harvix_user', JSON.stringify(data.user));
        setCompletedHomeworks({});
        setCompletedTopics([]);
        setLoginEmail('');
        setLoginPassword('');
        navigateTo('portal');
      } else {
        setAuthError(data.error || 'Registration failed.');
      }
    } catch {
      setAuthError('Cannot connect to server. Make sure the backend is running.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('harvix_user');
    setCompletedHomeworks({});
    setCompletedTopics([]);
    setLoginEmail('');
    setLoginPassword('');
    setNavigationStack([]);
    setCurrentPage('login');
  };

  const startInterview = async (category: Category) => {
    setSelectedCategory(category);
    setLoadingQuestions(true);
    setCurrentQuestion(null);
    navigateTo('interview');
    setHistory([]);
    setCurrentQuestionIndex(0);
    setLastEvaluation(null);
    
    try {
      const response = await fetch('http://127.0.0.1:5000/api/get_next_question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: category.title, history: [] })
      });
      const data = await response.json();
      if (data.question) {
        setCurrentQuestion({ id: data.id, question: data.question, category: category.id });
      } else {
        const msg = data.details || data.error || "Failed to generate question.";
        alert(`AI Error: ${msg}`);
      }
    } catch (error) {
      console.error("Failed to fetch initial question:", error);
      alert("Connectivity Error: Could not reach the backend at 127.0.0.1:5000.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const nextQuestion = async () => {
    if (!selectedCategory || !currentQuestion) return;
    
    // Check session limit (10 questions)
    if (currentQuestionIndex >= 9) {
      navigateTo('dashboard');
      alert("🎉 10-Question Interview Session Completed Successfully!");
      return;
    }

    const currentAnswer = finalTranscript || "No answer recorded.";
    const updatedHistory = [
      ...history, 
      { 
        question: currentQuestion.question, 
        answer: currentAnswer,
        evaluation: lastEvaluation // Include the evaluation of the previous question
      }
    ];
    
    setIsRecording(false);
    setTranscribedText('');
    setFinalTranscript('');
    setLoadingQuestions(true);
    setCurrentQuestion(null);
    setCurrentQuestionIndex(prev => prev + 1);
    setHistory(updatedHistory);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/get_next_question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: selectedCategory.title, history: updatedHistory })
      });
      const data = await response.json();
      if (data.question) {
        setCurrentQuestion({ id: data.id, question: data.question, category: selectedCategory.id });
        if (data.evaluation) {
          setLastEvaluation(data.evaluation);
        }
      }
    } catch (error) {
      console.error("Failed to fetch next question:", error);
    } finally {
      setLoadingQuestions(false);
    }
  };



  const handleTopicClick = (topic: PrepTopic) => {
    setSelectedPrepTopic(topic);
    navigateTo('topic-detail');
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null || !activeQuiz) return;
    setSelectedAnswer(index);
    if (index === activeQuiz[currentQuizIndex].correctAnswer) {
      setQuizScore(prev => prev + 1);
    }
  };

  const moveToNextQuizQuestion = () => {
    if (!activeQuiz) return;
    if (currentQuizIndex < activeQuiz.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setQuizFinished(true);
    }
  };

  const startQuiz = async () => {
    if (!selectedPrepTopic) return;
    
    // For programming topics, use hardcoded tasks (labs)
    if (selectedPrepTopic.category !== 'core') {
      return;
    }

    // Navigate to quiz-session page
    navigateTo('quiz-session');

    // For Core Concepts, fetch 10 MCQs from LLM
    setLoadingQuiz(true);
    setActiveQuiz(null);
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setQuizFinished(false);
    setSelectedAnswer(null);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/generate_mcqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: selectedPrepTopic.title })
      });
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setActiveQuiz(data);
      } else {
        alert("Failed to generate assessment questions. Please try again.");
        goBack(); // Return if failed
      }
    } catch (error) {
      console.error("Quiz Generation Error:", error);
      alert("Connectivity Error: Could not reach the assessment server.");
      goBack(); // Return if failed
    } finally {
      setLoadingQuiz(false);
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    const videoId = url.split('/').pop()?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
  };

  const toggleHomework = (topicId: string, index: number) => {
    setCompletedHomeworks(prev => {
      const topic = PROGRAMMING_TOPICS.find(t => t.id === topicId);
      const hwCount = topic?.homework.length || 0;
      const current = prev[topicId] || new Array(hwCount).fill(false);
      const next = [...current];
      next[index] = !next[index];
      const newState = { ...prev, [topicId]: next };

      // Persist to DB
      if (currentUser) {
        const allDone = next.length === hwCount && next.every(v => v);
        saveTopicProgressToDB(currentUser.id, topicId, next, allDone);
      }
      return newState;
    });
  };

  // Questions are now managed via state

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <audio ref={audioRef} hidden />

      {/* Theme Toggle */}
      <button 
        onClick={toggleTheme}
        className="fixed top-8 right-8 z-50 glass w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,0,0,0.3)] border border-white/10 group"
        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      >
        <span className="text-xl transition-transform group-hover:rotate-12">
          {theme === 'dark' ? '☀️' : '🌙'}
        </span>
        <div className="absolute inset-0 rounded-full bg-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>

      {/* User pill + Logout — fixed top-left, shown when logged in */}
      {currentUser && (
        <div className="fixed top-6 left-6 z-50 flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
          {/* User pill */}
          <div className="glass flex items-center gap-3 pl-2 pr-4 py-2 rounded-full border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            {/* Avatar */}
            <div className="relative w-8 h-8 flex-shrink-0">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 opacity-20 blur-sm"></div>
              <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center font-black text-cyan-300 text-[11px] uppercase tracking-wider shadow-[0_0_12px_rgba(34,211,238,0.2)]">
                {currentUser.email?.slice(0, 2)}
              </div>
            </div>
            {/* Email */}
            <div className="flex flex-col min-w-0 hidden sm:flex">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-500/60 leading-none mb-0.5">Active Session</span>
              <span className="text-[11px] font-bold text-[var(--color-text-main)] truncate max-w-[130px] leading-none">{currentUser.email}</span>
            </div>
          </div>

          {/* Logout icon button — matches theme toggle style */}
          <button
            onClick={handleLogout}
            title="Sign out"
            className="glass w-10 h-10 rounded-full flex items-center justify-center border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:border-red-500/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:scale-110 active:scale-95 transition-all duration-300 group relative"
          >
            <div className="absolute inset-0 rounded-full bg-red-500/0 group-hover:bg-red-500/5 transition-colors duration-300"></div>
            {/* Power / logout SVG icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[var(--color-text-dim)] group-hover:text-red-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 16.22a6.937 6.937 0 0 1-9.5 0 6.937 6.937 0 0 1 0-9.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v9" />
            </svg>
          </button>
        </div>
      )}

      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-blue-600/10 rounded-full blur-[120px] animate-float"></div>
        <div className="absolute bottom-[15%] right-[10%] w-96 h-96 bg-cyan-600/10 rounded-full blur-[150px] animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      {(currentPage === 'login' || currentPage === 'register') && (
        <div className="glass p-12 rounded-[3.5rem] w-full max-w-md shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden group border-white/5">
          <div className="scan-line opacity-30"></div>
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-500"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-3xl rotate-12 group-hover:rotate-45 transition-transform duration-1000"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-3xl -rotate-12 group-hover:-rotate-45 transition-transform duration-1000"></div>

          <div className="flex justify-center mb-8 relative">
            <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(14,165,233,0.3)] border border-white/10 p-1">
               <img src="/assets/icons/logo.png" alt="HARVIX AI Logo" className="w-full h-full object-cover rounded-full" />
            </div>
          </div>
          
          <h1 className="text-5xl font-black text-center mb-2 tracking-tighter text-[var(--color-text-main)] font-premium uppercase">
            HARVIX <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">AI</span>
          </h1>
          <p className="text-[var(--color-text-dim)] text-center mb-10 text-[10px] font-black uppercase tracking-[0.5em] opacity-70">Empowering Intelligence</p>
          
          {authError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm font-bold text-center">
              {authError}
            </div>
          )}

          <form onSubmit={currentPage === 'login' ? handleLogin : handleRegister} className="space-y-8 relative z-10">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500/70 ml-2">Email Address</label>
              <input 
                type="email" 
                required 
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/5 rounded-2xl p-5 outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all text-white placeholder:text-slate-600 shadow-inner font-medium"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500/70 ml-2">Password</label>
              <input 
                type="password" 
                required 
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/5 rounded-2xl p-5 outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all text-white placeholder:text-slate-600 shadow-inner font-medium"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full btn-quantum py-5 rounded-2xl font-black text-white text-xl tracking-tight uppercase shadow-2xl font-premium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {authLoading ? 'CONNECTING...' : currentPage === 'login' ? 'INITIALIZE UPLINK' : 'CREATE ACCOUNT'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            {currentPage === 'login' ? (
              <p className="text-[var(--color-text-dim)] text-xs font-medium">
                No account?{' '}
                <button
                  onClick={() => { setAuthError(''); setCurrentPage('register'); }}
                  className="text-cyan-400 font-black hover:underline"
                >
                  Register here
                </button>
              </p>
            ) : (
              <p className="text-[var(--color-text-dim)] text-xs font-medium">
                Already have an account?{' '}
                <button
                  onClick={() => { setAuthError(''); setCurrentPage('login'); }}
                  className="text-cyan-400 font-black hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.4em] text-[var(--color-text-dim)]">
            <div className="flex items-center gap-2">
               <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
               <span>Secure Auth</span>
            </div>
            <span>V2.4.0-STABLE</span>
          </div>
        </div>
      )}
      {currentPage === 'portal' && (
        <div className="w-full max-w-6xl px-4 animate-in fade-in zoom-in duration-700">
          <header className="flex flex-col items-center mb-16 relative w-full">
            {/* — portal-level chip removed; global fixed chip (top-left) handles this — */}

            <BrandingHeader />
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-[var(--color-text-main)] mb-4 font-premium">
              COMMAND <span className="text-cyan-400">CENTER</span>
            </h2>
            <p className="text-[var(--color-text-dim)] font-black uppercase tracking-[0.4em] text-xs">Select your operational directive</p>
          </header>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Placement Preparation Card */}
            <div 
              onClick={() => navigateTo('placement-prep')}
              className="glass p-16 rounded-[4rem] cursor-pointer hover:bg-slate-800/30 transition-all group relative overflow-hidden flex flex-col items-center border-white/5 hover:border-blue-500/30 card-isometric text-center"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="w-56 h-56 mb-10 transform group-hover:-translate-y-4 transition-transform duration-500 drop-shadow-[0_20px_40px_rgba(14,165,233,0.4)]">
                 <img src="/assets/icons/prep.png" alt="Placement Prep" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-5xl font-black mb-6 tracking-tighter group-hover:text-cyan-400 transition-colors font-premium">Placement Preparation</h3>
              <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium tracking-tight">Access technical documentation, algorithmic patterns, and architectural blueprints.</p>
              <span className="btn-quantum px-12 py-5 rounded-full text-lg font-black uppercase tracking-widest text-white shadow-lg">Enter Module</span>
            </div>

            {/* Mock Interview Card */}
            <div 
              onClick={() => navigateTo('dashboard')}
              className="glass p-16 rounded-[4rem] cursor-pointer hover:bg-slate-800/30 transition-all group relative overflow-hidden flex flex-col items-center border-white/5 hover:border-blue-500/30 card-isometric text-center"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="w-56 h-56 mb-10 transform group-hover:-translate-y-4 transition-transform duration-500 drop-shadow-[0_20px_40px_rgba(34,211,238,0.4)]">
                 <img src="/assets/icons/mock.png" alt="Mock Interview" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-5xl font-black mb-6 tracking-tighter group-hover:text-blue-400 transition-colors font-premium">Mock Interview</h3>
              <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium tracking-tight">Engage in high-fidelity AI-driven simulations with real-time neural evaluation.</p>
              <span className="btn-quantum px-12 py-5 rounded-full text-lg font-black uppercase tracking-widest text-white shadow-lg">Initialize Session</span>
            </div>
          </div>
        </div>
      )}

      {currentPage === 'placement-prep' && (
        <div className="w-full max-w-6xl px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <header className="flex flex-col items-center mb-16 px-4 pt-10">
            <BrandingHeader />
            <button 
              onClick={goBack}
              className="btn-quantum px-8 py-3 rounded-full mb-8 text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 mx-auto flex items-center gap-2"
            >
              <span className="text-lg">←</span> RETURN PROTOCOL
            </button>
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-[var(--color-text-main)] mb-4 font-premium">
              PLACEMENT <span className="text-blue-500">PREP</span>
            </h2>
            <p className="text-[var(--color-text-dim)] font-black uppercase tracking-[0.4em] text-xs">Master technical domain protocols</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Core Concepts Card */}
            <div 
              onClick={() => navigateTo('core-concepts')}
              className="glass p-16 rounded-[4rem] cursor-pointer hover:bg-slate-800/30 transition-all group relative overflow-hidden flex flex-col items-center border-white/5 hover:border-cyan-500/30 card-isometric text-center"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="w-56 h-56 mb-10 transform group-hover:-translate-y-4 transition-transform duration-500 drop-shadow-[0_20px_40px_rgba(34,211,238,0.4)]">
                 <img src="/assets/icons/core.png" alt="Core Concepts" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-5xl font-black mb-6 tracking-tighter group-hover:text-cyan-400 transition-colors font-premium">Core Concepts</h3>
              <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium tracking-tight">Deep dive into OS, DBMS, Computer Networks, and System Design fundamentals.</p>
              <span className="btn-quantum px-12 py-5 rounded-full text-lg font-black uppercase tracking-widest text-white shadow-lg">Enter Module</span>
            </div>

            {/* Programming Section */}
            <div 
              onClick={() => navigateTo('programming-curriculum')}
              className="glass p-16 rounded-[4rem] cursor-pointer hover:bg-slate-800/30 transition-all group relative overflow-hidden flex flex-col items-center border-white/5 hover:border-emerald-500/30 card-isometric text-center"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="w-56 h-56 mb-10 transform group-hover:-translate-y-4 transition-transform duration-500 drop-shadow-[0_20px_40px_rgba(16,185,129,0.4)]">
                 <img src="/assets/icons/programming.png" alt="Programming" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-5xl font-black mb-6 tracking-tighter group-hover:text-emerald-400 transition-colors font-premium">Programming</h3>
              <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium tracking-tight">Master Python, Java, C++, and Web Technologies through hands-on challenges.</p>
              <span className="btn-quantum px-12 py-5 rounded-full text-lg font-black uppercase tracking-widest text-white shadow-lg">Enter Module</span>
            </div>
          </div>
        </div>
      )}

      {currentPage === 'programming-curriculum' && (
        <div className="w-full max-w-7xl px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <header className="mb-20 px-4 md:px-0 pt-10">
            <div className="flex justify-between items-start mb-12">
              <button 
                onClick={goBack}
                className="btn-quantum px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <span className="text-lg">←</span> BACK TO ARCHIVE
              </button>
              <BrandingHeader />
            </div>
            
            <div className="flex flex-col md:flex-row items-end gap-8 md:gap-16 relative">
              {/* Mega Progress Indicator */}
              <div className="flex flex-col items-start group">
                <div className="flex items-baseline gap-2">
                  <span className="text-8xl md:text-9xl font-black tracking-tighter text-emerald-400 font-premium leading-none transition-all duration-1000">
                    {Math.round((completedTopics.length / PROGRAMMING_TOPICS.length) * 100)}
                  </span>
                  <span className="text-3xl font-black text-emerald-500/50 -ml-2">%</span>
                </div>
                
                {/* Bit Segments */}
                <div className="flex gap-1.5 mt-4">
                  {[...Array(12)].map((_, i) => {
                    const percentage = (completedTopics.length / PROGRAMMING_TOPICS.length) * 100;
                    const isActive = (i + 1) * (100 / 12) <= percentage;
                    return (
                      <div 
                        key={i}
                        className={`w-3 h-1.5 md:w-4 md:h-2 rounded-sm transition-all duration-700 delay-[${i * 50}ms] ${isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/5'}`}
                      />
                    );
                  })}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-dim)] mt-4">System Synchronization</span>
              </div>

              {/* Title and Secondary Stats */}
              <div className="flex-grow flex flex-col items-start md:items-start border-l border-[var(--color-card-border)] pl-8 md:pl-16 py-2">
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-[var(--color-text-main)] mb-6 font-premium uppercase leading-tight">
                  PROGRAMMING <br />
                  <span className="text-emerald-400">TRACK</span>
                </h2>
                
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/50 mb-1">Status Report</span>
                    <div className="flex items-center gap-3">
                       <span className="text-2xl font-black tracking-tighter text-[var(--color-text-main)]">{completedTopics.length} / {PROGRAMMING_TOPICS.length}</span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-dim)]">Modules Active</span>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-[var(--color-card-border)]" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/50 mb-1">Neural Load</span>
                    <span className="text-lg font-bold text-[var(--color-text-dim)] tracking-tight leading-none uppercase">Optimized</span>
                  </div>
                </div>
              </div>

              {/* Decorative Tech Grid */}
              <div className="absolute top-0 right-0 opacity-10 pointer-events-none hidden lg:block">
                 <div className="grid grid-cols-4 gap-2">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-emerald-500 rounded-full" />
                    ))}
                 </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto pb-24">
            {PROGRAMMING_TOPICS.map((topic) => {
              const isCompleted = completedTopics.includes(topic.id);
              return (
                <div key={topic.id} className={`glass overflow-hidden rounded-[2rem] border transition-all duration-500 ${isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-[var(--color-card-border)] hover:border-cyan-500/20'}`}>
                  <div className="p-8 flex flex-col md:flex-row items-center gap-8">

                    <div className="flex-grow text-center md:text-left transition-transform active:scale-95 cursor-pointer" onClick={() => handleTopicClick(topic)}>
                      <div className="flex items-center gap-4 justify-center md:justify-start mb-3 group/title">
                        <h4 className={`text-3xl font-black tracking-tight ${isCompleted ? 'text-emerald-400' : 'text-[var(--color-text-main)]'} group-hover/title:text-cyan-400 transition-colors`}>
                          {topic.title}
                        </h4>
                        <span className="text-xs text-[var(--color-text-dim)] opacity-0 group-hover/title:opacity-100 transition-opacity">→ EXPLORE MODULE</span>
                      </div>
                      <div className="flex flex-wrap justify-center md:justify-start gap-5">
                        {topic.subtasks.map((sub, idx) => (
                          <span key={idx} className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text-dim)] bg-[var(--color-card-bg)] px-4 py-1.5 rounded-xl border border-[var(--color-card-border)]">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button 
                         onClick={() => handleTopicClick(topic)}
                         className="btn-quantum px-12 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-white shadow-lg whitespace-nowrap"
                      >
                        Start Learning
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {currentPage === 'core-concepts' && (
        <div className="w-full max-w-7xl px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <header className="mb-20 px-4 md:px-0 text-center pt-10 flex flex-col items-center">
            <BrandingHeader />
            <button 
              onClick={goBack}
              className="btn-quantum px-8 py-3 rounded-full mb-12 text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 block mx-auto flex items-center justify-center gap-2"
            >
              <span className="text-lg">←</span> BACK TO TRACKS
            </button>
            
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-[var(--color-text-main)] mb-6 font-premium uppercase leading-tight">
              CORE <br />
              <span className="text-cyan-400">CONCEPTS</span>
            </h2>
            <p className="text-[var(--color-text-dim)] font-black uppercase tracking-[0.4em] text-xs">Essential CS Fundamentals Protocols</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto pb-24">
            {CORE_CONCEPTS_TOPICS.map((topic) => (
              <div 
                key={topic.id}
                onClick={() => handleTopicClick(topic)}
                className="glass p-16 rounded-[4rem] cursor-pointer hover:bg-slate-800/30 transition-all group relative overflow-hidden flex flex-col items-center border-white/5 hover:border-cyan-500/30 card-isometric text-center"
              >
                <div className="absolute top-10 right-10 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-52 h-52 mb-10 transform group-hover:-translate-y-4 transition-transform duration-500 drop-shadow-[0_20px_40px_rgba(34,211,238,0.4)]">
                   <img src={`/assets/icons/${topic.id}.png`} alt={topic.title} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" onError={(e) => {
                     (e.target as HTMLImageElement).src = '/assets/icons/core.png';
                   }} />
                </div>
                <h3 className="text-4xl font-black mb-6 tracking-tighter group-hover:text-cyan-400 transition-colors font-premium uppercase">{topic.title}</h3>
                <p className="text-slate-400 text-base leading-relaxed mb-10 font-medium">Deep dive into {topic.subtasks.join(', ')} protocols.</p>
                <span className="btn-quantum px-12 py-4 rounded-full text-sm font-black uppercase tracking-widest text-white shadow-xl opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                  Initialize Module
                </span>
                
                {/* Progress Mini Bar */}
                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/5 overflow-hidden">
                   <div 
                     className="h-full bg-cyan-500 transition-all duration-1000"
                     style={{ width: `${((completedHomeworks[topic.id]?.filter(v => v).length || 0) / topic.homework.length) * 100}%` }}
                   ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentPage === 'topic-detail' && selectedPrepTopic && (
        <div className="w-full max-w-5xl px-4 animate-in fade-in zoom-in-95 duration-500">
          <header className="mb-12 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left pt-10">
            <div className="flex flex-col items-start gap-4">
              <BrandingHeader />
              <button 
                onClick={goBack}
                className="btn-quantum px-12 py-4 rounded-full text-base font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-3 shadow-xl"
              >
                <span className="text-xl">←</span> BACK TO TOPICS
              </button>
            </div>
            <div className="flex items-center gap-4">
                 <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${completedTopics.includes(selectedPrepTopic.id) ? 'text-emerald-400' : 'text-[var(--color-text-dim)]'}`}>
                   {completedTopics.includes(selectedPrepTopic.id) ? 'Course Mastered ✓' : 'In Progress'}
                 </span>
            </div>
          </header>

          <div className="flex flex-col gap-10">
            {/* Top: Intro and Video */}
            <div className="space-y-8">
              <div className="glass p-10 rounded-[3rem] border-[var(--color-card-border)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-400"></div>
                <h2 className="text-5xl font-black mb-8 tracking-tighter font-premium uppercase text-[var(--color-text-main)]">{selectedPrepTopic.title}</h2>
                
                <div className="mb-10">
                  <h5 className="text-xs font-black text-emerald-500 uppercase tracking-[0.4em] mb-4">About this Topic</h5>
                  <p className="text-xl text-[var(--color-text-main)] opacity-90 leading-relaxed font-medium">
                    {selectedPrepTopic.introduction}
                  </p>
                </div>

                <div className="bg-[var(--color-card-bg)] rounded-3xl p-4 md:p-8 border border-[var(--color-card-border)] w-full aspect-video flex flex-col items-center">
                   <h4 className="text-xl font-black mb-6 uppercase tracking-tighter self-start ml-4 text-[var(--color-text-main)]">Video Tutorial</h4>
                   <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-[var(--color-card-border)]">
                      <iframe 
                        width="100%" 
                        height="100%" 
                        src={getEmbedUrl(selectedPrepTopic.videoLink)}
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowFullScreen
                      ></iframe>
                   </div>
                </div>
              </div>
            </div>

            {/* Bottom: Homework Checklist / MCQ Quiz */}
            <div className="space-y-6">
              <div className="glass p-10 rounded-[3rem] border-[var(--color-card-border)] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex flex-col">
                    <h5 className={`font-black uppercase tracking-[0.2em] text-[10px] mb-1 ${selectedPrepTopic.category === 'core' ? 'text-cyan-400' : 'text-emerald-400'}`}>
                      {selectedPrepTopic.category === 'core' ? 'Module Assessment' : 'Practice Tasks'}
                    </h5>
                    <h3 className="text-2xl font-black tracking-tighter text-[var(--color-text-main)]">
                      {selectedPrepTopic.category === 'core' ? 'Knowledge Check' : 'Topic Challenges'}
                    </h3>
                  </div>
                  {selectedPrepTopic.category !== 'core' && (
                    <div className="flex flex-col items-end">
                      <span className="text-[20px] font-black text-emerald-400 tracking-tighter">
                        {(completedHomeworks[selectedPrepTopic.id]?.filter(v => v).length || 0)} / {selectedPrepTopic.homework.length}
                      </span>
                      <span className="text-[8px] font-black text-[var(--color-text-dim)] uppercase tracking-widest">Tasks Completed</span>
                    </div>
                  )}
                </div>

                {selectedPrepTopic.category === 'core' ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mb-6 border border-cyan-500/20">
                       <span className="text-3xl">📊</span>
                    </div>
                    <h4 className="text-3xl font-black text-[var(--color-text-main)] mb-6 uppercase tracking-tighter">Ready for Assessment?</h4>
                    <p className="text-[var(--color-text-dim)] text-base font-medium leading-relaxed mb-10 max-w-sm">
                      Test your knowledge
                    </p>
                    <button 
                      onClick={startQuiz}
                      className="btn-quantum px-16 py-7 rounded-[2.5rem] inline-flex items-center gap-4 group shadow-[0_20px_40px_rgba(34,211,238,0.2)]"
                    >
                      <span className="text-xl font-black tracking-[0.2em] uppercase">Initialize Protocol</span>
                      <span className="group-hover:translate-x-2 transition-transform text-2xl">→</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedPrepTopic.homework.map((task, i) => {
                        const hwState = completedHomeworks[selectedPrepTopic.id] || [];
                        const isChecked = hwState[i] || false;
                        return (
                          <div 
                            key={i} 
                            onClick={() => toggleHomework(selectedPrepTopic.id, i)}
                            className={`p-6 rounded-3xl border cursor-pointer transition-all duration-300 flex items-start gap-4 ${isChecked ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[var(--color-card-bg)] border-[var(--color-card-border)] hover:border-cyan-500/20 hover:-translate-y-1'}`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center border-2 transition-all ${isChecked ? 'bg-emerald-500 border-emerald-400' : 'border-[var(--color-card-border)]'}`}>
                              {isChecked && <span className="text-white text-xs">✓</span>}
                            </div>
                            <div className="flex flex-col gap-2">
                              <span className={`text-xs font-black uppercase tracking-widest ${isChecked ? 'text-emerald-500/50' : 'text-[var(--color-text-dim)]'}`}>Challenge {i + 1}</span>
                              <p className={`text-xl font-semibold leading-relaxed ${isChecked ? 'text-emerald-400/80 line-through' : 'text-[var(--color-text-main)] opacity-80'}`}>
                                {task}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {completedHomeworks[selectedPrepTopic.id]?.filter(v => v).length === selectedPrepTopic.homework.length && (
                       <div className="mt-10 p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] text-center animate-in zoom-in-90 duration-500 relative overflow-hidden group">
                          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="text-4xl mb-3">🏆</div>
                          <p className="text-sm font-black text-emerald-400 uppercase tracking-[0.4em] mb-2">Mastery Achieved</p>
                          <p className="text-xs text-[var(--color-text-dim)] font-medium">You have conquered all challenges for {selectedPrepTopic.title}!</p>
                       </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {currentPage === 'quiz-session' && selectedPrepTopic && (
        <div className="w-full max-w-4xl px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <header className="mb-12 pt-10 px-4 md:px-0 flex justify-between items-start">
            <button 
              onClick={goBack}
              className="btn-quantum px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <span className="text-lg">←</span> BACK TO PORTAL
            </button>
            <BrandingHeader />
          </header>
          <div className="flex justify-between items-end border-b border-white/5 pb-8 mb-12">
            <div className="flex flex-col gap-2">
              <h4 className="text-5xl font-black tracking-tighter text-[var(--color-text-main)] uppercase font-premium">
                MODULE <span className="text-cyan-400">ASSESSMENT</span>
              </h4>
              <p className="text-[var(--color-text-dim)] font-black uppercase tracking-[0.4em] text-xs">Evaluating {selectedPrepTopic.title} Knowledge Curve</p>
            </div>
          </div>

          <div className="glass p-12 rounded-[3.5rem] border-white/5 relative overflow-hidden">
            <div className="scan-line opacity-10"></div>
            
            {loadingQuiz ? (
              <div className="text-center py-20 space-y-8">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-6 bg-cyan-500/10 rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xl font-black text-cyan-400 uppercase tracking-[0.3em]">Neural Synthesis</h4>
                  <p className="text-xs text-[var(--color-text-dim)] font-bold uppercase tracking-[0.4em] animate-pulse">Constructing Assessment Matrix for {selectedPrepTopic.title}...</p>
                </div>
              </div>
            ) : quizFinished ? (
              <div className="text-center py-10 space-y-12 animate-in fade-in zoom-in-95 duration-700">
                {quizScore >= activeQuiz!.length * 0.7 ? (
                  <div className="space-y-6">
                    <div className="text-8xl animate-bounce">🏆</div>
                    <h4 className="text-5xl font-black uppercase tracking-tighter text-emerald-500 font-premium">Congratulations!</h4>
                    <p className="text-[var(--color-text-main)] font-black uppercase tracking-[0.3em] text-sm opacity-80">Protocol Mastered Digitally</p>
                  </div>
                ) : (
                  <div className="w-40 h-40 rounded-full border-8 border-cyan-500/20 flex items-center justify-center mx-auto relative shadow-[0_0_50px_rgba(34,211,238,0.1)]">
                    <span className="text-5xl font-black text-[var(--color-text-main)] font-premium">{Math.round((quizScore / activeQuiz!.length) * 100)}%</span>
                    <div className="absolute inset-0 rounded-full border-8 border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.4)]" style={{ clipPath: `inset(0 0 0 ${100 - (quizScore / activeQuiz!.length) * 100}%)` }}></div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <h4 className="text-3xl font-black uppercase tracking-widest text-[var(--color-text-main)]">
                    {quizScore >= activeQuiz!.length * 0.7 ? `Score: ${quizScore}/${activeQuiz!.length}` : 'Protocol Incomplete'}
                  </h4>
                  <p className="text-[var(--color-text-dim)] text-sm font-bold leading-relaxed max-w-md mx-auto">
                    {quizScore >= activeQuiz!.length * 0.7 
                      ? "You have demonstrated exceptional understanding of this module's core architectures." 
                      : `Identified ${quizScore} out of ${activeQuiz!.length} correct data points. Further synchronization required.`}
                  </p>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-8">
                  <button 
                    onClick={startQuiz}
                    className="btn-quantum px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3"
                  >
                    Re-initialize Protocol
                  </button>
                  <button 
                    onClick={goBack}
                    className="btn-secondary px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest"
                  >
                    Exit Session
                  </button>
                </div>
              </div>
            ) : activeQuiz ? (
              <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                <div className="flex justify-between items-end border-b border-white/5 pb-8">
                  <div className="flex flex-col gap-3">
                     <span className="text-xs font-black text-cyan-500 tracking-[0.4em] uppercase flex items-center gap-4">
                       Data Segment {currentQuizIndex + 1}/{activeQuiz.length} 
                       <span className={`px-2.5 py-1 rounded-md text-[10px] ${currentQuizIndex < 3 ? 'bg-emerald-500/20 text-emerald-400' : currentQuizIndex < 7 ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'}`}>
                         {currentQuizIndex < 3 ? 'FUNDAMENTAL' : currentQuizIndex < 7 ? 'INTERMEDIATE' : 'ADVANCED'}
                       </span>
                     </span>
                     <h4 className="text-3xl md:text-5xl font-black text-[var(--color-text-main)] leading-tight max-w-3xl font-calibri italic">"{activeQuiz[currentQuizIndex].question}"</h4>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-black text-[var(--color-text-dim)] tracking-[0.4em] uppercase mb-1">Success Rate</span>
                    <span className="text-4xl font-black text-[var(--color-text-main)] tabular-nums font-premium">{quizScore}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {activeQuiz[currentQuizIndex].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={selectedAnswer !== null}
                      className={`w-full p-8 rounded-[2rem] text-left text-base font-bold transition-all border-2 relative overflow-hidden group/opt ${
                        selectedAnswer === null 
                          ? 'bg-[var(--color-card-bg)] border-[var(--color-card-border)] hover:border-cyan-500/30 hover:bg-slate-800/60' 
                          : idx === activeQuiz[currentQuizIndex].correctAnswer
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                            : idx === selectedAnswer
                              ? 'bg-red-500/10 border-red-500 text-red-400'
                              : 'bg-white/5 border-white/5 opacity-30 shadow-none scale-95'
                      }`}
                    >
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-6">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border transition-colors ${selectedAnswer === idx ? 'bg-current text-slate-950' : 'border-white/10 text-[var(--color-text-dim)]'}`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="tracking-tight text-[var(--color-text-main)] text-xl font-medium">{option}</span>
                        </div>
                        {selectedAnswer !== null && idx === activeQuiz[currentQuizIndex].correctAnswer && (
                          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg animate-in zoom-in-50">✓</div>
                        )}
                      </div>
                      {selectedAnswer === null && <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 translate-x-[-100%] group-hover/opt:translate-x-[100%] transition-transform duration-1000"></div>}
                    </button>
                  ))}
                </div>

                {selectedAnswer !== null && (
                  <div className="p-10 rounded-[2.5rem] glass border-[var(--color-card-border)] animate-in slide-in-from-bottom-8 duration-700 shadow-2xl relative overflow-hidden">
                     <div className={`absolute top-0 left-0 w-1.5 h-full ${selectedAnswer === activeQuiz[currentQuizIndex].correctAnswer ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                     <h5 className={`text-xs font-black uppercase tracking-[0.4em] mb-4 flex items-center gap-3 ${selectedAnswer === activeQuiz[currentQuizIndex].correctAnswer ? 'text-emerald-400' : 'text-red-400'}`}>
                       {selectedAnswer === activeQuiz[currentQuizIndex].correctAnswer ? 'SYNAPSE VERIFIED' : 'ANALYSIS COMPLETE: DISCREPANCY'}
                     </h5>
                     <p className="text-[var(--color-text-main)] text-2xl font-medium leading-relaxed mb-10 italic opacity-90 pl-4 font-calibri">
                       "{activeQuiz[currentQuizIndex].explanation}"
                     </p>
                     <button 
                       onClick={moveToNextQuizQuestion}
                       className="btn-quantum w-full py-8 rounded-2xl flex items-center justify-center gap-4 group shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
                     >
                       <span className="text-lg font-black tracking-[0.3em] uppercase">Advance to Next Segment</span>
                       <span className="group-hover:translate-x-3 transition-transform duration-300">→</span>
                     </button>
                  </div>
                )}

                <div className="px-4">
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/5 shadow-inner p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-1000 shadow-[0_0_20px_rgba(34,211,238,0.5)] rounded-full"
                      style={{ width: `${((currentQuizIndex + (selectedAnswer !== null ? 1 : 0)) / activeQuiz.length) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-3 px-2">
                     <span className="text-[10px] font-black text-[var(--color-text-dim)] uppercase tracking-widest">Protocol Evolution</span>
                     <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{Math.round(((currentQuizIndex + (selectedAnswer !== null ? 1 : 0)) / activeQuiz.length) * 100)}% Synchronized</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {currentPage === 'dashboard' && (
        <div className="w-full max-w-7xl">
          <header className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6 px-4 pt-10">
            <div className="text-left flex flex-col items-start gap-6">
              <BrandingHeader />
              <button 
                onClick={goBack}
                className="btn-quantum px-12 py-4 rounded-full mb-4 text-base font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-3 shadow-xl"
              >
                <span className="text-xl">←</span> BACK TO PORTAL
              </button>
              <span className="text-blue-500 font-black uppercase tracking-[0.3em] text-[10px] mb-2 block">Available Specializations</span>
              <h2 className="text-6xl font-black tracking-tighter text-[var(--color-text-main)]">Select Your Track</h2>
            </div>
            <div className="glass px-6 py-3 rounded-2xl flex items-center gap-4 border-white/5">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-black text-cyan-300 text-xs uppercase">
                {currentUser?.email?.slice(0, 2) || 'HX'}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-dim)]">Logged in as</p>
                <p className="text-sm font-black text-white truncate max-w-[160px]">{currentUser?.email || 'Guest'}</p>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
            {INTERVIEW_CATEGORIES.map((category) => (
              <div 
                key={category.id}
                onClick={() => startInterview(category)}
                className="glass p-14 rounded-[3.5rem] cursor-pointer hover:bg-slate-800/30 transition-all group relative overflow-hidden flex flex-col items-start border-white/5 hover:border-blue-500/30 card-isometric"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                
                <div className="w-44 h-44 mb-10 transform group-hover:-translate-y-4 transition-transform duration-500 drop-shadow-[0_20px_40px_rgba(14,165,233,0.4)]">
                   <img src={category.icon} alt={category.title} className="w-full h-full object-contain" />
                </div>
                
                <h3 className="text-4xl font-black mb-4 tracking-tighter group-hover:text-blue-400 transition-colors leading-none font-premium">
                  {category.title}
                </h3>
                <p className="text-slate-400 text-base leading-relaxed mb-10 flex-grow font-medium">
                  {category.description}
                </p>
                
                <div className="w-full flex justify-between items-center mt-auto">
                  <span className="bg-blue-500/10 text-cyan-400 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                    High Demand
                  </span>
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center group-hover:bg-blue-600 transition-all duration-300 shadow-inner group-hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                    <span className="text-3xl text-white">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentPage === 'interview' && selectedCategory && (
        <div className="w-full max-w-6xl animate-in fade-in duration-1000">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 px-8 gap-6 pt-10">
            <div className="text-center md:text-left flex flex-col items-center md:items-start gap-6">
              <BrandingHeader />
              <button 
                onClick={goBack}
                className="btn-quantum px-8 py-3.5 rounded-full mb-6 transition-all font-black uppercase tracking-[0.2em] text-[11px] flex items-center gap-3 group shadow-lg"
              >
                <span className="group-hover:-translate-x-1 transition-transform text-lg">←</span> EXIT SESSION
              </button>
              <h2 className="text-5xl font-black tracking-tighter text-[var(--color-text-main)] font-premium">
                {selectedCategory.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">SESSION</span>
              </h2>
            </div>
            
            <div className="glass px-8 py-5 rounded-3xl border-white/5 relative overflow-hidden min-w-[300px]">
              <div className="scan-line"></div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[var(--color-text-dim)] font-black uppercase tracking-[0.3em] text-[10px]">Neural Progress</span>
                <span className="font-black text-xl tabular-nums text-glow">
                  {currentQuestionIndex + 1}<span className="text-[var(--color-text-dim)] mx-1">/</span>10
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                  style={{ width: `${((currentQuestionIndex + 1) / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="glass p-12 md:p-20 rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden border-cyan-500/10 mb-10">
            {/* Console Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
               <div className="absolute top-10 left-10 w-20 h-20 border-l-2 border-t-2 border-cyan-500 rounded-tl-3xl"></div>
               <div className="absolute bottom-10 right-10 w-20 h-20 border-r-2 border-b-2 border-cyan-500 rounded-br-3xl"></div>
            </div>

            <div className="absolute top-0 right-0 p-10">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black tracking-[0.3em] text-red-500 uppercase animate-pulse">Live Uplink</span>
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>
              </div>
            </div>
            
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="glass-pill px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-12 border border-blue-500/20 text-cyan-400 shadow-[inset_0_0_20px_rgba(34,211,238,0.05)]">
                Synthetic Transmission
              </div>
              
              {loadingQuestions ? (
                <div className="flex flex-col items-center justify-center p-20">
                  <div className="relative w-24 h-24 mb-10">
                    <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-cyan-400 rounded-full animate-spin"></div>
                    <div className="absolute inset-4 border-4 border-b-blue-600 rounded-full animate-spin-slow"></div>
                  </div>
                  <p className="text-2xl font-black text-slate-400 animate-pulse uppercase tracking-[0.2em] font-premium">Optimizing Next Query...</p>
                </div>
              ) : currentQuestion ? (
                <>
                  {/* AI Interviewer Avatar */}
                  <div className="mb-12 relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-2 border-white/10 glass shadow-2xl">
                      <img 
                        src="/assets/interviewer.png" 
                        alt="AI Interviewer" 
                        className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                      />
                      {/* Scan Line Overlay specific to avatar */}
                      <div className="scan-line opacity-20"></div>
                    </div>
                    {/* Status Ring */}
                    <div className="absolute -bottom-2 right-1/2 translate-x-1/2 glass px-4 py-1 rounded-full border border-cyan-500/30 flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Online</span>
                    </div>
                  </div>

                  <div className="max-w-4xl px-4">
                    <h3 
                      className="text-2xl md:text-3xl lg:text-4xl font-black text-[var(--color-text-main)] leading-[1.3] tracking-tight mb-12 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                      style={{ fontFamily: 'var(--font-calibri)', wordSpacing: '0.3em' }}
                    >
                      "{currentQuestion.question}"
                    </h3>
                  </div>



                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-4xl items-center py-8">
                    <div className="flex flex-col items-center justify-center order-2 lg:order-1">
                       <button 
                        onClick={nextQuestion}
                        className="w-full btn-quantum py-7 rounded-[2.5rem] text-white font-black text-2xl shadow-[0_25px_50px_rgba(37,99,235,0.4)] group flex items-center justify-center gap-5 font-calibri tracking-tighter"
                      >
                        {currentQuestionIndex < 9 ? 'PROCESS & ADVANCE' : 'COMPLETE PROTOCOL'}
                        <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                      </button>
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--color-text-dim)] mt-6">Neural Link Optimization Active</p>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center order-1 lg:order-2 px-8">
                      <div className="relative group">
                        <div className={`absolute -inset-6 rounded-full blur-2xl transition-all duration-700 ${isRecording ? 'bg-red-500/30 opacity-100' : 'bg-cyan-500/10 opacity-0 group-hover:opacity-100'}`}></div>
                        <button 
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative z-10 ${
                            isRecording 
                            ? 'bg-red-600 shadow-[0_0_40px_rgba(239,68,68,0.6)] scale-110' 
                            : 'glass border border-white/10 hover:border-cyan-400/50 hover:bg-slate-800/50 hover:scale-105'
                          }`}
                        >
                          {isRecording && (
                            <div className="absolute inset-0 rounded-full animate-pulse-ring bg-red-500/40"></div>
                          )}
                          <span className="text-5xl filter grayscale-0">{isRecording ? '⏹️' : '🎤'}</span>
                        </button>
                      </div>
                      
                      <p className={`text-[11px] font-black uppercase tracking-[0.4em] mt-8 transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-400 text-glow'}`}>
                        {isRecording ? 'CAPTURE IN PROGRESS...' : 'ENGAGE NEURAL LINK'}
                      </p>

                      {isRecording && (
                        <div className="flex gap-2 h-8 items-end mt-6">
                          {[...Array(12)].map((_, i) => (
                            <div 
                              key={i} 
                              className="w-1.5 bg-gradient-to-t from-red-600 to-red-400 rounded-full transition-all duration-150" 
                              style={{ 
                                height: `${20 + Math.random() * 80}%`,
                                filter: 'blur(0.5px)'
                              }}
                            ></div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {lastEvaluation && (
                    <div className="mt-12 glass p-10 rounded-[2.5rem] max-w-4xl w-full border-blue-500/20 bg-blue-500/5 animate-in fade-in slide-in-from-bottom-8 duration-700 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                           <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse"></div>
                           <span className="text-sm font-black uppercase text-blue-400 tracking-[0.3em]">Evolutionary Feedback</span>
                        </div>
                        <span className="text-4xl font-black text-[var(--color-text-main)] tracking-tighter text-glow">{lastEvaluation.score}<span className="text-blue-500/50 text-xl">/10</span></span>
                      </div>
                      <p className="text-2xl font-medium text-[var(--color-text-main)] italic leading-relaxed text-left relative z-10 pl-6 border-l-4 border-blue-500/30 font-calibri">
                        "{lastEvaluation.feedback}"
                      </p>
                    </div>
                  )}

                  {(transcribedText || finalTranscript) && (
                    <div className="mt-12 w-full max-w-3xl animate-in slide-in-from-bottom-4 duration-1000">
                       <div className="glass p-8 rounded-[3rem] border border-cyan-500/10 bg-cyan-500/5 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/30"></div>
                          <p className="text-[10px] font-black uppercase text-cyan-400 mb-4 tracking-[0.4em] text-left">Real-time Stream Analysis</p>
                          <p className="text-xl md:text-2xl font-bold text-[var(--color-text-main)] leading-relaxed text-left font-premium">
                             {isRecording ? (transcribedText || "Decrypting audio...") : (finalTranscript || "Awaiting transmission...")}
                          </p>
                       </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-20 text-center glass rounded-full border-white/5">
                  <p className="text-2xl font-black text-[var(--color-text-dim)] uppercase tracking-[0.3em] font-premium">
                    Void State Detected<br/>
                    <span className="text-xs opacity-50 mt-4 block">Initialization required via backend gateway</span>
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <footer className="mt-8 px-12 text-[var(--color-text-dim)] text-[9px] font-black uppercase tracking-[0.4em] flex justify-between items-center opacity-40">
            <div className="flex items-center gap-4">
               <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
               <span>Neural Protocol v2.4</span>
            </div>
            <span>Encrypted Response Analysis Chain</span>
          </footer>
        </div>
      )}
    </div>
  );
};

export default App;
