"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  RiGoogleLine,
  RiLogoutBoxLine,
  RiLinksLine,
  RiExternalLinkLine,
  RiLoader4Line,
  RiShareLine,
  RiEditLine,
} from "@remixicon/react";
import Link from "next/link";
import { toast } from "sonner";

export function Header() {
  const { user, userProfile, loading, signInWithGoogle, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${userProfile?.displayName ?? ""}`
      : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success("링크가 복사됐어요!", {
        description: profileUrl,
        duration: 3000,
      });
    } catch {
      toast.error("복사에 실패했습니다.", {
        description: "브라우저 권한을 확인해주세요.",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-fuchsia-100/60 dark:border-purple-800/40 bg-white/80 dark:bg-purple-950/80 backdrop-blur-xl shadow-sm shadow-fuchsia-100/30 dark:shadow-purple-900/20">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* 로고 */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg text-purple-900 dark:text-purple-100 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-colors"
        >
          <RiLinksLine className="h-5 w-5 text-fuchsia-500" />
          MyLink
        </Link>

        {/* 우측 액션 영역 */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-1.5">
              <RiLoader4Line className="h-4 w-4 animate-spin text-fuchsia-400" />
            </div>
          ) : user && userProfile ? (
            // ── 로그인 상태: 프로필 드롭다운 ──────────────────────────────────
            <div className="flex items-center gap-3">
              {/* 내 페이지 바로가기 버튼 */}
              <Link
                href={`/${userProfile.displayName}`}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-950/40 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/60 rounded-xl transition-all shadow-sm shadow-fuchsia-100/50"
              >
                <RiExternalLinkLine className="h-3.5 w-3.5" />
                <span>내 페이지</span>
              </Link>

              <div className="relative" ref={dropdownRef}>
                {/* 프로필 아바타 버튼 */}
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center rounded-full p-0.5 hover:ring-2 hover:ring-fuchsia-300 dark:hover:ring-fuchsia-600 transition-all group"
                aria-label="프로필 메뉴"
              >
                {userProfile.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.username}
                    className="h-8 w-8 rounded-full ring-2 ring-fuchsia-200 dark:ring-purple-700 group-hover:ring-fuchsia-400 dark:group-hover:ring-fuchsia-500 transition-all"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-fuchsia-400 to-purple-600 flex items-center justify-center ring-2 ring-fuchsia-200 dark:ring-purple-700">
                    <span className="text-xs font-bold text-white">
                      {(userProfile.username || "?")[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </button>

              {/* 드롭다운 패널 */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-fuchsia-100/60 dark:border-purple-700/40 bg-white/95 dark:bg-purple-950/95 backdrop-blur-xl shadow-xl shadow-fuchsia-100/30 dark:shadow-purple-900/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">

                  {/* 계정 요약 정보 */}
                  <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-purple-800/50">
                    <div className="flex items-center gap-3">
                      {userProfile.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={userProfile.photoURL}
                          alt={userProfile.username}
                          className="h-11 w-11 rounded-full ring-2 ring-fuchsia-200 dark:ring-purple-700 shrink-0"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-fuchsia-400 to-purple-600 flex items-center justify-center shrink-0">
                          <span className="text-base font-bold text-white">
                            {(userProfile.username || "?")[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {userProfile.username}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                          {userProfile.displayName}
                        </p>
                        {userProfile.bio && (
                          <p className="text-xs text-fuchsia-500 dark:text-purple-400 truncate mt-0.5">
                            {userProfile.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 메뉴 항목 */}
                  <div className="p-2 space-y-0.5">
                    {/* 내 페이지 미리보기 */}
                    <Link
                      href={`/${userProfile.displayName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-fuchsia-50 dark:hover:bg-purple-900/40 hover:text-fuchsia-700 dark:hover:text-fuchsia-300 transition-colors group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fuchsia-100 dark:bg-fuchsia-900/30 group-hover:bg-fuchsia-200 dark:group-hover:bg-fuchsia-800/40 transition-colors">
                        <RiExternalLinkLine className="h-4 w-4 text-fuchsia-600 dark:text-fuchsia-400" />
                      </div>
                      <div>
                        <p>내 페이지 미리보기</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                          퍼블릭 뷰로 확인
                        </p>
                      </div>
                    </Link>

                    {/* 링크 공유 */}
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-900/40 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40 transition-colors">
                        <RiShareLine className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="text-left">
                        <p>링크 공유</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-normal truncate max-w-[160px]">
                          {profileUrl}
                        </p>
                      </div>
                    </button>

                    <div className="my-1 border-t border-slate-100 dark:border-purple-800/50" />

                    {/* 로그아웃 */}
                    <button
                      onClick={() => { setDropdownOpen(false); signOut(); }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800/50 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                        <RiLogoutBoxLine className="h-4 w-4" />
                      </div>
                      <p>로그아웃</p>
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          ) : (
            // ── 비로그인 상태 ──────────────────────────────────────────────────
            <Button
              onClick={signInWithGoogle}
              size="sm"
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white font-semibold shadow-sm hover:shadow-fuchsia-300/40 dark:hover:shadow-fuchsia-900/40 transition-all duration-200 px-4"
            >
              <RiGoogleLine className="h-4 w-4" />
              Google로 로그인
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
