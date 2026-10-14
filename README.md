# hize. 웹사이트

## 폴더 구조
```
hize-site/
├─ index.html                   Home — 표지 + 쇼릴 + 대표작
├─ about/index.html             About — 감독 소개 · 수상 · 클라이언트
├─ work/
│  ├─ index.html                Work (Commercial 폴더가 기본으로 열림)
│  ├─ commercial/index.html     Commercial — 클라이언트 광고 · 공공 캠페인
│  └─ originals/index.html      Originals — AI 숏폼 시리즈
├─ contact/index.html           Contact — 문의
└─ assets/
   ├─ css/style.css             스타일 (컬러·서체 토큰은 맨 위 :root)
   ├─ js/main.js                표지, 영상 재생, 쇼릴, 플레이어, 복사 버튼
   ├─ img/favicon.svg           브라우저 탭 아이콘
   ├─ img/logo/                 로고 SVG 세트
   └─ img/work/                 작업 썸네일 (선택)
```

## 내용 바꾸는 법 — 구글 시트 "hize 사이트 관리"
영상 링크, 작업명, 연락처는 모두 구글 드라이브의 "hize 사이트 관리" 시트에서 바꿔요.
시트를 고치고 사이트를 새로고침하면 바로 반영돼요. GitHub이나 코드는 건드리지 않아도 돼요.

시트 칸
- 구분: commercial / originals / 쇼릴 / 이메일 / 전화 / 인스타
- 이름: 클라이언트명 또는 시리즈명
- 작업명: originals는 "EP1 제목"처럼 쓰면 EP 라벨이 자동으로 붙어요
- 영상 링크: 유튜브·비메오 주소 (이메일·전화·인스타는 이 칸에 값을 적어요)
- 메인 노출: Y 를 적으면 Home 대표작에 나와요
- 분류: Work 목록 오른쪽에 작게 나오는 라벨 (Brand, Public 등)

작업 추가는 한 줄 추가, 삭제는 그 줄 삭제, 순서는 줄 순서대로예요.

처음 한 번만: 시트 오른쪽 위 [공유] → 일반 액세스를 "링크가 있는 모든 사용자 · 뷰어"로 바꿔주세요.
(사이트에 공개될 내용만 들어 있는 시트예요.)

지원 주소
- 유튜브: youtube.com/watch?v=…, youtu.be/…, youtube.com/shorts/… (썸네일 자동)
- 비메오: vimeo.com/123456789, 비공개 링크는 vimeo.com/123456789/abcdef 그대로
- 비메오를 쇼릴 배경으로 쓰려면 비메오 유료 플랜(Plus 이상)이 필요해요.

- 썸네일: assets/img/work/ 안의 파일 이름 (예: w14.webp). 쇼릴 PPT 스틸에서 뽑은 44장이 들어 있어요.

작업 목록(대표작·Commercial·Originals)은 시트에 '썸네일' 칸이 있을 때만 시트 내용으로 바뀌어요.
그 전에는 사이트에 들어 있는 44편 목록이 그대로 보이고, 시트에서는 쇼릴·이메일·전화·인스타만 반영돼요.
시트를 못 불러오면 사이트에 들어 있는 기본 내용이 그대로 보여요.

## 컬러 · 서체
- 블랙 #0E0E0D · 오프화이트 #F3F3F0 · 포인트 레드 #FF3B1F
- Geist (로고·제목), Noto Sans KR (본문), Geist Mono (라벨) — Google Fonts
