import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { 
  Menu, X, User, Settings, LogOut, Calendar, Image, FileText, 
  Phone, Mail, MapPin, Award, Users, Clock, BookOpen, 
  ChevronRight, Upload, Trash2, Edit3, Eye, CheckCircle, XCircle, AlertCircle, Save, Home, Info
} from 'lucide-react';
import { db } from './services/db';
import { 
  SiteConfig, UserProfile, NewsItem, EventItem, GalleryItem, 
  DEFAULT_CONFIG 
} from './types';

// --- Contexts ---
const AppContext = createContext<{
  config: SiteConfig;
  setConfig: (c: SiteConfig) => void;
  user: UserProfile | null;
  setUser: (u: UserProfile | null) => void;
  refreshData: () => void;
}>({
  config: DEFAULT_CONFIG,
  setConfig: () => {},
  user: null,
  setUser: () => {},
  refreshData: () => {}
});

const useApp = () => useContext(AppContext);

// --- Animation Helper Components ---

// Reveal on Scroll Component
interface RevealProps {
  children?: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

const Reveal: React.FC<RevealProps> = ({ children, className = "", delay = 0, direction = 'up' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect(); // Only animate once
      }
    }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });
    
    if (ref.current) observer.observe(ref.current);
    
    return () => observer.disconnect();
  }, []);

  const getTransform = () => {
    switch(direction) {
      case 'up': return 'translate-y-12';
      case 'down': return '-translate-y-12';
      case 'left': return '-translate-x-12';
      case 'right': return 'translate-x-12';
      default: return 'translate-y-12';
    }
  };

  return (
    <div 
      ref={ref} 
      className={`transition-all duration-1000 cubic-bezier(0.17, 0.55, 0.55, 1) ${className} ${isVisible ? 'opacity-100 translate-y-0 translate-x-0' : `opacity-0 ${getTransform()}`}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// Number Count Up Component
const CountUp = ({ end, duration = 2000, suffix = "+" }: { end: number, duration?: number, suffix?: string }) => {
  const [count, setCount] = useState(0);
  const nodeRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated) {
        setHasAnimated(true);
        let startTime: number | null = null;
        const step = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          setCount(Math.floor(progress * end));
          if (progress < 1) {
            window.requestAnimationFrame(step);
          }
        };
        window.requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });

    if (nodeRef.current) observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return <span ref={nodeRef}>{count}{suffix}</span>;
};

// --- UI Helper Components ---

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

const Section: React.FC<SectionProps> = ({ children, className = "", id = "" }) => (
  <section id={id} className={`py-20 px-4 md:px-12 max-w-7xl mx-auto ${className}`}>
    {children}
  </section>
);

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = "", onClick, style }) => (
  <div onClick={onClick} className={`glass-card rounded-2xl p-6 ${className}`} style={style}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', onClick, className = "", type="button", disabled = false }: any) => {
  const { config } = useApp();
  const baseStyle = "px-6 py-2.5 rounded-lg font-medium transition-all duration-300 transform focus:outline-none shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  const hoverStyle = disabled ? "" : "hover:scale-105 hover:shadow-lg";
  
  const styles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: config.primaryColor, color: 'white' },
    accent: { backgroundColor: config.accentColor, color: 'white' },
    outline: { border: `2px solid ${config.primaryColor}`, color: config.primaryColor, backgroundColor: 'transparent' },
    danger: { backgroundColor: '#ef4444', color: 'white' },
    success: { backgroundColor: '#10b981', color: 'white' },
    glass: { backgroundColor: 'rgba(255,255,255,0.5)', color: '#1f2937' }
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${hoverStyle} ${className}`}
      style={styles[variant] || {}}
    >
      {children}
    </button>
  );
};

const FormInput = ({ label, ...props }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
    <input 
      className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white/50 backdrop-blur-sm transition-all hover:bg-white focus:bg-white"
      {...props}
    />
  </div>
);

const ImagePicker = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       if (file.size > 500 * 1024) {
         alert("Image size exceeds 500KB");
         return;
       }
       const reader = new FileReader();
       reader.onload = (ev) => onChange(ev.target?.result as string);
       reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-slate-200 rounded-lg bg-white/50 hover:bg-white transition-colors">
        {value ? (
            <div className="relative group">
                <img src={value} alt="Preview" className="w-32 h-32 object-cover rounded-lg shadow-sm transition-transform group-hover:scale-105" />
                <button onClick={() => onChange('')} type="button" className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"><X size={14} /></button>
            </div>
        ) : (
            <div className="w-32 h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300">
                <Image size={32} />
            </div>
        )}
        <div className="flex-1">
            <input type="file" accept="image/*" onChange={handleFile} className="text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer transition-colors" />
            <p className="text-xs text-slate-400 mt-2">Max size: 500KB. Formats: JPG, PNG.</p>
        </div>
      </div>
    </div>
  );
}

// --- Layout Components ---

