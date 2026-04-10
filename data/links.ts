export interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon?: string; // (선택) PRD 명세에 따라 Google Favicon API를 통해 자동 생성될 수도 있습니다.
  clicks?: number; // PRD: 추후 조회수 통계 기능을 위한 모델링 여백
}

export const dummyLinks: LinkItem[] = [
  {
    id: "1",
    title: "Instagram",
    url: "https://instagram.com",
    clicks: 120,
  },
  {
    id: "2",
    title: "Youtube",
    url: "https://youtube.com",
    clicks: 340,
  },
  {
    id: "3",
    title: "Blog",
    url: "https://blog.naver.com",
    clicks: 50,
  },
  {
    id: "4",
    title: "Github",
    url: "https://github.com",
    clicks: 890,
  },
  {
    id: "5",
    title: "Portfolio",
    url: "https://example.com",
    clicks: 45,
  },
];
