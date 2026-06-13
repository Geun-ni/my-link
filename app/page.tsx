"use client";

import { useState, useRef, useEffect } from "react";
import { LinkItem } from "@/data/links";
import {
  collection,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { checkDisplayNameAvailable } from "@/lib/firestore";
import { useAuth, UpdateProfileData } from "@/hooks/useAuth";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  RiCheckLine,
  RiCloseLine,
  RiDragMove2Line,
} from "@remixicon/react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Google Favicon API
function getFaviconUrl(url: string) {
  try {
    const domain = new URL(url).hostname;
    return `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
}

// 수정 시간 포맷팅
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

// 링크 유효성 스키마
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

// ─── 프로필 인라인 편집기 ──────────────────────────────────────────────────────
function ProfileEditor({
  userProfile,
  userId,
  updateProfile,
}: {
  userProfile: { displayName: string; bio: string; username: string; photoURL: string };
  userId: string;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
}) {
  // displayName 편집 상태
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [displayNameValue, setDisplayNameValue] = useState(userProfile.displayName);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [isCheckingDisplayName, setIsCheckingDisplayName] = useState(false);
  const [isSavingDisplayName, setIsSavingDisplayName] = useState(false);
  const displayNameInputRef = useRef<HTMLInputElement>(null);

  // bio 편집 상태
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState(userProfile.bio);
  const [isSavingBio, setIsSavingBio] = useState(false);
  const bioTextareaRef = useRef<HTMLTextAreaElement>(null);

  // username 편집 상태
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameValue, setUsernameValue] = useState(userProfile.username);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  // displayName 유효성 검사
  function validateDisplayName(value: string): string | null {
    if (value.trim().length < 2) return "2자 이상 입력해주세요.";
    if (value.trim().length > 30) return "30자 이하로 입력해주세요.";
    if (!/^[a-z0-9._-]+$/i.test(value.trim()))
      return "영문, 숫자, 점(.), 하이픈(-), 밑줄(_)만 사용 가능합니다.";
    return null;
  }

  // displayName 편집 시작
  const startEditingDisplayName = () => {
    setDisplayNameValue(userProfile.displayName);
    setDisplayNameError(null);
    setIsEditingDisplayName(true);
    setTimeout(() => displayNameInputRef.current?.focus(), 0);
  };

  // displayName 저장
  const saveDisplayName = async () => {
    const trimmed = displayNameValue.trim();
    const validationError = validateDisplayName(trimmed);
    if (validationError) {
      setDisplayNameError(validationError);
      return;
    }
    // 변경 사항이 없는 경우 처리 회피
    if (trimmed === userProfile.displayName) {
      setIsEditingDisplayName(false);
      return;
    }
    setIsCheckingDisplayName(true);
    setDisplayNameError(null);
    try {
      const isAvailable = await checkDisplayNameAvailable(trimmed, userId);
      if (!isAvailable) {
        setDisplayNameError("이미 사용 중인 URL입니다. 다른 이름을 입력해주세요.");
        return;
      }
      setIsSavingDisplayName(true);
      await updateProfile({ displayName: trimmed });
      setIsEditingDisplayName(false);
      toast.success("URL이 변경되었습니다!", {
        description: `새 주소: @${trimmed}`,
        duration: 4000,
      });
    } catch {
      setDisplayNameError("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsCheckingDisplayName(false);
      setIsSavingDisplayName(false);
    }
  };

  const cancelDisplayName = () => {
    setDisplayNameValue(userProfile.displayName);
    setDisplayNameError(null);
    setIsEditingDisplayName(false);
  };

  const handleDisplayNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveDisplayName();
    } else if (e.key === "Escape") {
      cancelDisplayName();
    }
  };

  // bio 저장
  const saveBio = async () => {
    const trimmed = bioValue.trim();
    if (trimmed === userProfile.bio) {
      setIsEditingBio(false);
      return;
    }
    setIsSavingBio(true);
    try {
      await updateProfile({ bio: trimmed });
      setIsEditingBio(false);
      toast.success("소개가 저장되었습니다.", { duration: 2000 });
    } catch {
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleBioKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveBio();
    } else if (e.key === "Escape") {
      setBioValue(userProfile.bio);
      setIsEditingBio(false);
    }
  };

  // username 저장
  const saveUsername = async () => {
    const trimmed = usernameValue.trim();
    if (trimmed.length < 1) {
      setUsernameError("이름을 1자 이상 입력해주세요.");
      return;
    }
    if (trimmed.length > 50) {
      setUsernameError("이름을 50자 이하로 입력해주세요.");
      return;
    }
    // 변경 사항이 없는 경우 처리 회피
    if (trimmed === userProfile.username) {
      setIsEditingUsername(false);
      return;
    }
    setIsSavingUsername(true);
    try {
      await updateProfile({ username: trimmed });
      setIsEditingUsername(false);
      toast.success("이름이 저장되었습니다.", { duration: 2000 });
    } catch {
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleUsernameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveUsername();
    } else if (e.key === "Escape") {
      setUsernameValue(userProfile.username);
      setUsernameError(null);
      setIsEditingUsername(false);
    }
  };

  const isLoading = isCheckingDisplayName || isSavingDisplayName || isSavingBio || isSavingUsername;

  return (
    <div className="flex flex-col items-center gap-4 text-center w-full">
      {/* 프로필 사진 */}
      <div className="group relative flex h-28 w-28 items-center justify-center rounded-full overflow-hidden border border-border shadow-sm transition-transform duration-300 hover:scale-105">
        {userProfile.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={userProfile.photoURL}
            alt={userProfile.username}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <div className="h-full w-full rounded-full bg-primary flex items-center justify-center">
            <span className="text-3xl font-black text-white">
              {(userProfile.username || userProfile.displayName || "?")[0].toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3 mt-1 w-full font-sans">
        {/* username: Google 계정 실제 이름 (인라인 편집) */}
        <div className="flex flex-col items-center gap-1">
          {isEditingUsername ? (
            <div className="w-full max-w-[300px] space-y-2">
              <Input
                ref={usernameInputRef}
                value={usernameValue}
                onChange={(e) => {
                  setUsernameValue(e.target.value);
                  if (usernameError) setUsernameError(null);
                }}
                onKeyDown={handleUsernameKeyDown}
                onBlur={saveUsername}
                disabled={isLoading}
                placeholder="이름 입력"
                className="h-9 rounded-xl text-center text-lg font-bold bg-white dark:bg-card border border-border focus-visible:ring-1 focus-visible:ring-primary"
              />
              {usernameError && (
                <p className="text-xs text-red-500 text-center animate-in fade-in slide-in-from-top-1">
                  {usernameError}
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                setIsEditingUsername(true);
                setTimeout(() => usernameInputRef.current?.focus(), 0);
              }}
              className="group/un flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-primary/10 transition-colors cursor-text text-2xl font-black tracking-tight text-foreground dark:text-white"
              title="클릭하여 이름 변경"
            >
              <span>{userProfile.username}</span>
            </button>
          )}
        </div>

        {/* displayName: URL slug (인라인 편집) */}
        <div className="flex flex-col items-center gap-1">
          {isEditingDisplayName ? (
            <div className="w-full max-w-[300px] space-y-2">
              <div className="relative flex items-center gap-1.5">
                <span className="text-sm text-slate-400 dark:text-slate-500 shrink-0 font-mono">@</span>
                <Input
                  ref={displayNameInputRef}
                  value={displayNameValue}
                  onChange={(e) => {
                    setDisplayNameValue(e.target.value);
                    if (displayNameError) setDisplayNameError(null);
                  }}
                  onKeyDown={handleDisplayNameKeyDown}
                  disabled={isLoading}
                  placeholder="URL 슬러그 입력"
                  className={`h-9 rounded-xl font-mono text-sm bg-white dark:bg-card pr-16 transition-colors ${
                    displayNameError
                      ? "border-red-500 focus-visible:ring-red-500"
                      : "border border-border focus-visible:ring-1 focus-visible:ring-primary"
                  }`}
                />
                <div className="absolute right-1.5 flex items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={saveDisplayName}
                    disabled={isLoading}
                    className="h-7 w-7 rounded-full text-emerald-600 border border-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                  >
                    {isCheckingDisplayName || isSavingDisplayName ? (
                      <RiLoader4Line className="h-4 w-4 animate-spin" />
                    ) : (
                      <RiCheckLine className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={cancelDisplayName}
                    disabled={isLoading}
                    className="h-7 w-7 rounded-full text-slate-500 border border-border hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <RiCloseLine className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {displayNameError && (
                <p className="text-xs text-red-500 text-center animate-in fade-in slide-in-from-top-1">
                  {displayNameError}
                </p>
              )}
              <p className="text-[11px] text-amber-500 dark:text-amber-400 flex items-center justify-center gap-1">
                ⚠️ URL이 변경되면 기존 공유 링크는 무효화됩니다.
              </p>
            </div>
          ) : (
            <button
              onClick={startEditingDisplayName}
              className="group/dn flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-primary/10 transition-colors cursor-text"
              title="클릭하여 URL 변경"
            >
              <span className="text-sm text-slate-400 dark:text-slate-500 font-mono">@</span>
              <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                {userProfile.displayName}
              </span>
            </button>
          )}
        </div>

        {/* bio: 인라인 편집 */}
        <div className="flex flex-col items-center gap-1">
          {isEditingBio ? (
            <div className="w-full max-w-[300px] space-y-2">
              <Textarea
                ref={bioTextareaRef}
                value={bioValue}
                onChange={(e) => setBioValue(e.target.value)}
                onKeyDown={handleBioKeyDown}
                onBlur={saveBio}
                disabled={isLoading}
                placeholder="한 줄 소개를 입력하세요..."
                rows={2}
                className="rounded-xl text-sm resize-none bg-white dark:bg-card border border-border focus-visible:ring-1 focus-visible:ring-primary text-center"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Enter로 저장 · Shift+Enter로 줄바꿈 · Esc로 취소
              </p>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsEditingBio(true);
                setTimeout(() => bioTextareaRef.current?.focus(), 0);
              }}
              className="group/bio flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors cursor-text max-w-[300px] text-center"
              title="클릭하여 소개 수정"
            >
              <span
                className={`text-sm whitespace-pre-wrap ${
                  userProfile.bio
                    ? "text-slate-600 dark:text-slate-400 font-bold"
                    : "text-slate-400 dark:text-slate-600 italic font-medium"
                }`}
              >
                {userProfile.bio || "소개를 입력하세요..."}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 링크 아이템 카드 ────────────────────────────────────────────────────────
function LinkItemCard({
  link,
  userId,
}: {
  link: LinkItem;
  userId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isCancellingRef = useRef(false);
  const queryClient = useQueryClient();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 50 : "auto",
  };

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

  // TanStack Query 링크 수정 Mutation
  const updateLinkMutation = useMutation({
    mutationFn: async (data: LinkFormValues) => {
      let formattedUrl = data.url.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      if (!link.id) return;
      await updateDoc(doc(db, `users/${userId}/links`, link.id), {
        title: data.title.trim(),
        url: formattedUrl,
        updatedAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links", userId] });
      setIsEditing(false);
      toast.success("링크가 수정되었습니다.");
    },
    onError: () => {
      toast.error("링크 수정 중 오류가 발생했습니다.");
    },
  });

  const onUpdate = async (data: LinkFormValues) => {
    await updateLinkMutation.mutateAsync(data);
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
    if (updateLinkMutation.isPending) return;
    handleSubmit(onUpdate)();
  };

  // TanStack Query 링크 삭제 Mutation
  const deleteLinkMutation = useMutation({
    mutationFn: async () => {
      if (!link.id) return;
      await deleteDoc(doc(db, `users/${userId}/links`, link.id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links", userId] });
      setIsDeleteDialogOpen(false);
      toast.success("링크가 삭제되었습니다.");
    },
    onError: () => {
      toast.error("링크 삭제 중 오류가 발생했습니다.");
    },
  });

  const onDelete = async () => {
    await deleteLinkMutation.mutateAsync();
  };

  const faviconUrl = getFaviconUrl(link.url);

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="w-full">
        <Card className="border border-border bg-card shadow-neo p-3.5 relative font-sans rounded-2xl overflow-hidden">
          <form
            onSubmit={handleSubmit(onUpdate)}
            onBlur={handleFormBlur}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Input
                placeholder="타이틀"
                {...register("title")}
                className={`h-9.5 rounded-xl bg-white dark:bg-card border border-border transition-colors ${errors.title ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-1 focus-visible:ring-primary"}`}
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
                className={`h-9.5 rounded-xl bg-white dark:bg-card border border-border transition-colors ${errors.url ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-1 focus-visible:ring-primary"}`}
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
                className="rounded-xl h-9 px-4 font-bold border border-border"
                onClick={handleCancel}
                disabled={updateLinkMutation.isPending}
              >
                취소
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl h-9 px-4 font-bold bg-primary text-white"
                disabled={updateLinkMutation.isPending}
              >
                {updateLinkMutation.isPending ? (
                  <RiLoader4Line className="h-4 w-4 animate-spin mr-1.5" />
                ) : null}
                저장
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="w-full">
      <Card className={`border border-border bg-card shadow-neo hover:shadow-neo-hover transition-all duration-300 rounded-2xl overflow-hidden relative font-sans hover:-translate-y-[2px] ${isDragging ? "shadow-md border-primary/40 ring-1 ring-primary/20 bg-slate-50/50" : ""}`}>
        <div className="flex items-center">
          {/* 드래그 핸들 */}
          <div
            {...attributes}
            {...listeners}
            className="pl-3.5 pr-1 py-4 text-slate-400 hover:text-primary cursor-grab active:cursor-grabbing shrink-0 z-20 transition-colors touch-none"
            title="드래그하여 순서 변경"
          >
            <RiDragMove2Line className="h-5 w-5" />
          </div>

          <Link
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-3 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-2xl flex items-center justify-between group overflow-hidden"
          >
            <div className="flex items-center gap-4 z-10 w-full overflow-hidden">
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
              <div className="flex flex-col justify-center gap-0.5 z-10 w-full overflow-hidden">
                <CardTitle className="text-base font-bold text-foreground group-hover:underline transition-all truncate">
                  {link.title}
                </CardTitle>
                {formatUpdatedAt(link.updatedAt) && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                    {formatUpdatedAt(link.updatedAt)}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/20 p-1.5 rounded-full opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 hidden sm:block shrink-0 mr-1">
              <RiArrowRightSLine className="h-5 w-5 text-primary" />
            </div>
          </Link>

          {/* Edit and Delete Buttons */}
          <div className="pr-4 pl-1 flex items-center gap-0.5 shrink-0 z-20 relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
              className="h-10 w-10 sm:h-9 sm:w-9 rounded-full text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <RiEditLine className="h-5 w-5" />
              <span className="sr-only">수정</span>
            </Button>

            <Dialog
              open={isDeleteDialogOpen}
              onOpenChange={(open) => {
                if (deleteLinkMutation.isPending) return;
                setIsDeleteDialogOpen(open);
              }}
            >
              <DialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 sm:h-9 sm:w-9 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors"
                  >
                    <RiDeleteBinLine className="h-5 w-5" />
                    <span className="sr-only">삭제</span>
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-sm rounded-2xl p-6 border border-border bg-card shadow-neo">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-center text-xl font-bold">
                    정말 삭제하시겠습니까?
                  </DialogTitle>
                </DialogHeader>
                <div className="py-2 text-center space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-border">
                    <p className="font-bold text-lg text-slate-900 dark:text-slate-100 break-all line-clamp-2">
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
                    className="rounded-xl h-11 flex-1 font-bold border border-border"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    disabled={deleteLinkMutation.isPending}
                  >
                    취소
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-xl h-11 flex-1 font-bold bg-red-500 hover:bg-red-600 text-white"
                    onClick={onDelete}
                    disabled={deleteLinkMutation.isPending}
                  >
                    {deleteLinkMutation.isPending ? (
                      <RiLoader4Line className="h-5 w-5 animate-spin mr-2" />
                    ) : null}
                    {deleteLinkMutation.isPending ? "삭제 중..." : "삭제하기"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── 비로그인 상태 화면 ────────────────────────────────────────────────────────
function LoginPrompt({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6 py-24 bg-background font-sans">
      <div className="w-full max-w-md flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {/* 아이콘 */}
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 border border-primary/25 shadow-sm text-primary">
            <RiLockLine className="h-12 w-12" />
          </div>
        </div>

        {/* 안내 문구 */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            MyLink
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400 font-semibold leading-relaxed max-w-sm">
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
              className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border shadow-neo"
            >
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-sm font-bold text-foreground">{item.title}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 구글 로그인 버튼 */}
        <Button
          onClick={onSignIn}
          size="lg"
          className="w-full h-14 rounded-2xl text-base font-bold bg-primary text-white hover:bg-primary/95 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-[1px] gap-3 flex items-center justify-center"
        >
          <RiGoogleLine className="h-5 w-5" />
          Google로 시작하기
        </Button>

        <p className="text-xs text-slate-400 dark:text-slate-500 text-center font-semibold">
          로그인하면 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}

// ─── 메인 대시보드 (로그인 후) ────────────────────────────────────────────────
export default function Page() {
  const { user, userProfile, loading: authLoading, signInWithGoogle, updateProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // 하이드레이션 완료 시점을 추적하기 위한 상태
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // TanStack Query로 링크 목록 조회 및 캐싱
  const { data: links = [], isLoading: isLinksLoading } = useQuery<LinkItem[]>({
    queryKey: ["links", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, `users/${user.uid}/links`),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
      })) as LinkItem[];
    },
    enabled: !!user,
  });

  // dnd-kit 센서 설정 (MouseSensor, TouchSensor로 분할)
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 3, // 마우스 이동 감지 거리를 3픽셀로 축소하여 즉각 반응하도록 처리
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 터치는 250ms 롱 프레스로 스크롤 동작과 분리
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 메모리 상에서 position 기준으로 링크 1차 정렬, position이 없으면 기존처럼 createdAt 역순 정렬
  const sortedLinks = [...links].sort((a, b) => {
    const aPos = a.position !== undefined ? a.position : 999999;
    const bPos = b.position !== undefined ? b.position : 999999;
    if (aPos !== bPos) return aPos - bPos;

    // createdAt(Timestamp) 비교 처리
    const aTime = a.createdAt ? ((a.createdAt as any).seconds || 0) : 0;
    const bTime = b.createdAt ? ((b.createdAt as any).seconds || 0) : 0;
    return bTime - aTime;
  });

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

  // TanStack Query 링크 추가 Mutation
  const addLinkMutation = useMutation({
    mutationFn: async (data: LinkFormValues) => {
      if (!user) return;
      let formattedUrl = data.url.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }

      // 새 링크의 position 값 계산 (현재 정렬된 리스트에서 최대 position + 1)
      const maxPos = links.reduce((max, link) => Math.max(max, link.position ?? 0), -1);
      const newPosition = maxPos + 1;

      await addDoc(collection(db, `users/${user.uid}/links`), {
        title: data.title.trim(),
        url: formattedUrl,
        clicks: 0,
        createdAt: serverTimestamp(),
        position: newPosition,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links", user?.uid] });
      reset();
      toast.success("링크가 성공적으로 추가되었습니다.");
    },
    onError: () => {
      toast.error("링크 추가 중 오류가 발생했습니다.");
    },
  });

  const onSubmit = async (data: LinkFormValues) => {
    setIsOpen(false);
    await addLinkMutation.mutateAsync(data);
  };

  // 드래그 앤 드롭 완료 핸들러 (낙관적 업데이트 및 Firestore writeBatch 일괄 전송)
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !user) return;

    const oldIndex = sortedLinks.findIndex((l) => l.id === active.id);
    const newIndex = sortedLinks.findIndex((l) => l.id === over.id);

    const newOrderedLinks = arrayMove(sortedLinks, oldIndex, newIndex);

    // 각 링크 객체의 position 필드를 바뀐 배열의 인덱스 번호로 매핑하여 새 배열 생성
    const updatedLinks = newOrderedLinks.map((link, idx) => ({
      ...link,
      position: idx,
    }));

    // 1. 낙관적 업데이트로 로컬 React Query 캐시를 먼저 갱신
    queryClient.setQueryData(["links", user.uid], updatedLinks);

    // 2. Firestore 일괄 전송 (Write Batch)
    try {
      const batch = writeBatch(db);
      newOrderedLinks.forEach((link, idx) => {
        if (!link.id) return;
        const docRef = doc(db, `users/${user.uid}/links`, link.id);
        batch.update(docRef, { position: idx });
      });
      await batch.commit();
      toast.success("링크 순서가 저장되었습니다.", { duration: 1500 });
    } catch (error) {
      toast.error("순서 저장 중 오류가 발생했습니다.");
      // 실패 시 캐시 롤백
      queryClient.invalidateQueries({ queryKey: ["links", user.uid] });
    }
  };

  // ── 전체 로딩 (Auth 초기화 중) ──────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background font-sans">
        <div className="flex flex-col items-center gap-4">
          <RiLoader4Line className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">불러오는 중...</p>
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
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center py-16 px-6 bg-background selection:bg-primary/45 font-sans">
      <div className="w-full max-w-[420px] flex flex-col items-center gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Profile Section */}
        <ProfileEditor
          userProfile={userProfile}
          userId={user.uid}
          updateProfile={updateProfile}
        />

        {/* Links Section */}
        <div className="w-full flex flex-col gap-4">

          {/* Add Link Dialog Trigger */}
          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              if (addLinkMutation.isPending) return;
              setIsOpen(open);
              if (!open) reset();
            }}
          >
            <DialogTrigger
              render={
                <Button
                  disabled={addLinkMutation.isPending}
                  className="w-full group rounded-2xl h-11 bg-white dark:bg-card border border-border hover:bg-primary/10 text-primary mb-4 transition-all shadow-sm hover:shadow-md hover:-translate-y-[1px] relative overflow-hidden font-bold flex items-center justify-center"
                />
              }
            >
              {addLinkMutation.isPending ? (
                <>
                  <RiLoader4Line className="mr-2 h-6 w-6 text-primary opacity-80 animate-spin shrink-0" />
                  <span className="font-bold tracking-wide">
                    추가 중...
                  </span>
                </>
              ) : (
                <>
                  <RiAddLine className="mr-2 h-6 w-6 text-primary opacity-80 group-hover:rotate-90 group-hover:scale-110 group-hover:opacity-100 transition-all duration-300 ease-out shrink-0" />
                  <span className="font-bold tracking-wide">
                    새로운 링크 추가하기
                  </span>
                </>
              )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border border-border bg-card shadow-neo rounded-2xl p-6">
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
                  <Label htmlFor="title" className="text-sm font-bold">
                    타이틀
                  </Label>
                  <Input
                    id="title"
                    placeholder="예: 내 포트폴리오"
                    {...register("title")}
                    className={`h-12 rounded-xl border border-border focus-visible:ring-1 focus-visible:ring-primary bg-white dark:bg-card transition-colors ${errors.title ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 animate-in fade-in slide-in-from-top-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-sm font-bold">
                    URL
                  </Label>
                  <Input
                    id="url"
                    type="text"
                    placeholder="예: example.com"
                    {...register("url")}
                    className={`h-12 rounded-xl border border-border focus-visible:ring-1 focus-visible:ring-primary bg-white dark:bg-card transition-colors ${errors.url ? "border-red-500 focus-visible:ring-red-500" : ""}`}
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
                  className="w-full h-12 rounded-xl font-bold bg-primary text-white shadow-md hover:shadow-lg transition-all"
                  disabled={addLinkMutation.isPending}
                >
                  저장하기
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Link List */}
          {isLinksLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card
                key={`skeleton-${i}`}
                className="border border-border bg-card shadow-neo rounded-2xl overflow-hidden animate-pulse"
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800/80 border border-border"></div>
                    <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800/80"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : sortedLinks.length === 0 ? (
            /* 링크가 없을 때 빈 상태 */
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 border border-primary/20">
                <RiLinksLine className="h-8 w-8 text-primary" />
              </div>
              <p className="text-base font-bold text-foreground">
                아직 링크가 없어요
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 font-semibold">
                위 버튼을 눌러 첫 번째 링크를 추가해보세요!
              </p>
            </div>
          ) : !mounted ? (
            /* 하이드레이션 오류 방지를 위한 정적 초기 리스트 */
            <div className="flex flex-col gap-4 w-full">
              {sortedLinks.map((link) => (
                <LinkItemCard
                  key={link.id}
                  link={link}
                  userId={user.uid}
                />
              ))}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
            >
              <SortableContext
                items={sortedLinks.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-4 w-full">
                  {sortedLinks.map((link) => (
                    <LinkItemCard
                      key={link.id}
                      link={link}
                      userId={user.uid}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}
