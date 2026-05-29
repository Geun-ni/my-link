import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * 주어진 displayName이 이미 다른 사용자에게 사용 중인지 확인합니다.
 * @param displayName 검사할 displayName (URL slug)
 * @param currentUid 현재 로그인된 사용자의 uid (자기 자신 제외)
 * @returns true = 사용 가능, false = 이미 사용 중
 */
export async function checkDisplayNameAvailable(
  displayName: string,
  currentUid: string
): Promise<boolean> {
  const q = query(
    collection(db, "users"),
    where("displayName", "==", displayName)
  );
  const snapshot = await getDocs(q);

  // 결과가 없으면 사용 가능
  if (snapshot.empty) return true;

  // 결과가 있어도 모두 본인 uid인 경우 사용 가능 (현재 값 그대로인 경우)
  return snapshot.docs.every((d) => d.id === currentUid);
}
