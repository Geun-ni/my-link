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
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6 py-24 bg-transparent font-sans">
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <RiLoader4Line className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            프로필을 불러오는 중입니다...
          </p>
        </div>
      </div>
    );
  }

  // 기타 조회 에러 발생 시
  if (isError || !data) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6 py-24 bg-transparent font-sans">
        <div className="w-full max-w-md flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 dark:bg-red-950/10 shadow-sm">
            <RiAlertLine className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            프로필 로드에 실패했습니다
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            네트워크 연결 상태를 확인하거나 잠시 후 다시 시도해주세요.
          </p>
        </div>
      </div>
    );
  }

  const { userProfile, links } = data;
  const isMyPage = !!(currentUser && data?.userId && currentUser.uid === data.userId);

  // position 오름차순 정렬, position이 없으면 기존처럼 createdAt 역순 정렬
  const sortedLinks = [...links].sort((a, b) => {
    const aPos = a.position !== undefined ? a.position : 999999;
    const bPos = b.position !== undefined ? b.position : 999999;
    if (aPos !== bPos) return aPos - bPos;

    const aTime = a.createdAt ? ((a.createdAt as any).seconds || 0) : 0;
    const bTime = b.createdAt ? ((b.createdAt as any).seconds || 0) : 0;
    return bTime - aTime;
  });

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center px-4 py-16 bg-transparent font-sans">
      {/* 내 페이지 전용 배경 오로라 그라데이션 데코레이션 (중앙 집중형) */}
      <div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none flex items-center justify-center">
        {/* 중앙 약간 왼쪽에 은은한 인디핑크 / 로즈 그라데이션 원 (다크모드: 딥 퓨샤/퍼플) */}
        <div className="absolute w-[90%] max-w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-rose-200/35 to-pink-200/35 dark:from-fuchsia-950/20 dark:to-purple-950/15 blur-[120px] -translate-x-[15%] -translate-y-[10%]" />
        {/* 중앙 약간 오른쪽에 은은한 연분홍 / 샌드 그라데이션 원 (다크모드: 딥 인디고/슬레이트) */}
        <div className="absolute w-[90%] max-w-[500px] h-[500px] rounded-full bg-gradient-to-br from-pink-200/25 to-amber-100/20 dark:from-indigo-950/15 dark:to-slate-900/10 blur-[120px] translate-x-[15%] translate-y-[10%]" />
      </div>

      {/* 본문 콘텐츠 컨테이너 */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* 상단 프로필 카드 (깔끔한 불투명 백그라운드) */}
        <div className="w-full bg-white dark:bg-slate-900 rounded-3xl p-6 border border-white/80 dark:border-slate-800/80 shadow-xl flex flex-col items-center text-center relative group/profile">
          
          {/* 공유 버튼 */}
          <Button
            onClick={handleShare}
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 h-9 w-9 rounded-full text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
            title="프로필 링크 공유"
          >
            <RiShareLine className="h-4 w-4" />
          </Button>

          {/* 프로필 이미지 - 깔끔하게 정돈된 아바타 */}
          <div className="relative mb-4 shrink-0">
            {/* 실제 프로필 이미지 영역 */}
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full overflow-hidden border border-white/30 dark:border-white/10 shadow-sm bg-white dark:bg-slate-900 transition-transform duration-300 hover:scale-105">
              {userProfile.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.username}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="h-full w-full rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                  <span className="text-3xl font-black text-white">
                    {(userProfile.username || userProfile.displayName || "?")[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 사용자 정보 및 편집 바로가기 */}
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              {userProfile.username}
            </h1>
            {isMyPage && (
              <Link
                href="/"
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:text-primary hover:bg-primary/10 border border-border transition-colors"
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
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed bg-white/40 dark:bg-slate-900/40 px-4 py-2 rounded-2xl w-full border border-white/10 dark:border-slate-800/20 whitespace-pre-wrap">
              {userProfile.bio}
            </p>
          )}
        </div>

        {/* 링크 리스트 영역 */}
        <div className="w-full flex flex-col gap-3.5">
          {sortedLinks.length === 0 ? (
            <div className="w-full py-12 bg-card border border-dashed border-border rounded-3xl text-center shadow-sm">
              <RiLinksLine className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-500">
                등록된 링크가 없습니다.
              </p>
            </div>
          ) : (
            sortedLinks.map((link) => {
              const faviconUrl = getFaviconUrl(link.url);
              return (
                 <Card
                   key={link.id}
                   className="border border-white/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all duration-300 group rounded-2xl overflow-hidden relative cursor-pointer ring-0"
                 >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleLinkClick(link.id, link.url)}
                    className="flex items-center justify-between py-3 px-4 w-full focus:outline-none"
                  >
                    <div className="flex items-center gap-4 w-full overflow-hidden">
                      {faviconUrl ? (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50 border border-border overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={faviconUrl}
                            alt={`${link.title} icon`}
                            className="h-5 w-5 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50 border border-border overflow-hidden">
                          <RiLinksLine className="h-5 w-5 text-primary shrink-0" />
                        </div>
                      )}
                      <div className="flex flex-col justify-center gap-0.5 w-full overflow-hidden text-left">
                        <CardTitle className="text-base font-bold text-foreground group-hover:underline transition-all truncate">
                          {link.title}
                        </CardTitle>
                      </div>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 p-1.5 rounded-full opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 shrink-0 mr-1">
                      <RiArrowRightSLine className="h-5 w-5 text-primary" />
                    </div>
                  </a>
                </Card>
              );
            })
          )}
        </div>

        {/* 하단 푸터 */}
        <div className="mt-8 flex flex-col items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold">
          <div className="flex items-center gap-1.5 font-black text-primary">
            <RiLinksLine className="h-4 w-4 shrink-0" />
            <span>MyLink</span>
          </div>
          <p className="font-normal text-slate-400 dark:text-slate-600">Powered by MyLink</p>
        </div>

      </div>
    </div>
  );
}
