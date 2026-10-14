# hize. 웹사이트

## 폴더 구조
```
hize-site/
├─ index.html                   Home — 표지 + 쇼릴 + 대표작
├─ about/index.html             About — 감독 소개 · 수상 · 클라이언트
├─ work/
│  ├─ index.html                Work (Commercial 폴더가 기본으로 열림)
│  ├─ commercial/index.html     Commercial — 클라이언트 광고 · 공공 캠페인
│  └─ contents/index.html       Contents — 직접 기획한 오리지널 · AI 콘텐츠
├─ contact/index.html           Contact — 문의
└─ assets/
   ├─ css/style.css             스타일 (컬러·서체 토큰은 맨 위 :root)
   ├─ js/main.js                표지, 영상 재생, 쇼릴, 플레이어, 복사 버튼
   ├─ img/favicon.svg           브라우저 탭 아이콘
   ├─ img/logo/                 로고 SVG 세트
   └─ img/work/                 작업 썸네일 (선택)
```

## 영상 연결하는 법 (유튜브 · 비메오)
영상 자리마다 `data-video=""` 가 있어요. 따옴표 안에 주소만 붙여 넣으면 돼요.

- 쇼릴 — index.html 의 `<section class="reel" ... data-video="">`
  → 첫 화면 배경에 무음 반복 재생, Play reel 버튼은 소리와 함께 크게 재생
- 대표작 — index.html 의 `<article class="item" data-video="">`
- Commercial — work/index.html 과 work/commercial/index.html 의 `<button class="row" ... data-video="">` (두 파일 모두 같은 목록)
- Contents — work/contents/index.html 의 `<article class="ep" ... data-video="">` (세로 영상)

지원 주소
- 유튜브: youtube.com/watch?v=…, youtu.be/…, youtube.com/shorts/…
- 비메오: vimeo.com/123456789 (비공개 링크는 vimeo.com/123456789/abcdef 형태 그대로)

썸네일
- 유튜브는 자동으로 붙어요.
- 비메오나 직접 고른 이미지는 assets/img/work/ 에 넣고 `data-thumb="../../assets/img/work/파일.jpg"` 를 함께 적어주세요.
- 비메오를 쇼릴 배경으로 쓰려면 비메오 유료 플랜(Plus 이상)이 필요해요.

## 채워 넣을 것
- [작업명], [EMAIL], [PHONE], [@HANDLE]

## 컬러 · 서체
- 블랙 #0E0E0D · 오프화이트 #F3F3F0 · 포인트 레드 #FF3B1F
- Geist (로고·제목), Noto Sans KR (본문), Geist Mono (라벨) — Google Fonts