const Navbar = () => {
  const { config, user, setUser } = useApp();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
      db.logout();
      setUser(null);
      navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Academics', path: '/academics' },
    { name: 'Admissions', path: '/admissions' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <div style={{ backgroundColor: config.primaryColor }} className="text-white text-xs md:text-sm py-2 px-4 md:px-12 flex justify-between items-center relative z-50 shadow-md">
        <div className="flex gap-4">
          <span className="flex items-center gap-1 hover:text-white/80 transition-colors cursor-pointer"><Phone size={14}/> {config.phone}</span>
          <span className="hidden md:flex items-center gap-1 hover:text-white/80 transition-colors cursor-pointer"><Mail size={14}/> {config.email}</span>
        </div>
        <div className="flex gap-4 items-center">
           <span className="hidden sm:inline opacity-75 text-xs">ID: {config.schoolId}</span>
           {user ? (
             <div className="flex items-center gap-4">
                 <Link to="/dashboard" className="font-bold hover:bg-white/20 px-3 py-1 rounded-full transition-all flex items-center gap-1">
                    <Settings size={14} /> Dashboard
                 </Link>
                 <button onClick={handleLogout} className="hover:text-red-200 transition-colors flex items-center gap-1">
                    <LogOut size={14} />
                 </button>
             </div>
           ) : (
             <Link to="/login" className="hover:bg-white/20 px-3 py-1 rounded-full transition-all flex items-center gap-1">
               <User size={14} /> Staff Login
             </Link>
           )}
        </div>
      </div>

      <nav className={`sticky top-0 z-40 transition-all duration-500 ${isScrolled ? 'glass-panel py-2 shadow-lg' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-12 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: config.primaryColor }}>
              {config.schoolName.charAt(0)}
            </div>
            <div className="flex flex-col">
              <h1 className={`font-serif font-bold text-lg leading-none transition-colors ${isScrolled ? 'text-slate-800' : 'text-slate-900'}`}>{config.schoolName}</h1>
              <p className="text-[10px] text-slate-500 tracking-widest uppercase group-hover:text-amber-600 transition-colors">Knowledge • Character</p>
            </div>
          </Link>

          <div className="hidden md:flex gap-8 items-center">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                className={`text-sm font-medium hover:text-amber-600 transition-all duration-300 relative group ${location.pathname === link.path ? 'text-amber-600' : 'text-slate-700'}`}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-amber-600 transition-all duration-300 group-hover:w-full ${location.pathname === link.path ? 'w-full' : 'w-0'}`}></span>
              </Link>
            ))}
            <Link to="/admissions">
              <button style={{ backgroundColor: config.accentColor }} className="text-white px-5 py-2 rounded-full text-sm shadow-lg hover:shadow-amber-500/30 hover:shadow-xl transition-all hover:-translate-y-0.5 font-bold active:scale-95">
                Apply Now
              </button>
            </Link>
          </div>

          <button className="md:hidden text-slate-800 p-2 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu with Slide Down Animation */}
        <div className={`md:hidden glass-panel absolute top-full left-0 w-full overflow-hidden transition-all duration-500 ease-in-out shadow-xl ${mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-6 flex flex-col gap-2">
              {navLinks.map((link, idx) => (
                <Link 
                  key={link.name} 
                  to={link.path} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-800 font-medium text-lg border-b border-slate-200/50 pb-3 pt-2 flex justify-between items-center hover:pl-2 transition-all"
                  style={{ transitionDelay: `${idx * 50}ms` }}
                >
                  {link.name} <ChevronRight size={16} className="text-slate-400" />
                </Link>
              ))}
               <Link to="/admissions" className="mt-4 w-full" onClick={() => setMobileMenuOpen(false)}>
                  <button style={{ backgroundColor: config.accentColor }} className="w-full text-white py-3 rounded-lg font-bold shadow-md">
                    Apply Now
                  </button>
               </Link>
            </div>
        </div>
      </nav>
    </>
  );
};

const Footer = () => {
  const { config } = useApp();
  return (
    <footer style={{ backgroundColor: config.primaryColor }} className="text-white pt-16 pb-8 mt-auto relative overflow-hidden">
       {/* Decorative background element */}
       <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
       <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500 opacity-5 rounded-full -ml-48 -mb-48 blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 relative z-10">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white text-slate-900 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
               {config.schoolName.charAt(0)}
            </div>
            <h2 className="font-serif text-xl font-bold leading-tight">{config.schoolName}</h2>
          </div>
          <p className="text-white/70 text-sm leading-relaxed">
            Dedicated to fostering academic excellence and character development in every student since 1978.
          </p>
        </div>
        <div>
          <h3 className="font-bold mb-6 text-amber-400 uppercase text-xs tracking-widest">Quick Links</h3>
          <ul className="space-y-3 text-sm text-white/80">
            <li><Link to="/about" className="hover:text-white hover:translate-x-1 inline-block transition-transform">About Us</Link></li>
            <li><Link to="/academics" className="hover:text-white hover:translate-x-1 inline-block transition-transform">Academics</Link></li>
            <li><Link to="/gallery" className="hover:text-white hover:translate-x-1 inline-block transition-transform">Gallery</Link></li>
            <li><Link to="/login" className="hover:text-white hover:translate-x-1 inline-block transition-transform">Staff Portal</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold mb-6 text-amber-400 uppercase text-xs tracking-widest">Contact Info</h3>
          <ul className="space-y-4 text-sm text-white/80">
            <li className="flex items-start gap-3 group">
                <div className="bg-white/10 p-2 rounded-full group-hover:bg-amber-500 transition-colors"><MapPin size={14}/></div> 
                <span className="mt-1">{config.address}</span>
            </li>
            <li className="flex items-center gap-3 group">
                <div className="bg-white/10 p-2 rounded-full group-hover:bg-amber-500 transition-colors"><Phone size={14}/></div>
                {config.phone}
            </li>
            <li className="flex items-center gap-3 group">
                <div className="bg-white/10 p-2 rounded-full group-hover:bg-amber-500 transition-colors"><Mail size={14}/></div> 
                {config.email}
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold mb-6 text-amber-400 uppercase text-xs tracking-widest">Newsletter</h3>
          <div className="flex shadow-lg rounded-lg overflow-hidden">
            <input type="email" placeholder="Your email" className="bg-white/10 backdrop-blur-sm px-4 py-3 text-sm w-full focus:outline-none text-white placeholder-white/50 border-none" />
            <button className="bg-amber-500 text-white px-4 py-3 font-bold hover:bg-amber-600 transition-colors"><ChevronRight /></button>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 pt-8 text-center text-xs text-white/40 relative z-10">
        <p>&copy; {new Date().getFullYear()} {config.schoolName}. ID: {config.schoolId}. All rights reserved.</p>
        <p className="mt-2 hover:text-white transition-colors">Developed by Rohit</p>
      </div>
    </footer>
  );
};

// --- Public Pages ---

const HomePage = () => {
  const { config } = useApp();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  useEffect(() => {
    db.getNews().then(n => setNews(n.filter(x => x.active)));
    db.getEvents().then(e => setEvents(e.slice(0, 3)));
    db.getGallery().then(g => setGallery(g.slice(0, 4)));
  }, [config]);

  return (
    <div className="w-full overflow-hidden">
      {/* Hero Section */}
      <div className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={config.heroImage} 
            alt="School Campus" 
            className="w-full h-full object-cover transition-transform duration-[20s] ease-in-out hover:scale-110"
          />
          <div className="absolute inset-0 bg-slate-900/40 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
        </div>
        <div className="relative z-10 text-center text-white px-4 max-w-5xl">
          <Reveal direction="up">
             <div className="mb-4 inline-block px-4 py-1 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm text-xs font-bold tracking-widest uppercase">
                Welcome to {config.schoolName}
             </div>
          </Reveal>
          <Reveal direction="up" delay={100}>
            <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 drop-shadow-2xl leading-tight">{config.heroTitle}</h1>
          </Reveal>
          <Reveal direction="up" delay={200}>
            <p className="text-xl md:text-2xl font-light tracking-wide mb-10 text-white/90 max-w-3xl mx-auto">{config.heroSubtitle}</p>
          </Reveal>
          <Reveal direction="up" delay={300}>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link to="/admissions">
                <button style={{ backgroundColor: config.accentColor }} className="px-8 py-4 rounded-full text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all w-full sm:w-auto active:scale-95">
                  Admissions Open 2024
                </button>
              </Link>
              <Link to="/about">
                <button className="px-8 py-4 rounded-full border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-slate-900 transition-all w-full sm:w-auto shadow-lg hover:shadow-xl active:scale-95">
                  Discover Our Legacy
                </button>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>

      {/* News Ticker */}
      {config.features.showNews && news.length > 0 && (
        <div className="bg-slate-900 text-white py-3 overflow-hidden flex items-center relative z-20 shadow-2xl border-b border-slate-800">
          <div className="bg-amber-500 text-xs font-bold px-4 py-1.5 ml-4 rounded uppercase tracking-wider shrink-0 z-10 shadow-lg">Latest Updates</div>
          <div className="whitespace-nowrap animate-[marquee_25s_linear_infinite] flex gap-16 px-8 w-full hover:pause">
            {news.map((n, i) => (
              <span key={i} className="text-sm flex items-center gap-2 cursor-pointer hover:text-amber-300 transition-colors">
                <span className="text-amber-400 text-xl">•</span> {n.title} <span className="text-slate-400 text-xs border border-slate-700 px-1 rounded">({n.date})</span>
              </span>
            ))}
          </div>
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .hover\\:pause:hover {
                animation-play-state: paused;
            }
          `}</style>
        </div>
      )}

      {/* Stats Section */}
      <div className="relative z-10 -mt-24 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'Students', value: config.stats.students, icon: Users },
            { label: 'Teachers', value: config.stats.teachers, icon: BookOpen },
            { label: 'Awards', value: config.stats.awards, icon: Award },
            { label: 'Years', value: config.stats.years, icon: Clock },
          ].map((stat, i) => (
            <Reveal key={i} delay={i * 100} className="h-full">
              <GlassCard className="h-full flex flex-col items-center justify-center text-center py-8 bg-white/90 backdrop-blur-xl border-t-4 shadow-xl" style={{ borderTopColor: i % 2 === 0 ? config.primaryColor : config.accentColor }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 text-white shadow-lg transform transition-transform hover:scale-110 hover:rotate-6" style={{ backgroundColor: i % 2 === 0 ? config.primaryColor : config.accentColor }}>
                  <stat.icon size={28} />
                </div>
                <h3 className="text-4xl md:text-5xl font-bold text-slate-800 mb-2">
                  <CountUp end={stat.value} />
                </h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Principal's Desk */}
      <Section className="mt-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1">
            <Reveal direction="left">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px w-12 bg-slate-400"></div>
                <h4 style={{ color: config.accentColor }} className="font-bold uppercase tracking-widest text-sm">From the Principal's Desk</h4>
              </div>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 mb-8 leading-tight">Nurturing Minds, <br/>Building Character.</h2>
              <div className="bg-white p-8 rounded-tr-3xl rounded-bl-3xl shadow-xl border-l-4 relative hover:shadow-2xl transition-shadow" style={{ borderLeftColor: config.primaryColor }}>
                <span className="absolute -top-6 -left-2 text-8xl text-slate-100 font-serif z-0 select-none">"</span>
                <p className="relative z-10 italic text-lg leading-relaxed text-slate-600 mb-6">{config.principalMessage}</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-xl font-serif font-bold text-slate-500">
                      {config.principalName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-lg">{config.principalName}</p>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Principal, {config.schoolName}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
          <div className="order-1 md:order-2 relative group">
            <Reveal direction="right">
              <div className="absolute inset-0 bg-amber-200 rounded-2xl transform rotate-3 translate-x-4 translate-y-4 transition-transform duration-500 group-hover:rotate-6 group-hover:translate-x-6"></div>
              <div className="absolute inset-0 bg-slate-800 rounded-2xl transform -rotate-2 -translate-x-2 -translate-y-2 transition-transform duration-500 group-hover:-rotate-3 group-hover:-translate-x-4"></div>
              <img src={config.principalPhoto} alt="Principal" className="relative rounded-2xl shadow-2xl w-full object-cover aspect-[4/3] z-10 transition-transform duration-500 group-hover:scale-[1.02]" />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Upcoming Events */}
      {config.features.showEvents && (
        <div className="bg-slate-50 py-20 relative overflow-hidden">
           {/* Decorative blob */}
           <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
           <div className="absolute -left-64 top-0 w-[500px] h-[500px] bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
           <div className="absolute -right-64 bottom-0 w-[500px] h-[500px] bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
           
          <div className="max-w-7xl mx-auto px-4 md:px-12 relative z-10">
            <Reveal>
              <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                <div>
                  <h4 style={{ color: config.accentColor }} className="font-bold uppercase tracking-widest text-sm mb-2">Calendar</h4>
                  <h2 className="font-serif text-4xl font-bold text-slate-900">Upcoming Events</h2>
                </div>
                <Link to="/events" className="hidden md:flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium group transition-colors">
                  View All Events <div className="bg-slate-200 p-1 rounded-full group-hover:bg-slate-300 transition-colors group-hover:translate-x-1"><ChevronRight size={16}/></div>
                </Link>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-8">
              {events.length > 0 ? events.map((evt, i) => (
                <Reveal key={evt.id} delay={i * 150}>
                  <GlassCard className="bg-white hover:bg-white/90 border-none h-full flex flex-col group cursor-pointer transition-all hover:-translate-y-2 hover:shadow-2xl">
                    <div className="flex gap-4 items-start">
                      <div className="bg-slate-100 rounded-xl p-3 text-center min-w-[70px] shrink-0 group-hover:bg-amber-50 transition-colors">
                        <span className="block text-xs font-bold text-slate-400 uppercase">{new Date(evt.date).toLocaleString('default', { month: 'short' })}</span>
                        <span style={{ color: config.primaryColor }} className="block text-2xl font-bold">{new Date(evt.date).getDate()}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg mb-2 leading-tight group-hover:text-amber-600 transition-colors">{evt.title}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mb-3 font-medium uppercase tracking-wide">
                            <MapPin size={12}/> {evt.location}
                        </p>
                        <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">{evt.description}</p>
                      </div>
                    </div>
                  </GlassCard>
                </Reveal>
              )) : (
                  <div className="col-span-3 text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">No upcoming events scheduled.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gallery Preview */}
      {config.features.showGallery && (
        <Section>
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl font-bold text-slate-900 mb-4">Life at {config.schoolName.split(' ')[0]}</h2>
              <div className="w-24 h-1 bg-amber-400 mx-auto rounded-full mb-6"></div>
              <p className="text-slate-600 max-w-2xl mx-auto text-lg">A glimpse into the vibrant academic and co-curricular environment of our campus.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-96 md:h-[500px]">
            {gallery.map((img, idx) => (
              <div key={img.id} className={`relative group overflow-hidden rounded-2xl shadow-lg ${idx === 0 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'}`}>
                <img src={img.url} alt={img.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6 translate-y-4 group-hover:translate-y-0">
                  <span className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1 translate-y-2 group-hover:translate-y-0 transition-transform duration-500 delay-75">{img.category}</span>
                  <h3 className="text-white font-bold text-lg leading-tight translate-y-2 group-hover:translate-y-0 transition-transform duration-500 delay-100">{img.title}</h3>
                </div>
              </div>
            ))}
          </div>
          <Reveal delay={200}>
            <div className="text-center mt-12">
              <Link to="/gallery">
                <Button variant="outline" className="px-10 py-3 rounded-full hover:bg-slate-900 hover:text-white hover:border-slate-900">View Full Gallery</Button>
              </Link>
            </div>
          </Reveal>
        </Section>
      )}
    </div>
  );
};

const AboutPage = () => {
    const { config } = useApp();
    return (
        <div className="pt-12">
            <Section>
                <Reveal>
                  <div className="max-w-4xl mx-auto text-center mb-16">
                      <h1 className="font-serif text-5xl font-bold text-slate-900 mb-6">Our Legacy</h1>
                      <div className="h-1 w-24 bg-amber-500 mx-auto mb-8"></div>
                      <p className="text-xl text-slate-600 leading-relaxed">
                          Founded in 1978, {config.schoolName} has been a beacon of knowledge in New Delhi. 
                          Starting with just 50 students, we have grown into a premier institution with over 
                          {config.stats.students} scholars, dedicated to holistic development.
                      </p>
                  </div>
                </Reveal>
                
                <div className="grid md:grid-cols-3 gap-8 mb-20">
                    {[
                        { title: "Our Mission", text: "To provide a safe, secure and conducive environment in which each child can dare to dream and strive for excellence.", icon: Award },
                        { title: "Our Vision", text: "To create global citizens who are academically sound, culturally rooted, and socially responsible.", icon: Eye },
                        { title: "Core Values", text: "Integrity, Empathy, Discipline, and Innovation drive every aspect of our curriculum.", icon: CheckCircle }
                    ].map((item, i) => (
                      <Reveal key={i} delay={i * 150}>
                        <GlassCard className="bg-white/50 p-8 border-t-4 hover:-translate-y-2 transition-transform h-full" style={{ borderTopColor: i===1 ? config.accentColor : config.primaryColor }}>
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-6 text-slate-700">
                                <item.icon />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-4">{item.title}</h3>
                            <p className="text-slate-600 leading-relaxed">{item.text}</p>
                        </GlassCard>
                      </Reveal>
                    ))}
                </div>
            </Section>
        </div>
    );
};

const AcademicsPage = () => {
    const { config } = useApp();
    const wings = [
        { name: "Primary Wing", classes: "Class I - V", desc: "Focus on foundational literacy, numeracy, and creative play. We encourage curiosity through activity-based learning.", img: "https://picsum.photos/400/300?random=10" },
        { name: "Middle Wing", classes: "Class VI - VIII", desc: "Introduction to specialized subjects, experiential learning, and critical thinking. Emphasis on project-based assessments.", img: "https://picsum.photos/400/300?random=11" },
        { name: "Senior Wing", classes: "Class IX - XII", desc: "Rigorous academic preparation for boards and competitive exams in Science, Commerce, and Humanities streams.", img: "https://picsum.photos/400/300?random=12" }
    ];

    return (
        <div className="pt-12">
            <Section>
                 <Reveal>
                   <h1 className="font-serif text-4xl font-bold text-slate-900 mb-12 text-center">Academic Excellence</h1>
                 </Reveal>
                 <div className="grid gap-12">
                     {wings.map((wing, i) => (
                       <Reveal key={i} direction={i % 2 === 0 ? 'left' : 'right'}>
                         <div className={`flex flex-col ${i % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 items-center bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300`}>
                             <div className="flex-1">
                                 <h2 style={{ color: config.primaryColor }} className="text-3xl font-bold mb-2">{wing.name}</h2>
                                 <span className="inline-block bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full mb-4">{wing.classes}</span>
                                 <p className="text-slate-600 mb-6 leading-relaxed text-lg">{wing.desc}</p>
                                 <button className="flex items-center gap-2 text-amber-600 font-bold text-sm hover:underline hover:translate-x-2 transition-transform">
                                     <FileText size={16} /> Download Syllabus
                                 </button>
                             </div>
                             <div className="w-full md:w-2/5 h-64 bg-slate-200 rounded-xl overflow-hidden shadow-md">
                                 <img src={wing.img} alt={wing.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                             </div>
                         </div>
                       </Reveal>
                     ))}
                 </div>
            </Section>
        </div>
    );
};

const AdmissionsPage = () => {
    const { config } = useApp();
    return (
        <div className="pt-12">
            <Section>
                <div className="grid md:grid-cols-2 gap-16">
                    <div>
                        <Reveal>
                          <h1 className="font-serif text-4xl font-bold text-slate-900 mb-6">Join Our Family</h1>
                          <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                              We welcome students who are eager to learn and grow. Our admission process is transparent, merit-based, and designed to be stress-free for both parents and students.
                          </p>
                        </Reveal>
                        
                        <div className="space-y-8 relative mt-12">
                            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                            {[
                                { step: 1, title: "Registration", desc: "Fill out the online form or visit the school office." },
                                { step: 2, title: "Assessment", desc: "Written interaction for Class I onwards. Informal interaction for Nursery." },
                                { step: 3, title: "Document Verification", desc: "Submit birth certificate, residence proof, and past report cards." },
                                { step: 4, title: "Fee Submission", desc: "Secure the seat by paying admission fees." }
                            ].map((s, i) => (
                              <Reveal key={s.step} delay={i * 100} direction="right">
                                <div className="flex gap-6 relative bg-slate-50/50 p-4 rounded-xl hover:bg-white hover:shadow-md transition-all">
                                    <div style={{ backgroundColor: config.primaryColor }} className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white font-bold z-10 shadow-md ring-4 ring-white">
                                        {s.step}
                                    </div>
                                    <div className="pb-2">
                                        <h3 className="font-bold text-slate-800 text-lg">{s.title}</h3>
                                        <p className="text-slate-500 text-sm">{s.desc}</p>
                                    </div>
                                </div>
                              </Reveal>
                            ))}
                        </div>
                    </div>
                    <div>
                      <Reveal delay={300}>
                        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 sticky top-24">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><User size={20}/> Admission Enquiry</h3>
                            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Enquiry Submitted!"); }}>
                                <FormInput label="Parent's Name" placeholder="John Doe" required />
                                <FormInput label="Child's Name" placeholder="Jane Doe" required />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput label="Class" placeholder="Class V" required />
                                    <FormInput label="Phone" placeholder="+91 ..." required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                                    <textarea placeholder="Any specific queries?" rows={3} className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white/50 transition-all focus:bg-white"></textarea>
                                </div>
                                <Button type="submit" className="w-full py-3 shadow-lg hover:shadow-amber-500/20">Submit Enquiry</Button>
                            </form>
                        </div>
                      </Reveal>
                    </div>
                </div>
            </Section>
        </div>
    );
};

const GalleryPage = () => {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [selectedImg, setSelectedImg] = useState<GalleryItem | null>(null);
    const { config } = useApp();

    useEffect(() => {
        db.getGallery().then(setItems);
    }, []);

    return (
        <div className="pt-12 min-h-screen">
            <Section>
                <Reveal>
                  <h1 className="font-serif text-4xl font-bold text-slate-900 mb-12 text-center">Photo Gallery</h1>
                </Reveal>
                {items.length === 0 ? (
                    <p className="text-center text-slate-500">No images in gallery.</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {items.map((item, i) => (
                          <Reveal key={item.id} delay={i * 50} className="h-full">
                            <div onClick={() => setSelectedImg(item)} className="cursor-pointer group relative aspect-square rounded-xl overflow-hidden shadow-md bg-slate-200 h-full">
                                <img src={item.url} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                    <Eye className="text-white transform scale-50 group-hover:scale-100 transition-transform duration-300" size={32} />
                                </div>
                                <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-300">
                                     <p className="text-white text-sm font-bold truncate text-center">{item.title}</p>
                                </div>
                            </div>
                          </Reveal>
                        ))}
                    </div>
                )}
            </Section>

            {/* Lightbox */}
            {selectedImg && (
                <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 animate-fade-in backdrop-blur-xl" onClick={() => setSelectedImg(null)}>
                    <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full"><X size={24}/></button>
                    <div className="max-w-5xl w-full max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <img src={selectedImg.url} alt={selectedImg.title} className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain bg-black animate-scale-in" />
                        <div className="text-white text-center mt-6 bg-white/10 px-8 py-4 rounded-full backdrop-blur-md border border-white/10">
                            <h3 className="text-xl font-bold">{selectedImg.title}</h3>
                            <p className="text-xs text-amber-400 font-bold uppercase tracking-widest mt-1">{selectedImg.category}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ContactPage = () => {
    const { config } = useApp();
    return (
        <div className="pt-12">
             <Section>
                 <div className="grid md:grid-cols-2 gap-12">
                     <div>
                         <Reveal>
                           <h1 className="font-serif text-4xl font-bold text-slate-900 mb-8">Get In Touch</h1>
                           <p className="text-slate-600 mb-8 text-lg">Have questions? We'd love to hear from you. Reach out to us via email, phone, or visit our campus.</p>
                         </Reveal>
                         <div className="space-y-6">
                           {[
                             { icon: MapPin, title: "Visit Us", text: config.address, color: "bg-amber-100 text-amber-600" },
                             { icon: Phone, title: "Call Us", text: config.phone, color: "bg-blue-100 text-blue-600" },
                             { icon: Mail, title: "Email Us", text: config.email, color: "bg-green-100 text-green-600" }
                           ].map((item, i) => (
                             <Reveal key={i} delay={i * 100} direction="left">
                               <GlassCard className="flex items-center gap-4 p-6 hover:bg-white transition-colors cursor-default group">
                                   <div className={`${item.color} p-3 rounded-full group-hover:scale-110 transition-transform`}><item.icon /></div>
                                   <div>
                                       <h3 className="font-bold text-slate-800">{item.title}</h3>
                                       <p className="text-slate-600">{item.text}</p>
                                   </div>
                               </GlassCard>
                             </Reveal>
                           ))}
                         </div>
                     </div>
                     <div>
                       <Reveal delay={200} direction="up">
                         <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                             <h3 className="text-xl font-bold mb-6">Send a Message</h3>
                             <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Message Sent"); }}>
                                 <div className="grid grid-cols-2 gap-4">
                                    <FormInput label="Name" placeholder="Your Name" required />
                                    <FormInput label="Phone" placeholder="Your Phone" required />
                                 </div>
                                 <FormInput label="Email" type="email" placeholder="Your Email" required />
                                 <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                                    <textarea placeholder="How can we help you?" rows={5} className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white/50 transition-all focus:bg-white"></textarea>
                                </div>
                                 <Button type="submit" className="w-full py-3">Send Message</Button>
                             </form>
                         </div>
                       </Reveal>
                     </div>
                 </div>
             </Section>
        </div>
    );
};

// --- Authentication & Dashboard ---

const LoginPage = () => {
  const { setUser } = useApp();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({...formData, [e.target.type === 'text' ? 'name' : e.target.type]: e.target.value});
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let user;
      if (isRegistering) {
        user = await db.register(formData.email, formData.password, formData.name);
      } else {
        user = await db.login(formData.email, formData.password);
      }
      setUser(user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4 bg-slate-100 relative overflow-hidden">
       <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-blue-50"></div>
       <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-amber-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
       <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

       <GlassCard className="w-full max-w-md p-8 shadow-2xl bg-white/80 relative z-10 backdrop-blur-xl border border-white/50">
          <div className="text-center mb-8">
             <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">S</div>
             <h2 className="text-2xl font-bold text-slate-800">{isRegistering ? 'Staff Registration' : 'Staff Login'}</h2>
             <p className="text-slate-500 text-sm mt-2">Authorized personnel only.</p>
          </div>
          
          {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center gap-2 animate-fade-in-up"><AlertCircle size={16}/> {error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
             {isRegistering && (
               <div className="animate-fade-in-up">
                 <input type="text" placeholder="Full Name" required className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none transition-all" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
               </div>
             )}
             <input type="email" placeholder="Email Address" required className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none transition-all" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
             <input type="password" placeholder="Password" required className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none transition-all" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
             
             <Button type="submit" className="w-full mt-4 py-3 shadow-lg">{loading ? 'Processing...' : (isRegistering ? 'Register' : 'Login')}</Button>
          </form>
          
          <div className="mt-8 text-center pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              {isRegistering ? "Already have an account?" : "New staff member?"}
              <button onClick={() => setIsRegistering(!isRegistering)} className="text-amber-600 font-bold ml-1 hover:underline">
                {isRegistering ? "Login" : "Register"}
              </button>
            </p>
          </div>
       </GlassCard>
    </div>
  )
};

const Dashboard = () => {
  const { user, config, setConfig, setUser } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'site' | 'users'>('overview');
  const [contentTab, setContentTab] = useState<'news' | 'events' | 'gallery'>('news');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Data States
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Form States
  const [newItem, setNewItem] = useState<any>({});
  const [siteForm, setSiteForm] = useState<SiteConfig>(config);

  const refreshData = () => {
      db.getNews().then(setNews);
      db.getEvents().then(setEvents);
      db.getGallery().then(setGallery);
      if(user?.role === 'dev') db.getUsers().then(setUsers);
  };

  useEffect(() => { refreshData(); }, [activeTab, contentTab]);
  
  // Keep siteForm in sync if config changes externally, but only on mount or explicit reset
  useEffect(() => { setSiteForm(config) }, [config.schoolId]); // Basic dependency to update if config loads late

  // Handlers
  const handleAddNews = async () => {
      const item = { id: Date.now().toString(), active: true, ...newItem };
      await db.saveNews([item, ...news]);
      setNewItem({});
      refreshData();
  };
  const handleDeleteNews = async (id: string) => {
      await db.saveNews(news.filter(n => n.id !== id));
      refreshData();
  };

  const handleAddEvent = async () => {
      const item = { id: Date.now().toString(), ...newItem };
      await db.saveEvents([item, ...events]);
      setNewItem({});
      refreshData();
  };

  const handleAddGallery = async () => {
      const item = { id: Date.now().toString(), ...newItem };
      await db.saveGallery([item, ...gallery]);
      setNewItem({});
      refreshData();
  };

  const handleSaveConfig = async () => {
      setSaving(true);
      // Simulate network request time for feedback
      await new Promise(r => setTimeout(r, 800));
      await db.updateConfig(siteForm);
      setConfig(siteForm);
      setSaving(false);
      alert("Site configuration updated successfully!");
  };

  const handleUserAction = async (uid: string, action: 'approve' | 'revoke') => {
      await db.updateUserRole(uid, action === 'approve' ? 'editor' : 'pending');
      refreshData();
  };

  if (!user) return <Navigate to="/login" />;
  if (user.role === 'pending') return (
    <div className="min-h-screen flex items-center justify-center flex-col p-8 text-center bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md border border-slate-200">
            <Clock size={48} className="mx-auto text-amber-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-slate-800">Account Pending Approval</h2>
            <p className="text-slate-600 mb-6">Your registration has been received. Please contact the administrator to approve your access level.</p>
            <Link to="/"><Button variant="outline">Back to Home</Button></Link>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="bg-slate-900 text-white w-full md:w-64 shrink-0 flex flex-col shadow-2xl z-30">
            <div className="p-6 border-b border-slate-800">
                <h2 className="font-bold text-xl tracking-tight flex items-center gap-2"><Settings size={20} className="text-amber-500"/> Admin Panel</h2>
                <p className="text-xs text-slate-400 mt-1">Welcome, {user.displayName || user.email}</p>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-amber-400 font-bold hover:bg-slate-800 hover:text-white transition-colors mb-6 border border-slate-700/50">
                    <Home size={18} /> Visit Website
                </Link>
                {[
                    { id: 'overview', label: 'Overview', icon: FileText },
                    { id: 'content', label: 'Content Manager', icon: Image },
                    { id: 'site', label: 'Site Editor', icon: Settings },
                    ...(user.role === 'dev' ? [{ id: 'users', label: 'User Management', icon: Users }] : [])
                ].map((tab: any) => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <tab.icon size={18} /> {tab.label}
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-slate-800">
                <button onClick={() => { db.logout(); setUser(null); navigate('/'); }} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors w-full px-4 py-2 hover:bg-slate-800 rounded-lg">
                    <LogOut size={18} /> Logout
                </button>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen bg-slate-50">
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in-up">
                    <h2 className="text-3xl font-bold text-slate-800">Dashboard Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                            <div className="p-4 bg-blue-100 text-blue-600 rounded-full"><FileText size={24}/></div>
                            <div>
                              <h3 className="text-slate-500 text-sm font-bold uppercase">Total News</h3>
                              <p className="text-3xl font-bold text-slate-800">{news.length}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                            <div className="p-4 bg-amber-100 text-amber-600 rounded-full"><Calendar size={24}/></div>
                            <div>
                              <h3 className="text-slate-500 text-sm font-bold uppercase">Upcoming Events</h3>
                              <p className="text-3xl font-bold text-slate-800">{events.length}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                            <div className="p-4 bg-green-100 text-green-600 rounded-full"><Image size={24}/></div>
                            <div>
                              <h3 className="text-slate-500 text-sm font-bold uppercase">Gallery Images</h3>
                              <p className="text-3xl font-bold text-slate-800">{gallery.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'content' && (
                <div className="animate-fade-in-up">
                    <h2 className="text-3xl font-bold text-slate-800 mb-6">Content Manager</h2>
                    <div className="flex gap-4 mb-8 border-b border-slate-200 pb-1">
                        {['news', 'events', 'gallery'].map(t => (
                            <button key={t} onClick={() => setContentTab(t as any)} className={`pb-3 px-4 font-bold capitalize transition-colors ${contentTab === t ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-500 hover:text-slate-800'}`}>
                                {t}
                            </button>
                        ))}
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                        {contentTab === 'news' && (
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-bold mb-4">Add News Update</h3>
                                    <div className="space-y-3">
                                        <input className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Title" value={newItem.title || ''} onChange={e => setNewItem({...newItem, title: e.target.value})} />
                                        <input type="date" className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none" value={newItem.date || ''} onChange={e => setNewItem({...newItem, date: e.target.value})} />
                                        <textarea className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none" rows={3} placeholder="Content" value={newItem.content || ''} onChange={e => setNewItem({...newItem, content: e.target.value})} />
                                        <Button onClick={handleAddNews}>Publish Update</Button>
                                    </div>
                                </div>
                                <div className="border-l pl-8 max-h-96 overflow-y-auto">
                                    <h3 className="font-bold mb-4">Current Updates</h3>
                                    {news.map(n => (
                                        <div key={n.id} className="mb-4 p-3 bg-slate-50 rounded flex justify-between items-start group hover:bg-slate-100 transition-colors">
                                            <div>
                                                <p className="font-bold text-sm">{n.title}</p>
                                                <p className="text-xs text-slate-500">{n.date}</p>
                                            </div>
                                            <button onClick={() => handleDeleteNews(n.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {contentTab === 'events' && (
                             <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-bold mb-4">Add Event</h3>
                                    <div className="space-y-3">
                                        <input className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Event Title" value={newItem.title || ''} onChange={e => setNewItem({...newItem, title: e.target.value})} />
                                        <input type="datetime-local" className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none" value={newItem.date || ''} onChange={e => setNewItem({...newItem, date: e.target.value})} />
                                        <input className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Location" value={newItem.location || ''} onChange={e => setNewItem({...newItem, location: e.target.value})} />
                                        <textarea className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none" rows={3} placeholder="Description" value={newItem.description || ''} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                                        <Button onClick={handleAddEvent}>Add Event</Button>
                                    </div>
                                </div>
                                <div className="border-l pl-8 max-h-96 overflow-y-auto">
                                    <h3 className="font-bold mb-4">Upcoming Events</h3>
                                    {events.map(e => (
                                        <div key={e.id} className="mb-4 p-3 bg-slate-50 rounded group hover:bg-slate-100 transition-colors">
                                            <div className="flex justify-between">
                                                <p className="font-bold text-sm">{e.title}</p>
                                                <button onClick={async () => { await db.saveEvents(events.filter(x => x.id !== e.id)); refreshData(); }} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                                            </div>
                                            <p className="text-xs text-slate-500">{e.date} @ {e.location}</p>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        )}

                        {contentTab === 'gallery' && (
                             <div className="space-y-8">
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                    <h3 className="font-bold mb-4">Upload Photo</h3>
                                    <div className="grid md:grid-cols-3 gap-4 items-end">
                                        <div className="col-span-1">
                                            <input className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Image Title" value={newItem.title || ''} onChange={e => setNewItem({...newItem, title: e.target.value})} />
                                            <select className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none" value={newItem.category || ''} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                                                <option value="">Select Category</option>
                                                <option value="Campus">Campus</option>
                                                <option value="Academics">Academics</option>
                                                <option value="Sports">Sports</option>
                                                <option value="Events">Events</option>
                                            </select>
                                        </div>
                                        <div className="col-span-1">
                                            <ImagePicker label="Select Image" value={newItem.url || ''} onChange={val => setNewItem({...newItem, url: val})} />
                                        </div>
                                        <div className="col-span-1">
                                             <Button onClick={handleAddGallery} disabled={!newItem.url} className="w-full">Upload to Gallery</Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {gallery.map(g => (
                                        <div key={g.id} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
                                            <img src={g.url} alt={g.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                            <button onClick={async () => { await db.saveGallery(gallery.filter(x => x.id !== g.id)); refreshData(); }} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                                                <Trash2 size={14} />
                                            </button>
                                            <div className="absolute bottom-0 left-0 w-full bg-black/60 text-white text-xs p-2 truncate backdrop-blur-sm">
                                                {g.title}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'site' && (
                <div className="animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6 sticky top-0 bg-slate-50 z-10 py-4 border-b">
                         <h2 className="text-3xl font-bold text-slate-800">Site Editor</h2>
                         <Button onClick={handleSaveConfig} variant="success" disabled={saving}>
                             {saving ? 'Saving...' : <><Save size={18}/> Save Changes</>}
                         </Button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-8 pb-12">
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-shadow hover:shadow-md">
                                <h3 className="font-bold text-lg mb-4 border-b pb-2">School Identity</h3>
                                <FormInput label="School Name" value={siteForm.schoolName} onChange={(e: any) => setSiteForm({...siteForm, schoolName: e.target.value})} />
                                <FormInput label="School ID" value={siteForm.schoolId} onChange={(e: any) => setSiteForm({...siteForm, schoolId: e.target.value})} />
                            </div>
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-shadow hover:shadow-md">
                                <h3 className="font-bold text-lg mb-4 border-b pb-2">Contact Info</h3>
                                <FormInput label="Address" value={siteForm.address} onChange={(e: any) => setSiteForm({...siteForm, address: e.target.value})} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput label="Email" value={siteForm.email} onChange={(e: any) => setSiteForm({...siteForm, email: e.target.value})} />
                                    <FormInput label="Phone" value={siteForm.phone} onChange={(e: any) => setSiteForm({...siteForm, phone: e.target.value})} />
                                </div>
                            </div>
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-shadow hover:shadow-md">
                                <h3 className="font-bold text-lg mb-4 border-b pb-2">Theme Colors</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Primary Color</label>
                                        <div className="flex items-center gap-2 border p-2 rounded-lg">
                                            <input type="color" value={siteForm.primaryColor} onChange={(e) => setSiteForm({...siteForm, primaryColor: e.target.value})} className="h-10 w-10 rounded cursor-pointer border-none" />
                                            <span className="text-sm text-slate-500 font-mono">{siteForm.primaryColor}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Accent Color</label>
                                        <div className="flex items-center gap-2 border p-2 rounded-lg">
                                            <input type="color" value={siteForm.accentColor} onChange={(e) => setSiteForm({...siteForm, accentColor: e.target.value})} className="h-10 w-10 rounded cursor-pointer border-none" />
                                            <span className="text-sm text-slate-500 font-mono">{siteForm.accentColor}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Added Statistics Editor */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-shadow hover:shadow-md">
                                <h3 className="font-bold text-lg mb-4 border-b pb-2">School Statistics</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput label="Students" type="number" value={siteForm.stats.students} onChange={(e: any) => setSiteForm({...siteForm, stats: {...siteForm.stats, students: parseInt(e.target.value) || 0}})} />
                                    <FormInput label="Teachers" type="number" value={siteForm.stats.teachers} onChange={(e: any) => setSiteForm({...siteForm, stats: {...siteForm.stats, teachers: parseInt(e.target.value) || 0}})} />
                                    <FormInput label="Awards" type="number" value={siteForm.stats.awards} onChange={(e: any) => setSiteForm({...siteForm, stats: {...siteForm.stats, awards: parseInt(e.target.value) || 0}})} />
                                    <FormInput label="Years Active" type="number" value={siteForm.stats.years} onChange={(e: any) => setSiteForm({...siteForm, stats: {...siteForm.stats, years: parseInt(e.target.value) || 0}})} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-shadow hover:shadow-md">
                                <h3 className="font-bold text-lg mb-4 border-b pb-2">Home Page Content</h3>
                                <FormInput label="Hero Title" value={siteForm.heroTitle} onChange={(e: any) => setSiteForm({...siteForm, heroTitle: e.target.value})} />
                                <FormInput label="Hero Subtitle" value={siteForm.heroSubtitle} onChange={(e: any) => setSiteForm({...siteForm, heroSubtitle: e.target.value})} />
                                <ImagePicker label="Hero Background Image" value={siteForm.heroImage} onChange={val => setSiteForm({...siteForm, heroImage: val})} />
                            </div>
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-shadow hover:shadow-md">
                                <h3 className="font-bold text-lg mb-4 border-b pb-2">Principal's Section</h3>
                                <FormInput label="Principal Name" value={siteForm.principalName} onChange={(e: any) => setSiteForm({...siteForm, principalName: e.target.value})} />
                                <div className="mb-4">
                                    <label className="block text-sm font-bold mb-2">Message</label>
                                    <textarea className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none" rows={4} value={siteForm.principalMessage} onChange={(e) => setSiteForm({...siteForm, principalMessage: e.target.value})} />
                                </div>
                                <ImagePicker label="Principal Photo" value={siteForm.principalPhoto} onChange={val => setSiteForm({...siteForm, principalPhoto: val})} />
                            </div>
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-shadow hover:shadow-md">
                                <h3 className="font-bold text-lg mb-4 border-b pb-2">Features Toggle</h3>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded transition-colors">
                                        <input type="checkbox" checked={siteForm.features.showNews} onChange={e => setSiteForm({...siteForm, features: {...siteForm.features, showNews: e.target.checked}})} className="w-5 h-5 accent-amber-600" />
                                        <span className="font-medium">Show News Ticker</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded transition-colors">
                                        <input type="checkbox" checked={siteForm.features.showEvents} onChange={e => setSiteForm({...siteForm, features: {...siteForm.features, showEvents: e.target.checked}})} className="w-5 h-5 accent-amber-600" />
                                        <span className="font-medium">Show Events Section</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded transition-colors">
                                        <input type="checkbox" checked={siteForm.features.showGallery} onChange={e => setSiteForm({...siteForm, features: {...siteForm.features, showGallery: e.target.checked}})} className="w-5 h-5 accent-amber-600" />
                                        <span className="font-medium">Show Gallery Preview</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'users' && user.role === 'dev' && (
                <div className="animate-fade-in-up">
                     <h2 className="text-3xl font-bold text-slate-800 mb-6">User Management</h2>
                     <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                         <table className="w-full text-left">
                             <thead className="bg-slate-50 border-b border-slate-200">
                                 <tr>
                                     <th className="p-4 text-sm font-bold text-slate-500 uppercase">Name</th>
                                     <th className="p-4 text-sm font-bold text-slate-500 uppercase">Email</th>
                                     <th className="p-4 text-sm font-bold text-slate-500 uppercase">Role</th>
                                     <th className="p-4 text-sm font-bold text-slate-500 uppercase">Actions</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100">
                                 {users.map(u => (
                                     <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                                         <td className="p-4 font-medium">{u.displayName || '-'}</td>
                                         <td className="p-4 text-slate-600">{u.email}</td>
                                         <td className="p-4">
                                             <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${u.role === 'pending' ? 'bg-orange-100 text-orange-600' : u.role === 'dev' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                                                 {u.role}
                                             </span>
                                         </td>
                                         <td className="p-4">
                                             {u.role !== 'dev' && (
                                                 u.role === 'pending' ? (
                                                     <button onClick={() => handleUserAction(u.uid, 'approve')} className="text-green-600 hover:underline font-bold text-sm mr-4 bg-green-50 px-3 py-1 rounded hover:bg-green-100 transition-colors">Approve</button>
                                                 ) : (
                                                     <button onClick={() => handleUserAction(u.uid, 'revoke')} className="text-red-600 hover:underline font-bold text-sm bg-red-50 px-3 py-1 rounded hover:bg-red-100 transition-colors">Revoke</button>
                                                 )
                                             )}
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                </div>
            )}
        </main>
    </div>
  );
};


// --- Main App Component ---

function App() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [init, setInit] = useState(true);

  // Load initial data
  useEffect(() => {
    const load = async () => {
       const c = await db.getConfig();
       setConfig(c);
       const u = db.getCurrentUser();
       setUser(u);
       setInit(false);
    };
    load();
  }, []);

  if (init) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div></div>;

  return (
    <AppContext.Provider value={{ config, setConfig, user, setUser, refreshData: () => {} }}>
      <HashRouter>
        <div className="min-h-screen flex flex-col text-slate-800 font-sans selection:bg-amber-100">
          <Routes>
            {/* Public Routes with Main Layout */}
            <Route path="/" element={<><Navbar /><HomePage /><Footer /></>} />
            <Route path="/about" element={<><Navbar /><AboutPage /><Footer /></>} />
            <Route path="/academics" element={<><Navbar /><AcademicsPage /><Footer /></>} />
            <Route path="/admissions" element={<><Navbar /><AdmissionsPage /><Footer /></>} />
            <Route path="/gallery" element={<><Navbar /><GalleryPage /><Footer /></>} />
            <Route path="/contact" element={<><Navbar /><ContactPage /><Footer /></>} />
            <Route path="/events" element={<><Navbar /><Section><h1 className="text-3xl font-bold mb-4">All Events</h1><p>Full calendar implementation coming soon...</p></Section><Footer /></>} />
            
            {/* Auth & Dashboard */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
}

export default App;