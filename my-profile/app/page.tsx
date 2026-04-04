import { Mail, Briefcase, MapPin, ExternalLink, BookOpen } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-pink-400 font-sans selection:bg-black selection:text-white flex items-center justify-center p-4 sm:p-8 overflow-hidden">
      
      {/* 메인 컨테이너 - 굵은 테두리와 꽉 찬 그림자 */}
      <main className="relative z-10 w-full max-w-2xl bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] sm:shadow-[16px_16px_0px_0px_#000] p-6 sm:p-12 transition-transform duration-100 hover:-translate-y-1 hover:translate-x-1 hover:shadow-[16px_16px_0px_0px_#000] sm:hover:shadow-[20px_20px_0px_0px_#000]">
        
        {/* 헤더 (이름 및 배지) */}
        <div className="flex flex-col gap-6 mb-8 border-b-4 border-black pb-8">
          <div className="w-fit bg-[#00E5FF] border-4 border-black px-6 py-3 shadow-[8px_8px_0px_0px_#000] transform -rotate-1 hover:rotate-0 transition-transform duration-100">
            <h1 className="text-6xl sm:text-8xl font-black text-black tracking-tight leading-none uppercase">
              이정근
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 bg-yellow-300 border-2 border-black px-4 py-2 text-sm sm:text-base font-black text-black shadow-[4px_4px_0px_0px_#000] transition-transform hover:-translate-y-0.5">
              <Briefcase className="h-5 w-5" />
              Vibe Coding Student
            </span>
            <span className="inline-flex items-center gap-2 bg-emerald-400 border-2 border-black px-4 py-2 text-sm sm:text-base font-black text-black shadow-[4px_4px_0px_0px_#000] transition-transform hover:-translate-y-0.5">
              <MapPin className="h-5 w-5" />
              한양대학교
            </span>
          </div>
        </div>

        {/* 자기소개 섹션 */}
        <div className="mb-10">
          <p className="text-xl sm:text-2xl font-bold leading-relaxed text-black">
            안녕하세요! 한양대 아이디어를 혁신으로 - 바이브 코딩 실습 프로젝트를 진행하고 있는 대학생입니다. 
            새로운 기술을 탐구하고 직관적이며 강렬한 사용자 경험 (UX)을 만드는 것에 열정이 있습니다.
          </p>
        </div>

        {/* 경력 및 학력 섹션 */}
        <div className="mb-10 flex flex-col gap-4">
          <h2 className="text-2xl font-black uppercase text-black border-l-8 border-black pl-3 mb-2">경력 및 학력</h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_#000] transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000]">
              <span className="font-bold text-black text-lg order-2 sm:order-1 break-keep">(주)에이플러스에셋 어드바이저 인사팀 재직</span>
              <span className="text-sm font-black bg-black text-white px-3 py-1.5 order-1 sm:order-2 mb-3 sm:mb-0 w-fit shrink-0">2020.08 ~ 2024.07</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_#000] transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000]">
              <span className="font-bold text-black text-lg order-2 sm:order-1 break-keep">(주)한국KS고용정보</span>
              <span className="text-sm font-black bg-black text-white px-3 py-1.5 order-1 sm:order-2 mb-3 sm:mb-0 w-fit shrink-0">2024.08 ~ 2024.10</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-4 border-black p-4 bg-yellow-300 shadow-[4px_4px_0px_0px_#000] transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000]">
              <span className="font-bold text-black text-lg order-2 sm:order-1 break-keep">한양대학교(서울) 산업융합학부 재학(졸업예정)</span>
              <span className="text-sm font-black bg-black text-white px-3 py-1.5 order-1 sm:order-2 mb-3 sm:mb-0 w-fit shrink-0">2024.03 ~ 2027.02</span>
            </div>
          </div>
        </div>

        {/* 링크 섹션 */}
        <div className="flex flex-col gap-5">
          <a
            href="https://github.com/Geun-ni"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between bg-white border-4 border-black p-4 sm:p-6 transition-all duration-100 hover:bg-cyan-300 hover:-translate-y-1 hover:translate-x-1 shadow-[4px_4px_0px_0px_#000] sm:shadow-[8px_8px_0px_0px_#000] hover:shadow-[8px_8px_0px_0px_#000] sm:hover:shadow-[12px_12px_0px_0px_#000] outline-none focus:ring-4 focus:ring-black"
          >
             <div className="flex items-center gap-4">
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
                  className="h-10 w-10 text-black group-hover:scale-110 transition-transform duration-100"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-2xl sm:text-3xl font-black text-black">GitHub</span>
                  <span className="text-sm font-bold text-black border-2 border-black bg-white px-2 w-fit mt-1 group-hover:bg-cyan-100 transition-colors">@Geun-ni</span>
                </div>
             </div>
             <ExternalLink className="h-8 w-8 text-black opacity-50 group-hover:opacity-100 transition-all group-hover:rotate-12 group-hover:scale-110" />
          </a>

          <a
            href="mailto:contact@example.com"
            className="group flex items-center justify-between bg-white border-4 border-black p-4 sm:p-6 transition-all duration-100 hover:bg-orange-500 hover:-translate-y-1 hover:translate-x-1 shadow-[4px_4px_0px_0px_#000] sm:shadow-[8px_8px_0px_0px_#000] hover:shadow-[8px_8px_0px_0px_#000] sm:hover:shadow-[12px_12px_0px_0px_#000] outline-none focus:ring-4 focus:ring-black"
          >
             <div className="flex items-center gap-4">
                <Mail className="h-10 w-10 text-black group-hover:scale-110 transition-transform duration-100 group-hover:text-white" />
                <div className="flex flex-col">
                  <span className="text-2xl sm:text-3xl font-black text-black group-hover:text-white transition-colors">Email</span>
                  <span className="text-sm font-bold text-black bg-white border-2 border-black px-2 w-fit mt-1 group-hover:bg-orange-100 transition-colors">Send me a message</span>
                </div>
             </div>
             <ExternalLink className="h-8 w-8 text-black opacity-50 group-hover:opacity-100 group-hover:text-white transition-all group-hover:rotate-12 group-hover:scale-110" />
          </a>
          <a
            href="https://blog.naver.com/gueni_i"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between bg-white border-4 border-black p-4 sm:p-6 transition-all duration-100 hover:bg-[#03C75A] hover:-translate-y-1 hover:translate-x-1 shadow-[4px_4px_0px_0px_#000] sm:shadow-[8px_8px_0px_0px_#000] hover:shadow-[8px_8px_0px_0px_#000] sm:hover:shadow-[12px_12px_0px_0px_#000] outline-none focus:ring-4 focus:ring-black"
          >
             <div className="flex items-center gap-4">
                <BookOpen className="h-10 w-10 text-black group-hover:scale-110 transition-transform duration-100 group-hover:text-white" />
                <div className="flex flex-col">
                  <span className="text-2xl sm:text-3xl font-black text-black group-hover:text-white transition-colors">네이버 블로그</span>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-sm font-bold text-black border-2 border-black bg-white px-2 py-0.5 w-fit group-hover:border-white transition-colors">그니 (gueni_i)</span>
                    <span className="text-sm font-bold text-black bg-[#C2F5D6] px-2 py-0.5 border-2 border-black w-fit group-hover:border-black transition-colors">대충 열심히 삽시다</span>
                  </div>
                </div>
             </div>
             <ExternalLink className="h-8 w-8 text-black opacity-50 group-hover:opacity-100 group-hover:text-white transition-all group-hover:rotate-12 group-hover:scale-110 hidden sm:block" />
          </a>
        </div>
      </main>

      {/* 배경 꾸밈 요소들 */}
      <div className="absolute top-10 left-10 hidden lg:block border-4 border-black bg-yellow-300 w-24 h-24 rounded-full shadow-[8px_8px_0px_0px_#000]"></div>
      <div className="absolute top-40 right-20 hidden lg:block border-4 border-black bg-blue-500 w-16 h-16 transform rotate-12 shadow-[8px_8px_0px_0px_#000]"></div>
      <div className="absolute bottom-20 left-20 hidden lg:block border-4 border-black bg-emerald-400 w-32 h-8 transform -rotate-6 shadow-[8px_8px_0px_0px_#000]"></div>

      {/* 푸터 크레딧 */}
      <div className="absolute bottom-6 right-6 bg-black text-white px-4 py-2 font-bold transform -rotate-3 border-2 border-white shadow-[4px_4px_0px_0px_#fff] text-sm sm:text-base z-20">
        Crafted with Vibe Coding
      </div>
    </div>
  );
}
