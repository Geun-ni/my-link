"use client";

import { useState, useEffect, useRef } from "react";
import { LinkItem } from "@/data/links";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";
import {
  RiLinksLine,
  RiArrowRightSLine,
  RiAddLine,
  RiLoader4Line,
  RiEditLine,
  RiDeleteBinLine,
  RiGoogleLine,
  RiLockLine,
} from "@remixicon/react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

function getFaviconUrl(url: string) {
  try {
    const domain = new URL(url).hostname;
    return `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
}

function formatUpdatedAt(updatedAt?: LinkItem["updatedAt"]): string | null {
  if (!updatedAt) return null;
  const date =
    updatedAt instanceof Date
      ? updatedAt
      : (updatedAt as { toDate: () => Date }).toDate?.();
  if (!date) return null;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return "방금 수정";
  if (diffMin < 60) return `${diffMin}분 전 수정`;
  if (diffHour < 24) return `${diffHour}시간 전 수정`;
  if (diffDay < 7) return `${diffDay}일 전 수정`;
  return `${date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })} 수정`;
}

const linkSchema = z.object({
  title: z.string().min(1, "타이틀을 입력해주세요."),
  url: z
    .string()
    .min(1, "URL을 입력해주세요.")
    .superRefine((val, ctx) => {
      let formattedUrl = val.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      try {
        const parsed = new URL(formattedUrl);

        const rawDomain = val
          .trim()
          .replace(/^https?:\/\//i, "")
          .split("/")[0];
        if (parsed.hostname !== "localhost" && !rawDomain.includes(".")) {
          throw new Error("Invalid domain format");
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "올바른 URL 형식이 아닙니다.",
        });
      }
    }),
});

type LinkFormValues = z.infer<typeof linkSchema>;

function LinkItemCard({
  link,
  userId,
  onUpdateSuccess,
  onDeleteSuccess,
}: {
  link: LinkItem;
  userId: string;
  onUpdateSuccess: (id: string, data: Partial<LinkItem>) => void;
  onDeleteSuccess: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isCancellingRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      title: link.title,
      url: link.url,
    },
  });

  const onUpdate = async (data: LinkFormValues) => {
    let formattedUrl = data.url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    setIsSubmitting(true);
    try {
      if (!link.id) return;
      await updateDoc(doc(db, `users/${userId}/links`, link.id), {
        title: data.title.trim(),
        url: formattedUrl,
        updatedAt: serverTimestamp(),
      });
      onUpdateSuccess(link.id, {
        title: data.title.trim(),
        url: formattedUrl,
        updatedAt: new Date(),
      });
      setIsEditing(false);
    } catch (e) {
      console.error("Error updating document: ", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    isCancellingRef.current = true;
    reset();
    setIsEditing(false);
    setTimeout(() => {
      isCancellingRef.current = false;
    }, 0);
  };

  const handleFormBlur = (e: React.FocusEvent<HTMLFormElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (isCancellingRef.current) return;
    if (isSubmitting) return;
    handleSubmit(onUpdate)();
  };

  const onDelete = async () => {
    setIsDeleting(true);
    try {
      if (!link.id) return;
      await deleteDoc(doc(db, `users/${userId}/links`, link.id));
      onDeleteSuccess(link.id);
      setIsDeleteDialogOpen(false);
    } catch (e) {
      console.error("Error deleting document: ", e);
    } finally {
      setIsDeleting(false);
    }
  };

  const faviconUrl = getFaviconUrl(link.url);

  if (isEditing) {
    return (
      <Card className="border-0 bg-fuchsia-50/80 dark:bg-purple-950/60 backdrop-blur-xl shadow-sm rounded-[1.25rem] overflow-hidden ring-1 ring-fuchsia-200/50 dark:ring-purple-500/20 p-4 relative">
        <form
          onSubmit={handleSubmit(onUpdate)}
          onBlur={handleFormBlur}
          className="space-y-4"
        >
          <div className="space-y-1">
            <Input
              placeholder="타이틀"
              {...register("title")}
              className={`h-11 rounded-xl bg-white/70 dark:bg-purple-950/70 transition-colors ${errors.title ? "border-red-500 focus-visible:ring-red-500" : "border-fuchsia-200/60 dark:border-purple-700/50"}`}
            />
            {errors.title && (
              <p className="text-xs text-red-500 ml-1">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Input
              type="text"
              placeholder="URL"
              {...register("url")}
              className={`h-11 rounded-xl bg-white/70 dark:bg-purple-950/70 transition-colors ${errors.url ? "border-red-500 focus-visible:ring-red-500" : "border-fuchsia-200/60 dark:border-purple-700/50"}`}
              dir="ltr"
            />
            {errors.url && (
              <p className="text-xs text-red-500 ml-1">{errors.url.message}</p>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg h-10 px-4 font-medium"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-lg h-10 px-4 font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <RiLoader4Line className="h-4 w-4 animate-spin mr-1.5" />
              ) : null}
              저장
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white/70 dark:bg-purple-950/50 backdrop-blur-xl shadow-[0_2px_10px_-3px_rgba(168,85,247,0.15)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] dark:shadow-none dark:hover:bg-purple-950/70 transition-all duration-300 ease-out group/card rounded-[1.25rem] overflow-hidden ring-1 ring-fuchsia-200/40 dark:ring-purple-500/20 relative hover:-translate-y-1">
      <div className="flex items-center">
        <Link
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 rounded-[1.25rem] flex items-center justify-between group overflow-hidden"
        >
          <div className="flex items-center gap-4 z-10 w-full overflow-hidden">
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
            <div className="flex flex-col justify-center gap-0.5 z-10 w-full overflow-hidden">
              <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100 group-hover:text-black dark:group-hover:text-white transition-colors truncate">
                {link.title}
              </CardTitle>
              {formatUpdatedAt(link.updatedAt) && (
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                  {formatUpdatedAt(link.updatedAt)}
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded-full opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 hidden sm:block shrink-0 mr-1">
            <RiArrowRightSLine className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </div>
        </Link>

        {/* Edit and Delete Buttons */}
        <div className="pr-4 pl-1 flex items-center gap-0.5 shrink-0 z-20 relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="h-10 w-10 sm:h-9 sm:w-9 rounded-full text-fuchsia-400 hover:text-fuchsia-700 dark:hover:text-fuchsia-300 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30 transition-colors"
          >
            <RiEditLine className="h-5 w-5" />
            <span className="sr-only">수정</span>
          </Button>

          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={(open) => {
              if (isDeleting) return;
              setIsDeleteDialogOpen(open);
            }}
          >
            <DialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 sm:h-9 sm:w-9 rounded-full text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                >
                  <RiDeleteBinLine className="h-5 w-5" />
                  <span className="sr-only">삭제</span>
                </Button>
              }
            />
            <DialogContent className="sm:max-w-sm rounded-2xl p-6">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-center text-xl font-bold">
                  정말 삭제하시겠습니까?
                </DialogTitle>
              </DialogHeader>
              <div className="py-2 text-center space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="font-semibold text-lg text-slate-900 dark:text-slate-100 break-all line-clamp-2">
                    {link.title}
                  </p>
                </div>
                <p className="font-bold text-red-500 flex items-center justify-center gap-1.5">
                  이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
              <DialogFooter className="gap-2 sm:gap-2 sm:justify-center mt-6">
                <Button
                  variant="outline"
                  className="rounded-xl h-12 flex-1 font-semibold"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isDeleting}
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-xl h-12 flex-1 font-semibold"
                  onClick={onDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <RiLoader4Line className="h-5 w-5 animate-spin mr-2" />
                  ) : null}
                  {isDeleting ? "삭제 중..." : "삭제하기"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  );
}

// ─── 비로그인 상태 화면 ────────────────────────────────────────────────────────
function LoginPrompt({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6 py-24 bg-gradient-to-b from-fuchsia-50 via-purple-50 to-violet-100 dark:from-purple-950 dark:via-violet-950 dark:to-slate-900">
      <div className="w-full max-w-md flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {/* 아이콘 */}
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-xl shadow-fuchsia-300/40 dark:shadow-fuchsia-900/40">
            <RiLockLine className="h-12 w-12 text-white" />
          </div>
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-fuchsia-400 to-purple-500 opacity-20 blur-xl" />
        </div>

        {/* 안내 문구 */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-purple-950 dark:text-white">
            MyLink에 오신 걸 환영합니다
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
            나만의 링크 페이지를 만들고, 하나의 URL로
            <br />
            모든 SNS와 웹사이트를 한 번에 공유하세요.
          </p>
        </div>

        {/* 기능 소개 */}
        <div className="w-full grid gap-3">
          {[
            { icon: "🔗", title: "링크 한 곳에 모아두기", desc: "여러 링크를 하나의 페이지에 정리" },
            { icon: "✏️", title: "인라인 편집", desc: "클릭 한 번으로 즉시 수정" },
            { icon: "📤", title: "간편한 공유", desc: "고유 URL로 누구에게나 공유" },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/70 dark:bg-purple-950/50 backdrop-blur-xl ring-1 ring-fuchsia-200/40 dark:ring-purple-500/20 shadow-sm"
            >
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 구글 로그인 버튼 */}
        <Button
          onClick={onSignIn}
          size="lg"
          className="w-full h-14 rounded-2xl text-base font-bold bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white shadow-lg shadow-fuchsia-300/40 dark:shadow-fuchsia-900/40 hover:shadow-xl hover:shadow-fuchsia-300/50 hover:-translate-y-0.5 transition-all duration-200 gap-3"
        >
          <RiGoogleLine className="h-5 w-5" />
          Google로 시작하기
        </Button>

        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          로그인하면 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}

// ─── 메인 대시보드 (로그인 후) ────────────────────────────────────────────────
export default function Page() {
  const { user, userProfile, loading: authLoading, signInWithGoogle } = useAuth();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 로그인 상태가 변경될 때마다 링크 재조회
  useEffect(() => {
    if (!user) {
      setLinks([]);
      return;
    }

    const fetchLinks = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, `users/${user.uid}/links`),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const linksData = querySnapshot.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as LinkItem[];
        setLinks(linksData);
      } catch (error) {
        console.error("Error fetching links:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinks();
  }, [user]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      title: "",
      url: "",
    },
  });

  const onSubmit = async (data: LinkFormValues) => {
    if (!user) return;

    let formattedUrl = data.url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    setIsOpen(false);
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, `users/${user.uid}/links`), {
        title: data.title.trim(),
        url: formattedUrl,
        clicks: 0,
        createdAt: serverTimestamp(),
      });

      const newLink: LinkItem = {
        id: docRef.id,
        title: data.title.trim(),
        url: formattedUrl,
        clicks: 0,
      };

      setLinks((prev) => [newLink, ...prev]);
      reset();
    } catch (e) {
      console.error("Error adding document: ", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 전체 로딩 (Auth 초기화 중) ──────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gradient-to-b from-fuchsia-50 via-purple-50 to-violet-100 dark:from-purple-950 dark:via-violet-950 dark:to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <RiLoader4Line className="h-10 w-10 animate-spin text-fuchsia-500" />
          <p className="text-sm text-slate-500 dark:text-slate-400">불러오는 중...</p>
        </div>
      </div>
    );
  }

  // ── 비로그인 상태 ────────────────────────────────────────────────────────────
  if (!user || !userProfile) {
    return <LoginPrompt onSignIn={signInWithGoogle} />;
  }

  // ── 로그인 상태 대시보드 ──────────────────────────────────────────────────────
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center py-16 px-6 bg-gradient-to-b from-fuchsia-50 via-purple-50 to-violet-100 dark:from-purple-950 dark:via-violet-950 dark:to-slate-900 selection:bg-fuchsia-200 dark:selection:bg-purple-800">
      <div className="w-full max-w-[420px] flex flex-col items-center gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Profile Section */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="group relative flex h-28 w-28 items-center justify-center rounded-full shadow-md ring-4 ring-fuchsia-200 dark:ring-purple-800 transition-transform duration-300 hover:scale-105 overflow-hidden">
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
          <div className="space-y-1 mt-1">
            {/* username: Google 계정 실제 이름 */}
            <h1 className="text-2xl font-extrabold tracking-tight text-purple-950 dark:text-white">
              {userProfile.username}
            </h1>
            {/* displayName: 이메일 앞부분 */}
            <p className="text-sm text-slate-400 dark:text-slate-500 font-mono">
              {userProfile.displayName}
            </p>
            {/* bio: 있을 때만 표시 */}
            {userProfile.bio && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {userProfile.bio}
              </p>
            )}
          </div>
        </div>


        {/* Links Section */}
        <div className="w-full flex flex-col gap-4">

          {/* Add Link Dialog Trigger */}
          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              if (isSubmitting) return;
              setIsOpen(open);
              if (!open) reset();
            }}
          >
            <DialogTrigger
              render={
                <Button
                  disabled={isSubmitting}
                  className="w-full group rounded-[1.25rem] h-14 bg-white/80 dark:bg-purple-950/80 backdrop-blur-md border border-fuchsia-200/60 dark:border-purple-700/60 hover:bg-fuchsia-50 dark:hover:bg-purple-900/60 text-fuchsia-700 dark:text-purple-200 mb-4 transition-all duration-500 shadow-sm hover:shadow-[0_8px_30px_rgba(168,85,247,0.12)] dark:hover:shadow-[0_8px_30px_rgba(168,85,247,0.08)] hover:-translate-y-1 relative overflow-hidden"
                />
              }
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-fuchsia-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              <div className="absolute inset-0 ring-1 ring-inset ring-transparent group-hover:ring-fuchsia-400/30 dark:group-hover:ring-purple-400/30 rounded-[1.25rem] transition-colors duration-500" />
              {isSubmitting ? (
                <>
                  <RiLoader4Line className="mr-2 h-6 w-6 text-fuchsia-500 dark:text-purple-400 opacity-80 animate-spin" />
                  <span className="font-semibold tracking-wide text-fuchsia-700 dark:text-purple-200">
                    추가 중...
                  </span>
                </>
              ) : (
                <>
                  <RiAddLine className="mr-2 h-6 w-6 text-fuchsia-500 dark:text-purple-400 opacity-80 group-hover:rotate-90 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500 ease-out" />
                  <span className="font-semibold tracking-wide text-fuchsia-700 dark:text-purple-200 group-hover:text-fuchsia-900 dark:group-hover:text-white transition-all duration-500">
                    새로운 링크 추가하기
                  </span>
                </>
              )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl p-6">
              <DialogHeader>
                <DialogTitle className="text-center text-xl font-bold">
                  링크 추가
                </DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6 mt-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    타이틀
                  </Label>
                  <Input
                    id="title"
                    placeholder="예: 내 포트폴리오"
                    {...register("title")}
                    className={`h-12 rounded-xl transition-colors ${errors.title ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 animate-in fade-in slide-in-from-top-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-sm font-medium">
                    URL
                  </Label>
                  <Input
                    id="url"
                    type="text"
                    placeholder="예: example.com"
                    {...register("url")}
                    className={`h-12 rounded-xl transition-colors ${errors.url ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    dir="ltr"
                  />
                  {errors.url && (
                    <p className="text-sm text-red-500 animate-in fade-in slide-in-from-top-1">
                      {errors.url.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl font-semibold text-md"
                  disabled={isSubmitting}
                >
                  저장하기
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Link List */}
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card
                  key={`skeleton-${i}`}
                  className="border-0 bg-fuchsia-50/60 dark:bg-purple-950/40 backdrop-blur-xl shadow-sm rounded-[1.25rem] overflow-hidden ring-1 ring-fuchsia-100/50 dark:ring-purple-700/20 animate-pulse"
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700/50"></div>
                      <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700/50"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            : links.map((link) => (
                <LinkItemCard
                  key={link.id}
                  link={link}
                  userId={user.uid}
                  onUpdateSuccess={(id, updatedData) => {
                    setLinks((prev) =>
                      prev.map((l) =>
                        l.id === id ? { ...l, ...updatedData } : l
                      )
                    );
                  }}
                  onDeleteSuccess={(id) => {
                    setLinks((prev) => prev.filter((l) => l.id !== id));
                  }}
                />
              ))}

          {/* 링크가 없을 때 빈 상태 */}
          {!isLoading && links.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-fuchsia-100 dark:bg-purple-900/40">
                <RiLinksLine className="h-8 w-8 text-fuchsia-400 dark:text-purple-400" />
              </div>
              <p className="text-base font-semibold text-slate-600 dark:text-slate-300">
                아직 링크가 없어요
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                위 버튼을 눌러 첫 번째 링크를 추가해보세요!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
