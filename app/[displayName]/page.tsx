"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notFound } from "next/navigation";
import { LinkItem } from "@/data/links";
import { UserProfile, useAuth } from "@/hooks/useAuth";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  RiLinksLine,
  RiArrowRightSLine,
  RiLoader4Line,
  RiShareLine,
  RiAlertLine,
  RiEditLine,
} from "@remixicon/react";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ displayName: string }>;
}

// Google Favicon API
function getFaviconUrl(url: string) {
  try {
    const domain = new URL(url).hostname;
    return `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
}

export default function PublicProfilePage({ params }: PageProps) {
  // Next.js 16/React 19 비동기 params 풀기
  const { displayName } = React.use(params);
  
  // 현재 로그인한 사용자 정보 조회
  const { user: currentUser } = useAuth();

  // TanStack Query로 유저 프로필 및 링크 정보 통합 조회 및 캐싱
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["publicProfile", displayName],
    queryFn: async () => {
      // 1. users 컬렉션에서 displayName이 일치하는 유저 조회
      const userQuery = query(
        collection(db, "users"),
        where("displayName", "==", displayName),
        limit(1)
      );
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        throw new Error("USER_NOT_FOUND");
      }

      const userDoc = userSnapshot.docs[0];
      const userProfile = userDoc.data() as UserProfile;
      const userId = userDoc.id;

      // 2. 해당 유저의 links 서브컬렉션 조회 (생성일 역순)
      const linksQuery = query(
        collection(db, `users/${userId}/links`),
        orderBy("createdAt", "desc")
      );
      const linksSnapshot = await getDocs(linksQuery);
      const links = linksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LinkItem[];

      return { userProfile, links, userId };
    },
    retry: false, // 404 에러일 때 불필요한 재시도 방지
  });

  // 공유 링크 복사 핸들러
  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const profileUrl = window.location.href;
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

  // 링크 클릭 시 조회수 증가 및 이동
  const handleLinkClick = async (linkId: string, url: string) => {
    // 백그라운드에서 조회수 1 증가 (원자적 increment)
    try {
      if (data?.userId && linkId) {
        const linkRef = doc(db, `users/${data.userId}/links`, linkId);
        await updateDoc(linkRef, {
          clicks: increment(1),
        });
      }
    } catch (err) {
      console.error("Failed to increment click count:", err);
    }
  };

  // 유저가 없는 에러일 경우 Next.js 404 화면 트리거
  if (isError && error instanceof Error && error.message === "USER_NOT_FOUND") {
    notFound();
  }

  // 로딩 상태 피드백 (로딩 스켈레톤 및 아름다운 애니메이션)
  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6 py-24 bg-gradient-to-b from-fuchsia-50 via-purple-50 to-violet-100 dark:from-purple-950 dark:via-violet-950 dark:to-slate-900 font-sans">
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <RiLoader4Line className="h-10 w-10 animate-spin text-fuchsia-500" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            프로필을 불러오는 중입니다...
          </p>
        </div>
      </div>
    );
  }

  // 기타 조회 에러 발생 시
  if (isError || !data) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6 py-24 bg-gradient-to-b from-fuchsia-50 via-purple-50 to-violet-100 dark:from-purple-950 dark:via-violet-950 dark:to-slate-900 font-sans">
        <div className="w-full max-w-md flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/50">
            <RiAlertLine className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            프로필 로드에 실패했습니다
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            네트워크 연결 상태를 확인하거나 잠시 후 다시 시도해주세요.
          </p>
        </div>
      </div>
    );
  }

  const { userProfile, links } = data;
  const isMyPage = !!(currentUser && data?.userId && currentUser.uid === data.userId);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center px-4 py-16 bg-gradient-to-b from-fuchsia-50 via-purple-50 to-violet-100 dark:from-purple-950 dark:via-violet-950 dark:to-slate-900 font-sans">
      {/* 본문 콘텐츠 컨테이너 */}
      <div className="w-full max-w-md flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* 상단 프로필 카드 */}
        <div className="w-full bg-white/70 dark:bg-purple-950/50 backdrop-blur-xl rounded-3xl p-6 ring-1 ring-fuchsia-200/40 dark:ring-purple-500/20 shadow-xl shadow-fuchsia-100/30 dark:shadow-none flex flex-col items-center text-center relative group/profile">
          
          {/* 공유 버튼 */}
          <Button
            onClick={handleShare}
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 h-9 w-9 rounded-full text-slate-400 hover:text-fuchsia-500 hover:bg-fuchsia-50 dark:hover:bg-purple-900/40 transition-colors"
            title="프로필 링크 공유"
          >
            <RiShareLine className="h-4 w-4" />
          </Button>

          {/* 프로필 이미지 (광채 링 효과) */}
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full shadow-lg ring-4 ring-fuchsia-200/50 dark:ring-purple-800/50 overflow-hidden mb-4 group-hover:scale-105 transition-transform duration-300">
            {userProfile.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userProfile.photoURL}
                alt={userProfile.username}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="h-full w-full rounded-full bg-gradient-to-br from-fuchsia-400 to-purple-600 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {(userProfile.username || userProfile.displayName || "?")[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* 사용자 정보 및 편집 바로가기 */}
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {userProfile.username}
            </h1>
            {isMyPage && (
              <Link
                href="/"
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-fuchsia-500 hover:text-fuchsia-700 hover:bg-fuchsia-50 dark:hover:bg-purple-900/40 transition-colors"
                title="대시보드에서 프로필 편집하기"
              >
                <RiEditLine className="h-4 w-4" />
              </Link>
            )}
          </div>
          <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mb-3">
            @{userProfile.displayName}
          </p>

          {/* 한 줄 소개 */}
          {userProfile.bio && (
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-purple-950/40 px-4 py-2 rounded-2xl w-full border border-slate-100/50 dark:border-purple-900/30">
              {userProfile.bio}
            </p>
          )}
        </div>

        {/* 링크 리스트 영역 */}
        <div className="w-full flex flex-col gap-3">
          {links.length === 0 ? (
            <div className="w-full py-12 bg-white/40 dark:bg-purple-950/20 backdrop-blur-md rounded-3xl border border-dashed border-fuchsia-200/50 dark:border-purple-800/40 text-center">
              <RiLinksLine className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-400 dark:text-slate-600">
                등록된 링크가 없습니다.
              </p>
            </div>
          ) : (
            links.map((link) => {
              const faviconUrl = getFaviconUrl(link.url);
              return (
                <Card
                  key={link.id}
                  className="border-0 bg-white/70 dark:bg-purple-950/50 backdrop-blur-xl shadow-[0_2px_10px_-3px_rgba(168,85,247,0.15)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] dark:shadow-none dark:hover:bg-purple-950/70 transition-all duration-300 ease-out group rounded-2xl overflow-hidden ring-1 ring-fuchsia-200/40 dark:ring-purple-500/20 relative hover:-translate-y-0.5 cursor-pointer"
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 w-full focus:outline-none"
                  >
                    <div className="flex items-center gap-4 w-full overflow-hidden">
                      {faviconUrl ? (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700/50 shadow-sm border border-slate-200/50 dark:border-slate-600/50 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={faviconUrl}
                            alt={`${link.title} icon`}
                            className="h-6 w-6 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700/50 shadow-sm border border-slate-200/50 dark:border-slate-600/50 overflow-hidden">
                          <RiLinksLine className="h-6 w-6 text-slate-500" />
                        </div>
                      )}
                      <div className="flex flex-col justify-center gap-0.5 w-full overflow-hidden text-left">
                        <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100 group-hover:text-black dark:group-hover:text-white transition-colors truncate">
                          {link.title}
                        </CardTitle>
                      </div>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded-full opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 shrink-0 mr-1">
                      <RiArrowRightSLine className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    </div>
                  </a>
                </Card>
              );
            })
          )}
        </div>

        {/* 하단 푸터 */}
        <div className="mt-8 flex flex-col items-center gap-1.5 text-xs text-slate-400 dark:text-slate-600 font-medium">
          <div className="flex items-center gap-1.5 font-bold text-slate-400 dark:text-slate-500">
            <RiLinksLine className="h-4 w-4 text-fuchsia-400" />
            <span>MyLink</span>
          </div>
          <p>Powered by MyLink</p>
        </div>

      </div>
    </div>
  );
}
