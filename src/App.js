import React, { useState, useMemo, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  updateDoc,
  deleteDoc,
  onSnapshot, 
  increment,
  query 
} from 'firebase/firestore';
import { 
  Search, MapPin, PlusCircle, CheckCircle2, ArrowRight, ChevronRight, Menu, X,
  ArrowLeft, Send, ChevronLeft, Mail, Code2, GraduationCap, Sparkles, Shield, Image as ImageIcon,
  Lock, Trash2, Check, Eye, KeyRound, AlertCircle, Terminal, Activity, BarChart3, Users, MousePointer2
} from 'lucide-react';

// --- CONFIGURATION ---
// eslint-disable-next-line no-undef
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

let app, auth, db;
const hasValidFirebaseConfig = firebaseConfig.apiKey && firebaseConfig.projectId;

if (hasValidFirebaseConfig) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

// eslint-disable-next-line no-undef
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// SECURITY SETTINGS
const ADMIN_PASSCODE = "2026"; 
const TERMINAL_COMMAND = "admindanny0987";

// Branding Component
const VolunteerBlockV = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M15,20 L35,20 L50,65 L65,20 L85,20 L65,85 L35,85 Z" fill="#BB0000" />
  </svg>
);

const CATEGORIES = ["All", "Operations", "Animal Welfare", "Education", "Environment", "Health", "Youth"];
const ITEMS_PER_PAGE = 15;
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1559027615-cd943f1cc4ca?auto=format&fit=crop&q=80&w=800";

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [selectedOp, setSelectedOp] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [siteStats, setSiteStats] = useState({ totalViews: 0, totalAppClicks: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Security States
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passcodeAttempt, setPasscodeAttempt] = useState("");
  const [loginError, setLoginError] = useState(false);
  const bufferRef = useRef(""); 

  const [formData, setFormData] = useState({
    title: '', company: '', location: '', description: '', 
    category: 'Operations', image: '', externalUrl: '', schedule: 'Flexible'
  });

  // --- AUTHENTICATION ---
  useEffect(() => {
    if (!hasValidFirebaseConfig) {
      setUser({ anonymous: true }); // Mock user for offline mode
      setIsLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        // eslint-disable-next-line no-undef
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          // eslint-disable-next-line no-undef
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- DATA SYNC & ANALYTICS ---
  useEffect(() => {
    if (!user || !hasValidFirebaseConfig) {
      setIsLoading(false);
      return;
    }
    
    // 1. Sync Opportunities
    const opportunitiesRef = collection(db, 'artifacts', appId, 'public', 'data', 'opportunities');
    const unsubOps = onSnapshot(opportunitiesRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOpportunities(data);
      setIsLoading(false);
    });

    // 2. Sync Global Stats
    const statsRef = doc(db, 'artifacts', appId, 'public', 'data', 'siteMetrics', 'global');
    const unsubStats = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSiteStats(docSnap.data());
      }
    });

    // 3. Track Page View
    const trackView = async () => {
      try {
        await setDoc(statsRef, { totalViews: increment(1) }, { merge: true });
      } catch (e) { console.error("Stats error", e); }
    };
    trackView();

    return () => {
      unsubOps();
      unsubStats();
    };
  }, [user]);

  // Track specific engagement
  const trackEngagement = async (type, opId = null) => {
    if (!user || !hasValidFirebaseConfig) return;
    try {
      const globalStatsRef = doc(db, 'artifacts', appId, 'public', 'data', 'siteMetrics', 'global');
      if (type === 'app_click') {
        await updateDoc(globalStatsRef, { totalAppClicks: increment(1) });
      }
      if (opId) {
        const opRef = doc(db, 'artifacts', appId, 'public', 'data', 'opportunities', opId);
        await updateDoc(opRef, { clicks: increment(1) });
      }
    } catch (e) { console.error(e); }
  };

  // --- SECRET TERMINAL COMMAND LISTENER ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key.length > 1) return;

      const char = e.key.toLowerCase();
      bufferRef.current = (bufferRef.current + char).slice(-TERMINAL_COMMAND.length);

      if (bufferRef.current === TERMINAL_COMMAND) {
        handleAdminAccess();
        bufferRef.current = ""; 
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminAuthenticated]);

  const handleAdminAccess = () => {
    if (isAdminAuthenticated) {
      setView('admin');
    } else {
      setShowAdminLogin(true);
    }
  };

  const verifyPasscode = (e) => {
    e.preventDefault();
    if (passcodeAttempt === ADMIN_PASSCODE) {
      setIsAdminAuthenticated(true);
      setShowAdminLogin(false);
      setPasscodeAttempt("");
      setLoginError(false);
      setView('admin');
    } else {
      setLoginError(true);
      setPasscodeAttempt("");
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const formatUrl = (input) => {
    if (!input) return "#";
    const trimmed = input.trim();
    if (trimmed.includes('@') && !trimmed.includes('://')) return `mailto:${trimmed}`;
    if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
    return trimmed;
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!user || !hasValidFirebaseConfig) return;
    const finalUrl = formatUrl(formData.externalUrl);
    const finalImage = formData.image || DEFAULT_IMAGE;
    const newOp = { 
      ...formData, 
      externalUrl: finalUrl,
      image: finalImage,
      status: 'pending',
      clicks: 0,
      createdAt: Date.now(),
      authorId: user.uid
    };
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'opportunities'), newOp);
      setFormData({ title: '', company: '', location: '', description: '', category: 'Operations', image: '', externalUrl: '', schedule: 'Flexible' });
      setView('submitted-success');
    } catch (err) { console.error(err); }
  };

  const approveOpportunity = async (id) => {
    if (!isAdminAuthenticated || !hasValidFirebaseConfig) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'opportunities', id);
    await updateDoc(docRef, { status: 'approved' });
  };

  const deleteOpportunity = async (id) => {
    if (!isAdminAuthenticated || !hasValidFirebaseConfig) return;
    // eslint-disable-next-line no-restricted-globals
    if (confirm("Are you sure you want to permanently delete this opportunity?")) {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'opportunities', id);
      await deleteDoc(docRef);
      if (selectedOp && selectedOp.id === id) {
        setSelectedOp(null);
        setView('admin');
      }
    }
  };

  const publicOpportunities = useMemo(() => opportunities.filter(op => op.status === 'approved'), [opportunities]);
  const filteredOpportunities = useMemo(() => {
    return publicOpportunities.filter(op => {
      const matchesSearch = op.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            op.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'All' || op.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [publicOpportunities, searchTerm, activeCategory]);

  const pendingOpportunities = useMemo(() => opportunities.filter(op => op.status === 'pending'), [opportunities]);
  
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOpportunities.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOpportunities, currentPage]);

  const NavItems = () => (
    <>
      <button onClick={() => setView('home')} className={`text-xs uppercase tracking-widest font-bold ${view === 'home' ? 'text-red-600' : 'text-gray-400 hover:text-white'}`}>Home</button>
      <button onClick={() => setView('browse')} className={`text-xs uppercase tracking-widest font-bold ${view === 'browse' ? 'text-red-600' : 'text-gray-400 hover:text-white'}`}>Opportunities</button>
      <button onClick={() => setView('about')} className={`text-xs uppercase tracking-widest font-bold ${view === 'about' ? 'text-red-600' : 'text-gray-400 hover:text-white'}`}>About</button>
      <button 
        onClick={() => setView('post')}
        className="bg-red-600 text-white px-4 py-2 rounded-sm text-[10px] uppercase font-black hover:bg-red-700 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
      >
        <PlusCircle size={14} /> Post Opportunity
      </button>
    </>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <VolunteerBlockV className="w-16 h-16" />
          <span className="text-[10px] uppercase tracking-[0.5em] text-red-600 font-black">Connecting...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-red-600/30">
      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-6">
          <div className="bg-[#111] border border-white/10 p-8 max-sm:px-4 max-w-sm w-full space-y-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-600/10 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Terminal size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase italic tracking-tighter">Terminal Auth</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">System identified security string. Please verify identity.</p>
            </div>
            <form onSubmit={verifyPasscode} className="space-y-4">
              <input 
                autoFocus
                type="password"
                maxLength={4}
                placeholder="••••"
                className={`w-full bg-white/5 border ${loginError ? 'border-red-600' : 'border-white/10'} p-4 text-center text-2xl font-black tracking-[1em] outline-none focus:border-red-600 transition-all`}
                value={passcodeAttempt}
                onChange={(e) => setPasscodeAttempt(e.target.value.replace(/\D/g, ""))}
              />
              {loginError && (
                <p className="text-[10px] text-red-600 font-black uppercase tracking-widest flex items-center justify-center gap-1">
                  <AlertCircle size={12} /> Access Denied
                </p>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all">Execute</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-[#0a0a0a] border-b border-white/5 sticky top-0 z-50 py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VolunteerBlockV className="w-10 h-10" />
            <div className="flex flex-col cursor-pointer" onClick={() => setView('home')}>
                <h1 className="text-xl font-black tracking-tighter leading-none italic">
                VOLUNTEER<span className="text-red-600">CBUS</span>
                </h1>
                <span className="text-[8px] uppercase tracking-[0.2em] text-gray-500 font-bold">The Volunteer Finder</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8"><NavItems /></div>
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-[#0a0a0a] border-t border-white/5 p-6 flex flex-col gap-6 animate-in slide-in-from-top duration-300">
             <button onClick={() => { setView('home'); setIsMenuOpen(false); }} className="text-left text-xs uppercase font-black tracking-widest">Home</button>
             <button onClick={() => { setView('browse'); setIsMenuOpen(false); }} className="text-left text-xs uppercase font-black tracking-widest">Opportunities</button>
             <button onClick={() => { setView('about'); setIsMenuOpen(false); }} className="text-left text-xs uppercase font-black tracking-widest">About</button>
             <button onClick={() => { setView('post'); setIsMenuOpen(false); }} className="bg-red-600 text-white px-4 py-3 rounded-sm text-xs uppercase font-black text-center">Post Opportunity</button>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {view === 'home' && (
          <div className="min-h-[85vh] flex items-center relative overflow-visible">
            <div className="absolute right-[-10%] top-[-10%] bottom-[-10%] w-[75%] z-0 pointer-events-none opacity-90 lg:opacity-100">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent z-10"></div>
                <img 
                  src="https://images.pixels.com/images/artworkimages/mediumlarge/3/downtown-columbus-skyline-doral-chenoweth.jpg" 
                  alt="Background Skyline" 
                  className="w-full h-full object-cover transition-all duration-1000"
                  style={{ maskImage: 'radial-gradient(circle at center, black 0%, transparent 90%)', WebkitMaskImage: 'radial-gradient(circle at center, black 0%, transparent 90%)' }}
                />
            </div>

            <div className="max-w-3xl space-y-10 relative z-10 w-full lg:w-3/4">
              <div className="space-y-2">
                <h2 className="text-6xl md:text-[10rem] font-black italic tracking-tighter leading-[0.8] uppercase">VOLUNTEER</h2>
                <h2 className="text-6xl md:text-[10rem] font-black italic tracking-tighter leading-[0.8] uppercase text-red-600">CBUS.</h2>
              </div>
              <p className="text-xl md:text-3xl text-gray-200 font-medium italic max-w-xl leading-relaxed">
                Empowering the future of Columbus through real-world impact.
              </p>
              <button onClick={() => setView('browse')} className="bg-red-600 text-white px-12 py-6 text-sm uppercase font-black hover:bg-red-700 transition-all flex items-center gap-4 shadow-[0_15px_45px_rgba(220,38,38,0.5)] group">
                Explore Opportunities <ArrowRight className="group-hover:translate-x-2 transition-transform" size={20} />
              </button>
            </div>
          </div>
        )}

        {view === 'browse' && (
          <div className="space-y-12 pt-8">
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="relative w-full md:w-1/2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input 
                  type="text"
                  placeholder="SEARCH ROLES..."
                  className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 text-white uppercase font-bold tracking-widest text-sm outline-none focus:border-red-600 transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-3 overflow-x-auto w-full md:w-auto pb-4 md:pb-0">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-2 text-[10px] uppercase font-black tracking-tighter transition-all whitespace-nowrap ${
                      activeCategory === cat ? 'bg-red-600 text-white italic' : 'bg-white/5 text-gray-500 hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            {paginatedItems.length === 0 ? (
                <div className="text-center py-20 border border-white/5 bg-white/[0.02]">
                    <p className="text-gray-500 uppercase font-black tracking-widest italic">No opportunities found.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedItems.map(op => (
                    <div key={op.id} className="bg-[#111] border border-white/5 hover:border-red-600/50 transition-all group overflow-hidden">
                    <div className="relative h-56 transition-all duration-500 overflow-hidden">
                        <img src={op.image} alt={op.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute top-4 left-4">
                        <span className="bg-red-600 text-white text-[9px] font-black uppercase italic px-3 py-1">{op.category}</span>
                        </div>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-1">
                        <h3 className="font-black text-2xl uppercase italic tracking-tighter group-hover:text-red-500 transition-colors">{op.title}</h3>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{op.company}</p>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest"><MapPin size={12} /> {op.location}</span>
                            <button onClick={() => { 
                                trackEngagement('view', op.id);
                                setSelectedOp(op); 
                                setView('details'); 
                            }} className="text-red-600 font-black italic uppercase text-xs flex items-center gap-1 hover:gap-2 transition-all">
                                View <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            )}
          </div>
        )}

        {view === 'admin' && isAdminAuthenticated && (
          <div className="max-w-6xl mx-auto pt-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-white/10 pb-8">
                <div>
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter flex items-center gap-4">
                        <Lock className="text-red-600" size={32} /> Secure Admin Panel
                    </h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2 italic">Moderation & Engagement Tracking</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => { setIsAdminAuthenticated(false); setView('home'); }} className="px-6 py-2 border border-red-600/20 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Logout</button>
                  <button onClick={() => setView('home')} className="px-6 py-2 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Exit Dashboard</button>
                </div>
            </div>

            {/* Impact Metrics */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-[#111] border border-white/5 p-8 space-y-2">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-[10px] font-black uppercase tracking-widest">Site Traffic</span>
                  <Users size={16} />
                </div>
                <h4 className="text-4xl font-black italic">{siteStats.totalViews || 0}</h4>
                <p className="text-[8px] text-red-600 font-black uppercase tracking-widest">Total Unique Sessions</p>
              </div>
              <div className="bg-[#111] border border-white/5 p-8 space-y-2">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-[10px] font-black uppercase tracking-widest">Engagement Rate</span>
                  <MousePointer2 size={16} />
                </div>
                <h4 className="text-4xl font-black italic">
                  {siteStats.totalViews > 0 ? ((siteStats.totalAppClicks / siteStats.totalViews) * 100).toFixed(1) : 0}%
                </h4>
                <p className="text-[8px] text-red-600 font-black uppercase tracking-widest">Clicks Per Session</p>
              </div>
              <div className="bg-[#111] border border-white/5 p-8 space-y-2">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-[10px] font-black uppercase tracking-widest">Total Conversions</span>
                  <BarChart3 size={16} />
                </div>
                <h4 className="text-4xl font-black italic">{siteStats.totalAppClicks || 0}</h4>
                <p className="text-[8px] text-red-600 font-black uppercase tracking-widest">Total App Clicks</p>
              </div>
            </div>

            {/* Moderation Queue */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                    <h3 className="text-sm font-black uppercase tracking-widest italic">Moderation Queue ({pendingOpportunities.length})</h3>
                </div>
                <div className="space-y-4">
                    {pendingOpportunities.length === 0 ? (
                        <div className="p-12 text-center bg-white/[0.02] border border-dashed border-white/10 italic text-gray-500 uppercase font-black tracking-widest text-xs">
                            Queue is clean. Everything reviewed.
                        </div>
                    ) : (
                        pendingOpportunities.map(op => (
                            <div key={op.id} className="bg-[#111] border border-white/10 p-6 flex flex-col md:flex-row items-center gap-8 group">
                                <img src={op.image} className="w-32 h-20 object-cover group-hover:opacity-100 transition-opacity" />
                                <div className="flex-1 space-y-1">
                                    <h4 className="text-xl font-black italic uppercase tracking-tighter leading-none">{op.title}</h4>
                                    <p className="text-xs text-red-600 font-black uppercase">{op.company} • {op.category}</p>
                                    <p className="text-sm text-gray-400 line-clamp-1 italic">{op.description}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => { setSelectedOp(op); setView('details'); }} className="p-3 bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10" title="Preview"><Eye size={18} /></button>
                                    <button onClick={() => deleteOpportunity(op.id)} className="p-3 bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white transition-all border border-red-600/20" title="Delete"><Trash2 size={18} /></button>
                                    <button onClick={() => approveOpportunity(op.id)} className="p-3 bg-green-600/10 hover:bg-green-600 text-green-600 hover:text-white transition-all border border-green-600/20" title="Approve"><Check size={18} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Live Database */}
            <div className="space-y-6 pt-8 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                    <h3 className="text-sm font-black uppercase tracking-widest italic">Live Database ({publicOpportunities.length})</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {publicOpportunities.length === 0 ? (
                        <div className="p-12 text-center bg-white/[0.02] border border-dashed border-white/10 italic text-gray-500 uppercase font-black tracking-widest text-xs">
                            No active posts found in database.
                        </div>
                    ) : (
                        publicOpportunities.map(op => (
                            <div key={op.id} className="bg-[#111] border border-white/5 p-4 flex flex-col md:flex-row items-center gap-6 hover:border-white/20 transition-all">
                                <img src={op.image} className="w-16 h-16 object-cover opacity-50" />
                                <div className="flex-1">
                                    <h5 className="font-black uppercase italic tracking-tighter text-sm">{op.title}</h5>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">{op.company} • {op.clicks || 0} Views</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => { setSelectedOp(op); setView('details'); }} className="px-4 py-2 text-[10px] font-black uppercase border border-white/10 hover:bg-white hover:text-black transition-all">Preview</button>
                                    <button onClick={() => deleteOpportunity(op.id)} className="px-4 py-2 text-[10px] font-black uppercase border border-red-600/20 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center gap-2">
                                        <Trash2 size={12} /> Delete Role
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
          </div>
        )}

        {view === 'details' && selectedOp && (
          <div className="max-w-5xl mx-auto space-y-12 pt-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <button onClick={() => setView(selectedOp.status === 'pending' || isAdminAuthenticated ? 'admin' : 'browse')} className="flex items-center gap-3 text-gray-500 hover:text-red-600 font-black uppercase italic text-xs transition-colors">
              <ArrowLeft size={16} /> Back
            </button>
            <div className="grid lg:grid-cols-12 gap-12">
              <div className="lg:col-span-7 space-y-8">
                <div className="space-y-2">
                    <span className="text-red-600 font-black uppercase tracking-[0.3em] text-[10px] italic">Opportunity Profile</span>
                    <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">{selectedOp.title}</h2>
                    <p className="text-2xl text-gray-400 italic">By {selectedOp.company}</p>
                </div>
                <img src={selectedOp.image} className="w-full h-96 object-cover border border-white/10" />
                <div className="space-y-6">
                  <h4 className="text-xl font-black italic uppercase tracking-widest border-l-4 border-red-600 pl-4">The Mission</h4>
                  <p className="text-gray-400 leading-relaxed text-lg italic whitespace-pre-wrap">{selectedOp.description}</p>
                </div>
                {isAdminAuthenticated ? (
                     <div className="pt-10 flex gap-4">
                        {selectedOp.status === 'pending' && (
                            <button onClick={() => { approveOpportunity(selectedOp.id); setView('admin'); }} className="flex-1 py-6 bg-green-600 text-white font-black uppercase italic tracking-widest hover:bg-green-700 transition-all flex items-center justify-center gap-4"><Check /> Approve Post</button>
                        )}
                        <button onClick={() => { deleteOpportunity(selectedOp.id); }} className={`${selectedOp.status === 'approved' ? 'flex-1' : 'px-8'} py-6 bg-red-600/10 text-red-600 border border-red-600 font-black uppercase italic tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-4`}>
                            <Trash2 /> {selectedOp.status === 'approved' ? 'Delete Permanently' : ''}
                        </button>
                     </div>
                ) : selectedOp.status === 'approved' && (
                    <div className="pt-6">
                        <a 
                          href={selectedOp.externalUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          onClick={() => trackEngagement('app_click')}
                          className="inline-flex items-center gap-4 px-12 py-6 bg-red-600 text-white font-black uppercase italic tracking-widest hover:bg-red-700 transition-all shadow-[0_20px_50px_rgba(220,38,38,0.3)] group"
                        >
                            Apply to this role <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </a>
                    </div>
                )}
              </div>
              <div className="lg:col-span-5 space-y-8">
                <div className="bg-white/5 p-8 border border-white/10 space-y-8">
                    <div className="space-y-4">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-red-600">Quick Stats</h5>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Location</p>
                                <p className="font-bold italic text-sm">{selectedOp.location}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Availability</p>
                                <p className="font-bold italic text-sm">{selectedOp.schedule}</p>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'post' && (
          <div className="max-w-4xl mx-auto pt-8">
            <div className="bg-[#111] p-6 md:p-12 border border-white/10 space-y-10">
                <h2 className="text-4xl font-black italic uppercase tracking-tighter">SUBMIT AN <span className="text-red-600">OPENING.</span></h2>
                <form onSubmit={handlePostSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <input required placeholder="Role Title" type="text" className="w-full bg-white/5 border border-white/10 p-4 font-bold italic focus:border-red-600 outline-none" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                        <input required placeholder="Organization" type="text" className="w-full bg-white/5 border border-white/10 p-4 font-bold italic focus:border-red-600 outline-none" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <input required placeholder="City (e.g. Dublin, OH)" type="text" className="w-full bg-white/5 border border-white/10 p-4 font-bold italic focus:border-red-600 outline-none" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                        <select className="w-full bg-white/5 border border-white/10 p-4 font-bold italic focus:border-red-600 outline-none text-gray-400" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                            {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <input required placeholder="Application Link or Email" type="text" className="w-full bg-white/5 border border-white/10 p-4 font-bold italic focus:border-red-600 outline-none" value={formData.externalUrl} onChange={(e) => setFormData({...formData, externalUrl: e.target.value})} />
                    <input placeholder="Image Link (Optional)" type="text" className="w-full bg-white/5 border border-white/10 p-4 font-bold italic focus:border-red-600 outline-none" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} />
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic px-2">Role Details & Mission</label>
                        <textarea required placeholder="..." className="w-full bg-white/5 border border-white/10 p-4 font-bold italic focus:border-red-600 outline-none min-h-[200px] leading-relaxed" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                    </div>
                    <button type="submit" className="w-full py-5 bg-red-600 text-white font-black uppercase italic tracking-widest hover:bg-red-700 transition-all">Submit for Review</button>
                </form>
            </div>
          </div>
        )}

        {view === 'submitted-success' && (
            <div className="max-w-xl mx-auto text-center py-20 space-y-8">
                <div className="w-20 h-20 bg-red-600/10 text-red-600 rounded-full flex items-center justify-center mx-auto"><Shield size={40} /></div>
                <h2 className="text-4xl font-black italic uppercase">SUBMITTED.</h2>
                <p className="text-gray-400 italic font-medium leading-relaxed">Review in progress. Thank you for building our community.</p>
                <button onClick={() => setView('home')} className="bg-white text-black px-12 py-4 font-black uppercase italic tracking-widest hover:bg-gray-200 transition-all">Back to Home</button>
            </div>
        )}

        {view === 'about' && (
          <div className="max-w-4xl mx-auto pt-8 space-y-20 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
            <div className="space-y-8 text-center">
                <div className="inline-flex items-center gap-2 bg-red-600/10 border border-red-600/20 px-4 py-2 rounded-full text-red-600 text-[10px] font-black uppercase tracking-widest italic"><GraduationCap size={14} /> Local Student Project</div>
                <h2 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-tight">MADE BY A <span className="text-red-600">STUDENT.</span> FOR THE CITY.</h2>
                <p className="text-xl text-gray-400 italic max-w-2xl mx-auto">VolunteerCBUS is a central hub for finding meaningful ways to give back to the Columbus community.</p>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 bg-[#0a0a0a] py-10 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
                <VolunteerBlockV className="w-8 h-8 opacity-50" />
                <h1 className="text-lg font-black tracking-tighter italic opacity-50">VOLUNTEER<span className="text-red-600">CBUS</span></h1>
            </div>
            <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">© 2026 COLUMBUS OHIO</p>
        </div>
      </footer>
    </div>
  );
}
