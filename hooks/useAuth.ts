"use client";

import { useState, useEffect } from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Firestore에 저장되는 사용자 프로필 타입
export interface UserProfile {
  bio: string;
  displayName: string;
  email: string;
  photoURL: string;
  uid: string;
  username: string;
}

export interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  username?: string;
}

interface UseAuthReturn {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
}

/**
 * 이메일에서 @ 앞부분을 추출해 displayName으로 사용
 * ex) "john.doe@gmail.com" → "john.doe"
 */
function extractDisplayName(email: string): string {
  return email.split("@")[0];
}

/**
 * 로그인된 Firebase User를 기반으로 Firestore users/{uid} 문서를 생성하거나 읽어옵니다.
 * - 최초 로그인: 문서 생성 (bio는 빈 문자열)
 * - 재방문: 기존 문서 반환 (bio 등 수정된 값 유지, 이미 수정된 username은 구글이름으로 덮어쓰지 않음)
 */
async function syncUserProfile(firebaseUser: User): Promise<UserProfile> {
  const userRef = doc(db, "users", firebaseUser.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    // 최초 가입: 프로필 문서 생성
    const displayName = extractDisplayName(firebaseUser.email ?? firebaseUser.uid);
    // username = Google 계정에 등록된 실제 이름 (없으면 displayName으로 대체)
    const username = firebaseUser.displayName ?? displayName;
    const newProfile: UserProfile = {
      bio: "",
      displayName,
      email: firebaseUser.email ?? "",
      photoURL: firebaseUser.photoURL ?? "",
      uid: firebaseUser.uid,
      username,
    };
    await setDoc(userRef, {
      ...newProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return newProfile;
  }

  // 재방문: 기존 프로필 읽기
  const existing = snapshot.data() as UserProfile;

  // 갱신이 필요한 필드 계산 (username의 경우 기존 DB 데이터가 있다면 구글 프로필로 덮어쓰지 않고 우선 적용)
  const correctUsername = existing.username || firebaseUser.displayName || "";
  const correctPhotoURL = firebaseUser.photoURL ?? "";

  const needsUpdate =
    existing.photoURL !== correctPhotoURL ||
    existing.username !== correctUsername;

  if (needsUpdate) {
    await setDoc(
      userRef,
      {
        photoURL: correctPhotoURL,
        username: correctUsername,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { ...existing, photoURL: correctPhotoURL, username: correctUsername };
  }

  return existing;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // TanStack Query를 활용한 프로필 정보 실시간 조회 및 캐싱
  const { data: userProfile = null } = useQuery<UserProfile | null>({
    queryKey: ["userProfile", user?.uid],
    queryFn: async () => {
      if (!user) return null;
      return syncUserProfile(user);
    },
    enabled: !!user,
  });

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google 로그인 오류:", error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // 로그아웃 시 관련 쿼리 캐시 일괄 삭제
      queryClient.removeQueries({ queryKey: ["userProfile"] });
      queryClient.removeQueries({ queryKey: ["links"] });
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }
  };

  // 프로필 업데이트 Mutation (낙관적 업데이트 적용)
  const updateProfileMutation = useMutation<void, Error, UpdateProfileData, { previousProfile?: UserProfile }>({
    mutationFn: async (data: UpdateProfileData) => {
      if (!user) throw new Error("로그인이 필요합니다.");
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    onMutate: async (newData) => {
      const queryKey = ["userProfile", user?.uid];
      
      // 실행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey });

      // 이전 프로필 값 백업
      const previousProfile = queryClient.getQueryData<UserProfile>(queryKey);

      // 캐시 값 낙관적 선행 업데이트
      if (previousProfile) {
        queryClient.setQueryData(queryKey, {
          ...previousProfile,
          ...newData,
        });
      }

      return { previousProfile };
    },
    onError: (err, newData, context) => {
      // 에러 발생 시 원래의 상태 값으로 자동 복원(롤백)
      const queryKey = ["userProfile", user?.uid];
      if (context?.previousProfile) {
        queryClient.setQueryData(queryKey, context.previousProfile);
      }
      toast.error("프로필 수정 중 오류가 발생했습니다. 다시 시도해주세요.");
    },
    onSettled: () => {
      // 최종적으로 백엔드 데이터에 맞춰 쿼리 무효화(정합성 확인)
      queryClient.invalidateQueries({ queryKey: ["userProfile", user?.uid] });
    },
  });

  const updateProfile = async (data: UpdateProfileData) => {
    await updateProfileMutation.mutateAsync(data);
  };

  return { user, userProfile, loading, signInWithGoogle, signOut, updateProfile };
}
