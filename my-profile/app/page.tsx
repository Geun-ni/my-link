'use client';

import { motion } from 'framer-motion';
import { Mail, Sparkles, Briefcase, ChevronRight, CornerDownRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 font-sans selection:bg-indigo-500/30">
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] h-[80%] w-[80%] rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute -bottom-[40%] -right-[20%] h-[80%] w-[80%] rounded-full bg-emerald-600/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] h-[40%] w-[40%] rounded-full bg-purple-600/15 blur-[100px]" />
      </div>

      <main className="relative z-10 flex min-h-[100dvh] w-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-8 sm:p-10 shadow-[0_0_80px_-20px_rgba(79,70,229,0.3)] backdrop-blur-2xl ring-1 ring-white/5"
        >
          {/* Avatar Area */}
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
              className="relative mb-6 flex h-32 w-32 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-xl"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent shadow-[inset_0_0_20px_rgba(255,255,255,0.3)]"></div>
              <span className="text-5xl font-black tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">이</span>
              <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-neutral-900 bg-emerald-500 z-10">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
            >
              이정근
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mb-6 flex items-center justify-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-5 py-1.5 text-sm font-semibold tracking-wide text-indigo-300 backdrop-blur-sm"
            >
              <Briefcase className="h-4 w-4" />
              <span>Vibe Coding Student</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mb-10 text-center text-[15px] leading-relaxed text-neutral-300 sm:text-base sm:px-4"
            >
              안녕하세요! 바이브 코딩을 배우고 있는 대학생입니다. 
              새로운 기술을 탐구하고 직관적이며 아름다운 사용자 경험 (UX)을 만드는 것에 열정이 있습니다.
            </motion.p>
          </div>

          {/* Links Area */}
          <div className="flex flex-col gap-3.5">
            <motion.a
              href="https://github.com/Geun-ni"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-white/5 bg-white/5 px-4 py-4 transition-all hover:border-indigo-500/30 hover:bg-white/10 hover:shadow-[0_0_20px_-5px_rgba(79,70,229,0.3)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white transition-all duration-300 group-hover:bg-[#24292e] group-hover:scale-110">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-white">GitHub</span>
                  <span className="text-xs text-neutral-400 group-hover:text-indigo-200 transition-colors">@Geun-ni</span>
                </div>
              </div>
              <CornerDownRight className="relative h-5 w-5 text-neutral-500 transition-all duration-300 group-hover:-rotate-45 group-hover:text-white" />
            </motion.a>

            <motion.a
              href="mailto:contact@example.com"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-white/5 bg-white/5 px-4 py-4 transition-all hover:border-pink-500/30 hover:bg-white/10 hover:shadow-[0_0_20px_-5px_rgba(236,72,153,0.3)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white transition-all duration-300 group-hover:bg-pink-500 group-hover:scale-110 shadow-pink-500/20">
                  <Mail className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-white">Email</span>
                  <span className="text-xs text-neutral-400 group-hover:text-pink-200 transition-colors">Send me a message</span>
                </div>
              </div>
              <CornerDownRight className="relative h-5 w-5 text-neutral-500 transition-all duration-300 group-hover:-rotate-45 group-hover:text-white" />
            </motion.a>
          </div>
        </motion.div>
        
        {/* Footer Credit */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-6 text-xs text-neutral-500 tracking-wide"
        >
          Crafted with Vibe Coding
        </motion.div>
      </main>
    </div>
  );
}
