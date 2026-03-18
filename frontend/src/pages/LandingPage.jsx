import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView, useSpring, useTransform } from 'framer-motion';

const CountUp = ({ value, precision = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const spring = useSpring(0, { stiffness: 40, damping: 20 });
  const displayValue = useTransform(spring, (current) => 
    current.toFixed(precision).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  );

  useEffect(() => {
    if (isInView) spring.set(value);
  }, [isInView, spring, value]);

  return <motion.span ref={ref}>{displayValue}</motion.span>;
};

const LandingPage = () => {
  const navRef = useRef(null);
  const sttRef = useRef(null);

  useEffect(() => {
    // Reveal logic
    const allR = document.querySelectorAll('.reveal, .rl, .rr');
    const ro = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const d = el.classList.contains('d1') ? 80 : 
                  el.classList.contains('d2') ? 160 : 
                  el.classList.contains('d3') ? 240 : 
                  el.classList.contains('d4') ? 320 : 
                  el.classList.contains('d5') ? 400 : 
                  el.classList.contains('d6') ? 480 : 0;
        setTimeout(() => el.classList.add('visible'), d);
        ro.unobserve(el);
      });
    }, { threshold: 0.1 });
    allR.forEach(e => ro.observe(e));

    // Stats shimmer logic
    document.querySelectorAll('.sn').forEach(el => {
      new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('run'); } });
      }, { threshold: 0.5 }).observe(el);
    });

    // Progress bar logic
    document.querySelectorAll('.bar-fill').forEach(b => {
      new IntersectionObserver(entries => {
        entries.forEach(e => { 
          if (e.isIntersecting) { 
            const targetWidth = b.getAttribute('data-w') || '72%';
            b.style.width = targetWidth; 
          } 
        });
      }, { threshold: 0.3 }).observe(b);
    });

    // Scroll logic for Nav and Scroll-To-Top
    const handleScroll = () => {
      if (navRef.current) navRef.current.classList.toggle('s', window.scrollY > 60);
      if (sttRef.current) sttRef.current.classList.toggle('v', window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      ro.disconnect();
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-white text-[#4b5563] overflow-x-hidden antialiased font-sans">
      {/* NAV */}
      <nav id="nav" ref={navRef} className="fixed top-0 left-0 right-0 z-[999] flex items-center justify-between px-12 py-6 bg-transparent transition-all duration-350 ease-in-out">
        <div className="flex items-center gap-[10px] animate-[navSlide_0.6s_ease_both]">
          <div className="w-[36px] h-[36px] bg-[var(--green)] rounded-[10px] flex items-center justify-center transition-transform duration-300 hover:rotate-[-8deg] hover:scale-110">
            <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <span className="text-[1.35rem] font-[900] text-[var(--navy)] tracking-[-0.5px]">BlogSpace</span>
        </div>
        <div className="hidden md:flex gap-[2rem]">
          {['Features', 'How It Works', 'For Authors', 'Get Started'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase().replace(/\s+/g, '')}`}
              className="text-[0.875rem] font-[600] text-[var(--navy)] no-underline relative pb-[2px] transition-colors duration-200 hover:text-[var(--green)] hover:after:w-full after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[var(--green)] after:transition-all after:duration-300 after:rounded-[2px]"
            >
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-[1.25rem]">
          <Link to="/login" className="text-[0.875rem] font-[600] text-[var(--navy)] no-underline transition-colors duration-200 hover:text-[var(--green)]">Log in</Link>
          <Link to="/register" className="bg-[var(--green)] text-white px-[1.4rem] py-[0.6rem] rounded-[999px] text-[0.875rem] font-[700] no-underline border-none cursor-pointer transition-all duration-250 shadow-[0_4px_14px_rgba(16,185,129,0.35)] hover:bg-[var(--gd)] hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(16,185,129,0.45)]">
            Start Writing
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="overflow-hidden">
        <div className="px-12 pt-[9rem] pb-[6rem] max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-[4rem] items-center">
          <div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-[8px] bg-[var(--mint)] border border-[rgba(16,185,129,0.3)] px-[14px] py-[6px] rounded-[999px] text-[0.75rem] font-[700] text-[var(--green)] tracking-[0.5px] uppercase mb-[1.5rem]"
            >
              <span className="w-[7px] h-[7px] bg-[var(--green)] rounded-full animate-[dotPulse_2s_ease-in-out_infinite]"></span>
              Open Platform for Writers
            </motion.div>
            <h1 className="text-[clamp(3rem,5vw,4.8rem)] font-[900] text-[var(--navy)] leading-[1.08] tracking-[-2px] mb-[1.5rem]">
              {["Write.", "Publish.", "Grow."].map((word, i) => (
                <motion.span 
                  key={word}
                  initial={{ opacity: 0, y: 40, rotateX: -45 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className={`inline-block whitespace-pre ${word === "Grow." ? "text-[var(--green)]" : ""}`}
                >
                  {word}{" "}
                </motion.span>
              ))}
            </h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="text-[1.1rem] text-[var(--gray)] leading-[1.75] max-w-[480px] mb-[2.5rem]"
            >
              The professional multi-author blog platform. Rich editing, smart tagging, threaded comments, RSS feeds — and a community that reads.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
              className="flex gap-[1rem] flex-wrap"
            >
              <Link to="/register" className="bg-[var(--green)] text-white px-[2rem] py-[1rem] rounded-[14px] text-[1rem] font-[700] border-none cursor-pointer transition-all duration-250 shadow-[0_8px_24px_rgba(16,185,129,0.4)] hover:bg-[var(--gd)] hover:translate-y-[-3px] hover:shadow-[0_16px_36px_rgba(16,185,129,0.45)]">
                Start Writing Free
              </Link>
              <button className="bg-transparent text-[var(--navy)] px-[2rem] py-[1rem] rounded-[14px] text-[1rem] font-[700] cursor-pointer border-2 border-[var(--border)] flex items-center gap-[8px] transition-all duration-250 hover:border-[var(--green)] hover:text-[var(--green)]">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                  <path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" fillRule="evenodd" />
                </svg>
                Watch Demo
              </button>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex gap-[1.5rem] mt-[1.5rem] flex-wrap"
            >
              {['Free forever plan', 'No credit card needed', 'Setup in 2 minutes'].map((text, i) => (
                <motion.div 
                  key={text} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  className="flex items-center gap-[6px] text-[0.8rem] font-[600] text-[var(--gray)] bg-white px-3 py-1.5 rounded-full shadow-sm border border-[var(--border)]"
                >
                  <span className="w-[16px] h-[16px] bg-[var(--mint)] rounded-full flex items-center justify-center text-[var(--green)] text-[10px] font-[800]">✓</span>
                  {text}
                </motion.div>
              ))}
            </motion.div>
          </div>
          {/* Hero visual */}
          <div className="relative hidden lg:block">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-[32px] shadow-[0_32px_96px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.05)] border border-[var(--border)] p-[1.25rem] relative z-10"
            >
              <div className="bg-[var(--mint)] rounded-[24px] p-[1.5rem] relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent)] pointer-events-none"></div>
                <div className="flex items-center gap-[8px] mb-[1.5rem]">
                  <motion.div 
                    animate={{ rotate: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-[32px] h-[32px] bg-[var(--green)] rounded-[10px] flex items-center justify-center"
                  >
                    <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                  <span className="text-[0.9rem] font-[900] text-[var(--navy)]">BlogSpace</span>
                  <div className="ml-auto flex gap-[6px]">
                    <div className="w-[8px] h-[8px] rounded-full bg-[#ef4444]"></div>
                    <div className="w-[8px] h-[8px] rounded-full bg-[#f59e0b]"></div>
                    <div className="w-[8px] h-[8px] rounded-full bg-[#10b981]"></div>
                  </div>
                </div>
                <div className="flex flex-col gap-[12px]">
                  <motion.div 
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="bg-white rounded-[16px] p-[16px_20px] border border-[var(--border)] shadow-sm cursor-pointer transition-shadow hover:shadow-md"
                  >
                    <div className="flex gap-[6px] mb-[8px]">
                      <span className="bg-[#d1fae5] text-[#065f46] text-[0.65rem] font-[800] px-[10px] py-[3px] rounded-[999px]">React 18</span>
                      <span className="bg-[#fef3c7] text-[#92400e] text-[0.65rem] font-[800] px-[10px] py-[3px] rounded-[999px]">Frontend</span>
                    </div>
                    <div className="text-[0.85rem] font-[800] text-[var(--navy)] leading-[1.4] mb-2">Building UIs with React 18 Concurrent Mode</div>
                    <div className="flex items-center gap-[8px]">
                      <div className="w-[24px] h-[24px] rounded-full bg-[#6366f1] flex items-center justify-center text-[0.6rem] font-[800] text-white">AK</div>
                      <span className="text-[0.7rem] text-[var(--gray)] font-medium">Arjun K. · 8 min · 4.2k views</span>
                    </div>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="bg-white rounded-[16px] p-[16px_20px] border border-[var(--border)] shadow-sm cursor-pointer transition-shadow hover:shadow-md"
                  >
                    <div className="flex gap-[6px] mb-[8px]">
                      <span className="bg-[#e0f2fe] text-[#0369a1] text-[0.65rem] font-[800] px-[10px] py-[3px] rounded-[999px]">Spring Boot</span>
                      <span className="bg-[#fce7f3] text-[#9d174d] text-[0.65rem] font-[800] px-[10px] py-[3px] rounded-[999px]">JWT</span>
                    </div>
                    <div className="text-[0.85rem] font-[800] text-[var(--navy)] leading-[1.4] mb-2">JWT Authentication in Spring Boot 3 — Full Guide</div>
                    <div className="flex items-center gap-[8px]">
                      <div className="w-[24px] h-[24px] rounded-full bg-[#ec4899] flex items-center justify-center text-[0.6rem] font-[800] text-white">PM</div>
                      <span className="text-[0.7rem] text-[var(--gray)] font-medium">Priya M. · 12 min · 7.8k views</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
            
            {/* Decals/Floating badges */}
            <motion.div 
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[-30px] right-[-30px] bg-white rounded-[18px] p-[14px_20px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-[var(--mint)] z-20"
            >
              <div className="flex items-center gap-[12px]">
                <div className="relative">
                  <div className="w-[42px] h-[42px] rounded-full bg-[#dbeafe] flex items-center justify-center text-[14px] font-[800] text-[#1d4ed8]">JD</div>
                  <div className="absolute bottom-[-2px] right-[-2px] w-[14px] h-[14px] bg-[var(--green)] border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <div className="text-[0.8rem] font-[800] text-[var(--navy)]">John Doe</div>
                  <div className="text-[0.7rem] text-[var(--green)] font-[700]">Author · Just Published</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-[-30px] left-[-30px] bg-[var(--navy)] text-white rounded-[18px] p-[14px_20px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-20"
            >
              <div className="flex items-center gap-[12px]">
                <div className="w-[36px] h-[36px] bg-[var(--green)] rounded-[12px] flex items-center justify-center">
                  <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24">
                    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-[0.7rem] text-[#94a3b8] font-[600] tracking-[0.5px] uppercase">Readers Growth</div>
                  <div className="text-[1.1rem] font-[900]">+124%</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-[var(--mint)] px-12 py-[4rem]">
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-[2rem] text-center">
          {[
            { n: 12000, suf: '+', l: 'Active Authors' },
            { n: 480, suf: 'K', l: 'Posts Published' },
            { n: 2.1, suf: 'M', l: 'Monthly Readers' },
            { n: 99.9, suf: '%', l: 'Uptime' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <div className="text-[clamp(1.75rem,3vw,2.5rem)] font-[900] text-[var(--navy)] tracking-[-1.5px] flex justify-center items-baseline gap-[2px]">
                <CountUp value={stat.n} precision={stat.n % 1 !== 0 ? 1 : 0} />
                <span className="text-[var(--green)]">{stat.suf}</span>
              </div>
              <div className="text-[0.72rem] font-[700] text-[var(--gray)] uppercase tracking-[1px] mt-[4px]">{stat.l}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ROLES */}
      <section className="px-12 py-[7rem] bg-white overflow-hidden" id="roles">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-[5rem] items-center">
          <div className="rl">
            <div className="inline-flex items-center gap-[6px] bg-[var(--mint)] border border-[rgba(16,185,129,0.25)] px-[14px] py-[5px] rounded-[999px] text-[0.72rem] font-[800] text-[var(--green)] tracking-[1px] uppercase mb-[1.25rem]">✦ Role-Based Platform</div>
            <h2 className="text-[clamp(2rem,3.5vw,3rem)] font-[900] text-[var(--navy)] tracking-[-1px] leading-[1.15] mb-[1rem]">Three Roles,<br /><span className="text-[var(--green)]">One Platform</span></h2>
            <p className="text-[1rem] text-[var(--gray)] leading-[1.7] mb-[2.5rem] max-w-[460px]">A seamless ecosystem for every participant in the content lifecycle — from casual readers to power admins.</p>
            <div className="flex flex-col gap-[0.5rem]">
              {[
                { n: 1, t: 'Reader Experience', d: 'Browse the feed, full-text search, filter by tag or category, comment, reply, and subscribe via RSS — zero friction.' },
                { n: 2, t: 'Author Dashboard', d: 'TipTap rich editor — headings, code blocks, images. Save drafts, preview, assign tags and categories, then hit publish.' },
                { n: 3, t: 'Admin Panel', d: 'Manage all users, promote readers to authors, moderate comments, and control the entire platform from one place.', hl: true }
              ].map((role, i) => (
                <div key={i} className={`flex items-start gap-[1rem] p-[1.25rem_1.5rem] rounded-[16px] transition-all duration-300 cursor-default group hover:bg-[var(--mint)] hover:translate-x-[6px] ${role.hl ? 'bg-[var(--mint)] border-l-4 border-[var(--green)] rounded-[0_16px_16px_0]' : ''}`}>
                  <div className={`w-[44px] h-[44px] rounded-full bg-[var(--mint)] text-[var(--green)] flex items-center justify-center font-[900] text-[1rem] shrink-0 transition-all duration-300 group-hover:bg-[var(--green)] group-hover:text-white ${role.hl ? 'bg-[var(--green)] text-white' : ''}`}>
                    {role.n}
                  </div>
                  <div>
                    <div className="text-[1.15rem] font-[800] text-[var(--navy)] mb-[0.3rem]">{role.t}</div>
                    <p className="text-[0.875rem] text-[var(--gray)] leading-[1.65]">{role.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rr">
            <div className="relative h-[340px] group/stacked">
              <div className="absolute w-full bg-white rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-[var(--border)] p-[1.5rem] transition-transform duration-400 top-0 translate-x-[48px] opacity-40 bg-[#f8fafc] group-hover/stacked:translate-x-[56px] group-hover/stacked:translate-y-[-6px]">
                <div className="h-[8px] w-[120px] bg-[#f1f5f9] rounded-[4px] mb-[10px]"></div>
                <div className="h-[5px] w-full bg-[#f8fafc] rounded-[3px] mb-[5px]"></div>
                <div className="h-[5px] w-[75%] bg-[#f8fafc] rounded-[3px]"></div>
                <div className="absolute bottom-[10px] left-[14px] text-[0.6rem] font-[800] text-[#94a3b8] tracking-[1px]">READER</div>
              </div>
              <div className="absolute w-full bg-white rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-[var(--border)] p-[1.5rem] transition-transform duration-400 top-[60px] translate-x-[24px] z-[2] group-hover/stacked:translate-x-[26px] group-hover/stacked:translate-y-[-4px]">
                <div className="flex justify-between items-center mb-[12px]">
                  <div className="h-[119px] w-[90px] bg-[#f1f5f9] rounded-[4px]"></div>
                  <div className="w-[26px] h-[26px] bg-[rgba(16,185,129,0.15)] rounded-full"></div>
                </div>
                <div className="grid grid-cols-3 gap-[8px] mb-[10px]">
                  <div className="h-[44px] bg-[#f8fafc] rounded-[8px]"></div>
                  <div className="h-[44px] bg-[#f8fafc] rounded-[8px]"></div>
                  <div className="h-[44px] bg-[#f8fafc] rounded-[8px]"></div>
                </div>
                <div className="h-[5px] w-full bg-[#f1f5f9] rounded-[3px]"></div>
                <div className="absolute bottom-[10px] left-[14px] text-[0.6rem] font-[800] text-[#94a3b8] tracking-[1px]">AUTHOR</div>
              </div>
              <div className="absolute w-full bg-[var(--navy)] rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-[var(--border)] p-[1.5rem] transition-transform duration-400 top-[120px] z-[3] group-hover/stacked:translate-y-[-4px]">
                <div className="flex items-center gap-[6px] mb-[1rem]">
                  <span className="w-[10px] h-[10px] rounded-full bg-[#ef4444]"></span>
                  <span className="w-[10px] h-[10px] rounded-full bg-[#f59e0b]"></span>
                  <span className="w-[10px] h-[10px] rounded-full bg-[#10b981]"></span>
                  <span className="text-[0.65rem] text-[#94a3b8] font-mono ml-auto">Admin Console</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#334155] p-[0.55rem_0] text-[0.8rem]">
                  <span className="text-[#94a3b8]">Published posts</span>
                  <span className="text-[var(--green)] font-[700]">156 today</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#334155] p-[0.55rem_0] text-[0.8rem]">
                  <span className="text-[#94a3b8]">Pending comments</span>
                  <span className="text-white font-[700]">12</span>
                </div>
                <div className="mt-[10px] h-[7px] bg-[#1e293b] rounded-[4px] overflow-hidden">
                  <div className="bar-fill" data-w="72%"></div>
                </div>
                <div className="absolute bottom-[10px] left-[14px] text-[0.6rem] font-[800] text-[#64748b] tracking-[1px]">ADMIN</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-12 py-[7rem] bg-[var(--mint)]" id="features">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center reveal">
            <div className="inline-flex items-center gap-[6px] bg-[var(--mint)] border border-[rgba(16,185,129,0.25)] px-[14px] py-[5px] rounded-[999px] text-[0.72rem] font-[800] text-[var(--green)] tracking-[1px] uppercase mb-[1.25rem] justify-center">✦ Everything You Need</div>
            <h2 className="text-[clamp(2rem,3.5vw,3rem)] font-[900] text-[var(--navy)] tracking-[-1px] leading-[1.15] mb-[1rem]">Built for Writers Who<br /><span className="text-[var(--green)]">Mean Business</span></h2>
            <p className="text-[1rem] text-[var(--gray)] leading-[1.7] max-w-[520px] mx-auto mt-[1rem]">Everything you need to run a high-traffic publication without the technical headaches.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1.5rem] mt-[4rem]">
            {[
              { i: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', t: 'TipTap Rich Editor', d: 'Headings, bold, italic, inline code, code blocks, images and links — distraction-free canvas with live preview.' },
              { i: 'M7 7h.01M7 11h.01M7 15h.01M13 7h.01M13 11h.01M13 15h.01M17 7h.01M17 11h.01M17 15h.01', t: 'Smart Tagging', d: 'Assign multiple tags and one category per post. Readers filter by tag or category — discovery made effortless.' },
              { i: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z', t: 'Nested Comments', d: 'Two-level threaded comments — readers comment, authors reply. Real conversations, not just noise.' },
              { i: 'M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z', t: 'RSS 2.0 Feed', d: 'Auto-generated valid RSS feed for every blog. Readers subscribe in any feed reader, forever. Includes title, excerpt and pubDate.' },
              { i: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', t: 'Full-text Search', d: 'PostgreSQL tsvector + GIN index powers instant search across all post titles and content without loading everything into memory.' },
              { i: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', t: 'JWT Role Security', d: 'READER · AUTHOR · ADMIN roles enforced via Spring Security. Protected routes return 401. All secrets in environment variables.' }
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-white p-[2rem] rounded-[24px] border border-[var(--border)] transition-shadow duration-300 cursor-default relative overflow-hidden group hover:shadow-[0_40px_80px_rgba(16,185,129,0.12)]"
              >
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,185,129,0.04),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="w-[56px] h-[56px] bg-[var(--mint)] text-[var(--green)] rounded-[16px] flex items-center justify-center mb-[1.5rem] transition-all duration-400 group-hover:bg-[var(--green)] group-hover:text-white group-hover:rotate-[8deg] group-hover:scale-110">
                  <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d={feature.i} />
                  </svg>
                </div>
                <div className="text-[1.2rem] font-[800] text-[var(--navy)] mb-[0.75rem] tracking-[-0.5px]">{feature.t}</div>
                <p className="text-[0.95rem] text-[var(--gray)] leading-[1.65] mb-[1.5rem]">{feature.d}</p>
                <Link to="#" className="text-[0.875rem] font-[700] text-[var(--green)] flex items-center gap-[6px] no-underline transition-all duration-200 group-hover:gap-[10px]">
                  Learn more <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-12 py-[7rem] bg-white" id="howitworks">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-[5rem] items-start">
          <div className="rl">
            <div className="inline-flex items-center gap-[6px] bg-[var(--mint)] border border-[rgba(16,185,129,0.25)] px-[14px] py-[5px] rounded-[999px] text-[0.72rem] font-[800] text-[var(--green)] tracking-[1px] uppercase mb-[1.25rem]">✦ How It Works</div>
            <h2 className="text-[clamp(2rem,3.5vw,3rem)] font-[900] text-[var(--navy)] tracking-[-1px] leading-[1.15] mb-[1rem]">From Draft to<br /><span className="text-[var(--green)]">Published in Minutes</span></h2>
            <p className="text-[1rem] text-[var(--gray)] leading-[1.7] mb-[2.5rem] max-w-[440px]">A seamless publishing workflow designed around how writers actually work.</p>
            {[
              { n: 1, t: 'Create your account', d: 'Register as a Reader, get promoted to Author by an Admin, or sign up directly. JWT token issued instantly with your role baked in.' },
              { n: 2, t: 'Write with TipTap editor', d: 'Compose in a rich distraction-free editor. Add headings, code blocks, images, and links. Save drafts anytime — your work is never lost.' },
              { n: 3, t: 'Tag, categorise & preview', d: 'Assign multiple tags and a category. Your URL-friendly slug auto-generates from the title. Preview exactly how readers will see it.' },
              { n: 4, t: 'Hit Publish — reach your audience', d: 'Post goes live on the public feed, full-text search index, and your RSS feed instantly. Readers comment, reply, and subscribe.' }
            ].map((step, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="flex gap-[1.25rem] mb-[2rem] relative last:mb-0 group cursor-default"
              >
                {i < 3 && <div className="absolute left-[19px] top-[52px] w-[2px] h-[calc(100%+.5rem)] bg-[linear-gradient(to_bottom,var(--green),rgba(16,185,129,0.1))]"></div>}
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-[40px] h-[40px] rounded-full bg-[var(--green)] text-white flex items-center justify-center font-[900] text-[0.875rem] shrink-0 shadow-[0_4px_12px_rgba(16,185,129,0.3)] z-10"
                >
                  {step.n}
                </motion.div>
                <div className="pt-1">
                  <div className="text-[1.1rem] font-[800] text-[var(--navy)] mb-[0.4rem] transition-colors group-hover:text-[var(--green)]">{step.t}</div>
                  <p className="text-[0.925rem] text-[var(--gray)] leading-[1.65] max-w-[480px]">{step.d}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Blog dashboard card */}
          <div className="rr">
            <div className="bg-[var(--navy)] rounded-[24px] overflow-hidden shadow-[0_32px_80px_rgba(26,26,46,0.4)] relative">
              {/* Browser bar */}
              <div className="flex items-center gap-[8px] p-[0.85rem_1.25rem] bg-[#111827] border-b border-[#1e293b]">
                <div className="flex gap-[6px]">
                  <div className="w-[10px] h-[10px] rounded-full bg-[#ef4444]"></div>
                  <div className="w-[10px] h-[10px] rounded-full bg-[#f59e0b]"></div>
                  <div className="w-[10px] h-[10px] rounded-full bg-[#10b981]"></div>
                </div>
                <div className="flex-1 bg-[#1e293b] rounded-[6px] p-[4px_12px] text-[0.7rem] text-[#64748b] font-mono ml-[8px]">blogspace.com/<span className="text-[var(--green)]">dashboard</span></div>
                <div className="flex items-center gap-[5px]">
                  <span className="w-[8px] h-[8px] bg-[var(--green)] rounded-full relative inline-block after:content-[''] after:absolute after:inset-0 after:bg-[var(--green)] after:rounded-full after:animate-[ping_1.5s_ease_infinite]"></span>
                  <span className="text-[0.65rem] text-[var(--green)] font-[700]">Live</span>
                </div>
              </div>
              {/* Body */}
              <div className="grid grid-cols-[52px_1fr] min-h-[320px]">
                {/* Sidebar icons */}
                <div className="bg-[#0f172a] border-r border-[#1e293b] py-[1rem] flex flex-col items-center gap-[1.25rem]">
                  {[
                    { t: 'Dashboard', act: true, content: (
                      <>
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </>
                    )},
                    { t: 'Write Post', content: <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> },
                    { t: 'Tags', content: (
                      <>
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                        <line x1="7" y1="7" x2="7" y2="7" />
                      </>
                    )},
                    { t: 'Comments', content: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /> },
                    { t: 'Users', content: (
                      <>
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87" />
                        <path d="M16 3.13a4 4 0 010 7.75" />
                      </>
                    )},
                    { t: 'RSS Feed', content: (
                      <>
                        <path d="M4 11a9 9 0 019 9" />
                        <path d="M4 4a16 16 0 0116 16" />
                        <circle cx="5" cy="19" r="1" />
                      </>
                    )}
                  ].map((ic, i) => (
                    <div key={i} className={`w-[36px] h-[36px] rounded-[10px] flex items-center justify-center cursor-pointer transition-all duration-200 hover:opacity-100 hover:bg-[#263548] ${ic.act ? 'bg-[var(--green)]' : 'bg-[#1e293b] opacity-50'}`} title={ic.t}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        {ic.content}
                      </svg>
                    </div>
                  ))}
                </div>
                {/* Main area */}
                <div className="p-[1.25rem]">
                  <div className="flex items-center justify-between mb-[1rem]">
                    <div>
                      <div className="text-[0.8rem] font-[800] text-white tracking-[0.3px]">Author Dashboard</div>
                      <div className="text-[0.62rem] text-[#64748b] mt-[1px]">Welcome back 👋</div>
                    </div>
                    <div className="bg-[var(--green)] text-white text-[0.65rem] font-[700] px-[12px] py-[4px] rounded-[6px] cursor-pointer whitespace-nowrap">+ New Post</div>
                  </div>
                  <div className="grid grid-cols-3 gap-[0.6rem] mb-[1rem]">
                    <div className="bg-[#1e293b] rounded-[10px] p-[0.6rem_0.75rem]">
                      <div className="text-[1rem] font-[900] text-white tracking-[-0.5px] text-[var(--green)]">12</div>
                      <div className="text-[0.6rem] text-[#64748b] font-[600] uppercase tracking-[0.5px] mt-[2px]">Published</div>
                    </div>
                    <div className="bg-[#1e293b] rounded-[10px] p-[0.6rem_0.75rem]">
                      <div className="text-[1rem] font-[900] text-white tracking-[-0.5px]">4</div>
                      <div className="text-[0.6rem] text-[#64748b] font-[600] uppercase tracking-[0.5px] mt-[2px]">Drafts</div>
                    </div>
                    <div className="bg-[#1e293b] rounded-[10px] p-[0.6rem_0.75rem]">
                      <div className="text-[1rem] font-[900] text-white tracking-[-0.5px] text-[var(--green)]">847</div>
                      <div className="text-[0.6rem] text-[#64748b] font-[600] uppercase tracking-[0.5px] mt-[2px]">Comments</div>
                    </div>
                  </div>
                  <div className="text-[0.65rem] font-[700] text-[#64748b] uppercase tracking-[0.8px] mb-[0.5rem]">Recent Posts</div>
                  {[
                    { av: 'RC', acl: '#818cf8', bg: 'rgba(99,102,241,.15)', t: 'Building Concurrent UIs with React 18', m: '4.2k views · 24 comments · react, frontend', s: 'Published', scl: 'sp' },
                    { av: 'SB', acl: 'var(--green)', bg: 'rgba(16,185,129,.15)', t: 'Spring Boot 3 JWT Auth — Deep Dive', m: '7.8k views · 56 comments · spring, jwt', s: 'Published', scl: 'sp' },
                    { av: 'PG', acl: '#f59e0b', bg: 'rgba(245,158,11,.1)', t: 'PostgreSQL Full-Text Search with tsvector', m: 'Last edited 2h ago · postgresql, search', s: 'Draft', scl: 'sd' }
                  ].map((post, i) => (
                    <div key={i} className="bg-[#1e293b] rounded-[10px] p-[0.7rem_0.9rem] mb-[0.5rem] flex items-center gap-[0.75rem] transition-all duration-200 cursor-default hover:bg-[#263548] last:mb-0">
                      <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center text-[0.62rem] font-[800] shrink-0" style={{ backgroundColor: post.bg, color: post.acl }}>{post.av}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.72rem] font-[700] text-[#e2e8f0] whitespace-nowrap overflow-hidden truncate">{post.t}</div>
                        <div className="text-[0.62rem] text-[#64748b] mt-[2px]">{post.m}</div>
                      </div>
                      <div className={`text-[0.6rem] font-[700] px-[8px] py-[2px] rounded-[999px] shrink-0 ${post.scl === 'sp' ? 'bg-[rgba(16,185,129,0.15)] text-[var(--green)]' : 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]'}`}>{post.s}</div>
                    </div>
                  ))}
                  <div className="flex gap-[0.4rem] flex-wrap mt-[0.75rem]">
                    {['react', 'spring-boot', 'postgresql', 'jwt', 'docker'].map(tag => (
                      <div key={tag} className="text-[0.6rem] font-[700] p-[2px_9px] rounded-[999px] bg-[rgba(16,185,129,0.1)] text-[var(--green)] border border-[rgba(16,185,129,0.2)]">{tag}</div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Toast notification */}
              <div className="absolute bottom-[12px] right-[12px] bg-white rounded-[12px] p-[10px_14px] shadow-[0_8px_24px_rgba(0,0,0,0.2)] flex items-center gap-[10px] animate-[notifSlide_0.6s_ease_both_2.5s] opacity-0">
                <div className="w-[28px] h-[28px] rounded-[8px] bg-[var(--mint)] flex items-center justify-center shrink-0">
                  <svg width="14" height="14" fill="none" stroke="var(--green)" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-[0.72rem] font-[800] text-[var(--navy)]">Post published!</div>
                  <div className="text-[0.62rem] text-[var(--gray)]">Now live on feed & RSS ✦</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-12 py-[7rem]" id="getstarted">
        <div className="max-w-[1280px] mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[linear-gradient(135deg,var(--mint),#ecfdf5)] rounded-[48px] p-[5rem_4rem] text-center border border-[rgba(16,185,129,0.12)] shadow-[0_4px_40px_rgba(16,185,129,0.07)]"
          >
            <h2 className="text-[clamp(2.25rem,4vw,3.5rem)] font-[900] text-[var(--navy)] tracking-[-1.5px] mb-[1.25rem] leading-[1.1]">Ready to Start<br /><span className="text-[var(--green)]">Publishing?</span></h2>
            <p className="text-[1.1rem] text-[var(--gray)] max-w-[520px] mx-auto mb-[2.5rem] leading-[1.7]">Join over 12,000 professional authors and teams growing their audience on BlogSpace today.</p>
            <Link to="/register" className="bg-[var(--green)] text-white px-[3rem] py-[1.1rem] rounded-[18px] text-[1.1rem] font-[800] border-none cursor-pointer inline-block no-underline transition-all duration-250 shadow-[0_8px_32px_rgba(16,185,129,0.4)] hover:bg-[var(--gd)] hover:translate-y-[-3px] hover:shadow-[0_16px_48px_rgba(16,185,129,0.5)]">
              Start Writing Free →
            </Link>
            <div className="flex justify-center gap-[2.5rem] mt-[2.5rem] flex-wrap">
              {['No credit card required', '14-day free trial', 'Cancel anytime'].map((text, i) => (
                <motion.div 
                  key={text} 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-[6px] text-[0.85rem] font-[600] text-[var(--gray)]"
                >
                  <svg width="18" height="18" fill="none" stroke="var(--green)" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {text}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white px-12 py-[5rem] pb-[2.5rem] border-t border-[var(--mint)]">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[3rem] mb-[4rem]">
            <div>
              <div className="flex items-center gap-[10px] mb-[0.5rem]">
                <div className="w-[30px] h-[30px] bg-[var(--green)] rounded-[10px] flex items-center justify-center">
                  <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <span className="text-[1.1rem] font-[900] text-[var(--navy)] tracking-[-0.5px]">BlogSpace</span>
              </div>
              <p className="text-[0.875rem] text-[var(--gray)] leading-[1.7] my-[1rem] max-w-[240px]">Building the future of editorial excellence, one post at a time.</p>
              <div className="flex gap-[10px]">
                {[
                  { t: 'Twitter', content: <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" /> },
                  { t: 'LinkedIn', content: (
                    <>
                      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                      <circle cx="4" cy="4" r="2" />
                    </>
                  )},
                  { t: 'Github', content: <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.34-3.369-1.34-.454-1.152-1.11-1.458-1.11-1.458-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" /> }
                ].map((ic, i) => (
                  <motion.a 
                    key={i} 
                    title={ic.t} 
                    href="#" 
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="w-[36px] h-[36px] rounded-full bg-[var(--mint)] text-[var(--green)] flex items-center justify-center transition-colors duration-250 hover:bg-[var(--green)] hover:text-white"
                  >
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                      {ic.content}
                    </svg>
                  </motion.a>
                ))}
              </div>
            </div>
            {[
              { t: 'Product', l: ['Features', 'Pricing', 'RSS Feed', 'API Docs'] },
              { t: 'Company', l: ['About Us', 'Careers', 'Privacy', 'Terms'] },
              { t: 'Contact', l: ['support@blogspace.com', 'Help Center', 'API Status', 'Blog'] }
            ].map((col, i) => (
              <div key={i}>
                <div className="text-[0.82rem] font-[800] text-[var(--navy)] mb-[1.25rem]">{col.t}</div>
                <ul className="list-none p-0 m-0">
                  {col.l.map(link => (
                    <li key={link} className="mb-[0.85rem]">
                      <a href="#" className="text-[0.875rem] text-[var(--gray)] no-underline transition-colors duration-200 hover:text-[var(--green)]">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-[2rem] border-t border-[#f1f5f9] text-[0.78rem] text-[#9ca3af]">
            <p>© 2026 BlogSpace Inc. All rights reserved.</p>
            <div className="flex gap-[1.5rem]">
              {['Status', 'Cookies', 'Sitemap'].map(link => (
                <a key={link} href="#" className="text-[#9ca3af] no-underline transition-colors duration-200 hover:text-[var(--green)]">{link}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* SCROLL TO TOP */}
      <button 
        ref={sttRef} 
        onClick={scrollToTop}
        className="fixed bottom-[2rem] right-[2rem] z-[888] w-[48px] h-[48px] bg-[var(--green)] text-white rounded-full border-none cursor-pointer flex items-center justify-center shadow-[0_8px_24px_rgba(16,185,129,0.4)] opacity-0 pointer-events-none transition-all duration-300 [&.v]:opacity-100 [&.v]:pointer-events-auto [&.v]:animate-[bounceIn_0.5s_cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--gd)] hover:translate-y-[-3px]"
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>

      {/* DASHBOARD POST PROGRESS STYLE (Inline script equivalent but managed by React useEffect) */}
      <style>{`
        .bar-fill {
           height: 100%;
           background: var(--green);
           width: 0%;
           border-radius: 4px;
           transition: width 1.5s ease;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
