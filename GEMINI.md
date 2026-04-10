# GEMINI.md

이 파일은 Gemini CLI 에이전트를 위한 프로젝트 컨텍스트 및 지침을 담고 있습니다. 모든 작업 시 이 내용을 최우선으로 준수해야 합니다.

## 1. 프로젝트 개요
- **프로젝트명**: 마이링크 (MyLink)
- **목적**: 사용자의 SNS 및 웹사이트 링크를 하나의 프로필 페이지로 통합 관리하고 공유하는 서비스.
- **주요 컨셉**: 
  - **심플한 모던 UI**: 테마 선택 없이 shadcn/ui 기반의 단일 고품질 디자인 지향. (@WIREFRAME.md 참조)
  - **인라인 편집 (Inline Edit)**: 노션(Notion) 스타일로 텍스트를 직접 클릭하여 즉시 수정하는 직관적인 UX.
  - **Zero-Onboarding**: 구글 로그인 시 이메일 ID를 기반으로 즉시 고유 URL(Slug) 생성. (@USER_SCENARIO.md 참조)

## 2. 기술 스택
- **Framework**: Next.js 16 (App Router), React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Backend**: Firebase (Authentication, Cloud Firestore)
- **Icons**: Remix Icon (`@remixicon/react`), Google Favicon API
- **State/Logic**: 인라인 편집 로직 및 Firebase 연동 중심

## 3. 주요 기능 및 UX 상세 (@USER_SCENARIO.md, @WIREFRAME.md)
1. **사용자 인증**: 구글 소셜 로그인 및 자동 Slug 생성 (`domain.com/gmail_id`).
2. **프로필 설정**: `displayName`, `bio` 인라인 편집. 편집 가능 항목 옆에 연필(`✎`) 아이콘 배치.
3. **링크 관리**: 
   - 링크 추가/수정/삭제.
   - URL 입력 시 Google Favicon API를 통한 자동 아이콘 생성.
   - 삭제 시 별도 확인 모달 없이 즉시 삭제하여 심플함 유지.
4. **퍼블릭 프로필**: 모바일 최적화된 중앙 정렬 리스트 UI. 클릭 시 조회수 집계 로직 포함.

## 4. 개발 및 빌드 명령어
- **개발 서버**: `npm run dev` (Turbopack 사용)
- **빌드**: `npm run build`
- **린트**: `npm run lint`
- **타입 체크**: `npm run typecheck`
- **포맷팅**: `npm run format` (Prettier + Tailwind CSS 플러그인)

## 5. 개발 컨벤션 및 지침
- **UI 컴포넌트**: `components/ui` 폴더에 `shadcn/ui` 컴포넌트를 위치시키고, 새로운 컴포넌트 추가 시 `npx shadcn@latest add [component]` 명령어를 사용합니다.
- **스타일링**: Tailwind CSS 4의 기능을 적극 활용합니다.
- **인라인 편집**: 텍스트 클릭 시 입력 모드로 전환되며, `Blur` 또는 `Enter` 시 즉시 저장되는 패턴을 유지합니다.
- **커밋 메시지**: 한국어로 작성하며, 변경 사항의 '이유'를 포함하여 상세하게 기록합니다.
- **검증**: 모든 코드 변경 후에는 `npm run build` 또는 관련 린트/타입 체크 명령어로 무결성을 확인합니다.

## 6. 관련 문서 참조
- **요구사항**: @PRD.md
- **사용자 시나리오**: @USER_SCENARIO.md
- **UI/UX 설계**: @WIREFRAME.md
