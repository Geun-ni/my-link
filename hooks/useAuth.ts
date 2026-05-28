"use client";

import { useState, useEffect } from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";

// Firestore에 저장되는 사용자 프로필 타입
export interface UserProfile {
  bio: string;
  displayName: string;
  email: string;
  photoURL: string;
  uid: string;
  username: string;
}

interface UseAuthReturn {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
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
 * - 재방문: 기존 문서 반환 (bio 등 수정된 값 유지)
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

  // 갱신이 필요한 필드 계산
  const correctUsername = firebaseUser.displayName ?? existing.username;
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Firestore 프로필 동기화
        const profile = await syncUserProfile(firebaseUser);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }
  };

  return { user, userProfile, loading, signInWithGoogle, signOut };
}
