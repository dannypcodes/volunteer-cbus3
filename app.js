import React, { useState, useMemo, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  onSnapshot, 
  increment,
  addDoc
} from 'firebase/firestore';
import { 
  Search, MapPin, PlusCircle, ArrowRight, ChevronRight, Menu, X,
  ArrowLeft, Send, Shield, Lock, Trash2, Check, Eye, Terminal, Activity, BarChart3, Users, MousePointer2,
  Heart, Coffee, Zap, AlertCircle
} from 'lucide-react';

// --- CONFIGURATION ---
// IMPORTANT: Replace the empty string below with your actual Firebase config object from your Firebase Console
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "volunteer-cbus-v1"; // You can name this anything for your project ID

const ADMIN_PASSCODE = "2026"; 
const OBFUSCATED_TERMINAL = "YWRtaW5kYW5ueTA5ODc="; 

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
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
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
    if (!user) return;
    
    const opportunitiesRef = collection(db, 'artifacts', appId, 'public', 'data', 'opportunities');
    const unsubOps = onSnapshot(opportunitiesRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOpportunities(data);
      setIsLoading(false);
    }, (error) => console.error(error));

    const statsRef = doc(db, 'artifacts', appId, 'public', 'data', 'siteMetrics', 'global');
    const unsubStats = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSiteStats(docSnap.data());
      }
    }, (error) => console.error(error));

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

  // Terminal Command Logic
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key.length > 1) return;
      const char = e.key.toLowerCase();
      const target = atob(OBFUSCATED_TERMINAL);
      bufferRef.current = (bufferRef.current + char).slice(-target.length);
      if (bufferRef.current === target) {
        if (isAdminAuthenticated) setView('admin');
        else setShowAdminLogin(true);
        bufferRef.current = ""; 
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminAuthenticated]);

  // View logic and sub-components would go here (keeping same UI from App.jsx)
  // [Rest of the UI logic remains the same as your App.jsx]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
        {/* Your UI Components from the previous step go here */}
        <div className="p-20 text-center">
            <VolunteerBlockV className="w-20 h-20 mx-auto mb-4" />
            <h1 className="text-4xl font-black italic">VOLUNTEERC <span className="text-red-600">BUS</span></h1>
            <p className="mt-4 text-gray-400">Successfully running in VS Code!</p>
            <button onClick={() => setView('browse')} className="mt-8 bg-red-600 px-8 py-3 font-bold uppercase italic">Enter Dashboard</button>
        </div>
    </div>
  );
}