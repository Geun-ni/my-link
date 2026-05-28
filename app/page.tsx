"use client";

import { useState, useEffect, useRef } from "react";
import { LinkItem } from "@/data/links";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
import { RiLinksLine, RiArrowRightSLine, RiAddLine, RiLoader4Line, RiEditLine, RiDeleteBinLine } from "@remixicon/react";

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
  const date = updatedAt instanceof Date ? updatedAt : (updatedAt as { toDate: () => Date }).toDate?.();
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
  url: z.string().min(1, "URL을 입력해주세요.").superRefine((val, ctx) => {
    let formattedUrl = val.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }
    try {
      const parsed = new URL(formattedUrl);
      
      const rawDomain = val.trim().replace(/^https?:\/\//i, '').split('/')[0];
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
  onUpdateSuccess, 
  onDeleteSuccess 
}: { 
  link: LinkItem; 
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
      await updateDoc(doc(db, "users/anonymous/links", link.id), {
        title: data.title.trim(),
        url: formattedUrl,
        updatedAt: serverTimestamp(),
      });
      onUpdateSuccess(link.id, { title: data.title.trim(), url: formattedUrl, updatedAt: new Date() });
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
    // 다음 tick에 플래그 초기화
    setTimeout(() => { isCancellingRef.current = false; }, 0);
  };

  const handleFormBlur = (e: React.FocusEvent<HTMLFormElement>) => {
    // 포커스가 폼 내부 요소로 이동하는 경우는 무시
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    // 취소 중이면 무시
    if (isCancellingRef.current) return;
    // 이미 저장 중이면 무시
    if (isSubmitting) return;
    // 폼 외부 클릭 시 저장 시도
    handleSubmit(onUpdate)();
  };

  const onDelete = async () => {
    setIsDeleting(true);
    try {
      if (!link.id) return;
      await deleteDoc(doc(db, "users/anonymous/links", link.id));
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
        <form onSubmit={handleSubmit(onUpdate)} onBlur={handleFormBlur} className="space-y-4">
          <div className="space-y-1">
            <Input 
              placeholder="타이틀" 
              {...register("title")}
              className={`h-11 rounded-xl bg-white/70 dark:bg-purple-950/70 transition-colors ${errors.title ? "border-red-500 focus-visible:ring-red-500" : "border-fuchsia-200/60 dark:border-purple-700/50"}`}
            />
            {errors.title && <p className="text-xs text-red-500 ml-1">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <Input 
              type="text"
              placeholder="URL" 
              {...register("url")}
              className={`h-11 rounded-xl bg-white/70 dark:bg-purple-950/70 transition-colors ${errors.url ? "border-red-500 focus-visible:ring-red-500" : "border-fuchsia-200/60 dark:border-purple-700/50"}`}
              dir="ltr"
            />
            {errors.url && <p className="text-xs text-red-500 ml-1">{errors.url.message}</p>}
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
              {isSubmitting ? <RiLoader4Line className="h-4 w-4 animate-spin mr-1.5" /> : null}
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
                <img src={faviconUrl} alt={`${link.title} icon`} className="h-6 w-6 object-contain" />
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
          
          {/* Hover Arrow Indicator - Hidden on smaller screens to leave space for buttons */}
          <div className="bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded-full opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 hidden sm:block shrink-0 mr-1">
            <RiArrowRightSLine className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </div>
        </Link>

        {/* Edit and Delete Buttons - Always visible */}
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
          
          <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
            // 삭제 진행 중에는 다이얼로그를 닫지 않음
            if (isDeleting) return;
            setIsDeleteDialogOpen(open);
          }}>
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
                <DialogTitle className="text-center text-xl font-bold">정말 삭제하시겠습니까?</DialogTitle>
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
                  {isDeleting ? <RiLoader4Line className="h-5 w-5 animate-spin mr-2" /> : null}
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

export default function Page() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const q = query(collection(db, "users/anonymous/links"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const linksData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as LinkItem[];
        setLinks(linksData);
      } catch (error) {
        console.error("Error fetching links:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLinks();
  }, []);

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
    let formattedUrl = data.url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    setIsOpen(false);
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "users/anonymous/links"), {
        title: data.title.trim(),
        url: formattedUrl,
        clicks: 0,
        createdAt: serverTimestamp()
      });
      
      const newLink: LinkItem = {
        id: docRef.id,
        title: data.title.trim(),
        url: formattedUrl,
        clicks: 0
      };
      
      setLinks((prev) => [newLink, ...prev]);
      reset();
    } catch (e) {
      console.error("Error adding document: ", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center py-24 px-6 bg-gradient-to-b from-fuchsia-50 via-purple-50 to-violet-100 dark:from-purple-950 dark:via-violet-950 dark:to-slate-900 selection:bg-fuchsia-200 dark:selection:bg-purple-800">
      <div className="w-full max-w-[420px] flex flex-col items-center gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Profile Section */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="group relative flex h-28 w-28 items-center justify-center rounded-full shadow-md ring-4 ring-fuchsia-200 dark:ring-purple-800 transition-transform duration-300 hover:scale-105 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://github.com/Geun-ni.png"
              alt="Github Profile"
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <div className="space-y-1.5 mt-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-purple-950 dark:text-white">
              @Geun-ni
            </h1>
            <a href="mailto:wjdrms279836@gmail.com" className="block text-sm font-medium text-fuchsia-500 dark:text-purple-400 hover:text-fuchsia-700 dark:hover:text-purple-200 transition-colors">
              wjdrms279836@gmail.com
            </a>
          </div>
        </div>

        {/* Links Section */}
        <div className="w-full flex flex-col gap-4">
          
          {/* Add Link Dialog Trigger */}
          <Dialog open={isOpen} onOpenChange={(open) => {
            if (isSubmitting) return;
            setIsOpen(open);
            if (!open) reset();
          }}>
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
                <DialogTitle className="text-center text-xl font-bold">링크 추가</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">타이틀</Label>
                  <Input 
                    id="title" 
                    placeholder="예: 내 포트폴리오" 
                    {...register("title")}
                    className={`h-12 rounded-xl transition-colors ${errors.title ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  {errors.title && <p className="text-sm text-red-500 animate-in fade-in slide-in-from-top-1">{errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-sm font-medium">URL</Label>
                  <Input 
                    id="url" 
                    type="text"
                    placeholder="예: example.com" 
                    {...register("url")}
                    className={`h-12 rounded-xl transition-colors ${errors.url ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    dir="ltr"
                  />
                  {errors.url && <p className="text-sm text-red-500 animate-in fade-in slide-in-from-top-1">{errors.url.message}</p>}
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl font-semibold text-md" disabled={isSubmitting}>
                  저장하기
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Link List */}
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={`skeleton-${i}`} className="border-0 bg-fuchsia-50/60 dark:bg-purple-950/40 backdrop-blur-xl shadow-sm rounded-[1.25rem] overflow-hidden ring-1 ring-fuchsia-100/50 dark:ring-purple-700/20 animate-pulse">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700/50"></div>
                    <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700/50"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : links.map((link) => (
            <LinkItemCard 
              key={link.id} 
              link={link} 
              onUpdateSuccess={(id, updatedData) => {
                setLinks(prev => prev.map(l => l.id === id ? { ...l, ...updatedData } : l));
              }}
              onDeleteSuccess={(id) => {
                setLinks(prev => prev.filter(l => l.id !== id));
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
