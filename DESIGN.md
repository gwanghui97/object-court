# OBJECT COURT — DESIGN.md

> 프로젝트: 사물 재판소 — 최후의 변론  
> 팀: 사이다 (SAIDA) · Y-AI 메이커톤  
> 목적: 3시간 MVP를 위한 **실행 가능한 디자인 지침**. AI가 자동 생성한 듯한 범용 SaaS UI를 피하고, **소품이 살아 있는 작은 법정 무대**를 만든다.

## 0. 디자인 한 문장

**오래된 법정 서류의 질서 + 동화책의 감정 표현 + 아케이드 게임의 손맛.**  
‘AI 챗봇 앱’이 아닌 **사진 한 장으로 시작되는 인터랙티브 재판극**처럼 보여야 한다.

### 레퍼런스 선정 원칙
- 아래 링크는 실제 서비스/레퍼런스 사이트의 **접근 가능한 진입 URL**이다. 특정 디자인이 이미 무료로 다운로드 가능하다고 보증하지 않는다.
- 출처 사이트의 로고, 캐릭터, 이미지, 코드, 독점 레이아웃을 그대로 복사하지 않는다. 구조적 아이디어만 참고한다.
- 이 문서의 색상·수치·레이아웃은 **Object Court를 위해 새로 제안한 디자인 규칙**이다. 레퍼런스 사이트에서 추출한 값이 아니다.

## 1. 조사한 디자인 레퍼런스

| 우선순위 | 사이트 | URL | 여기서 볼 것 | Object Court 적용 |
|---|---|---|---|---|
| 1 | getdesignmd.org | https://getdesignmd.org/ | 실제 URL 기반 디자인 토큰/타이포/간격 추출 | 참고 사이트 하나를 골라 구조를 분석하되, 최종 토큰은 아래 고유안 사용 |
| 2 | getdesign.md | https://getdesign.md/ | 잘 알려진 실제 사이트를 분석한 DESIGN.md 모음 | 일관된 컴포넌트·타이포 위계 정리 방식 |
| 3 | Design Details | https://designdetails.io/ | 실제 웹사이트의 전체 화면·섹션·모션 레퍼런스 | 극적인 첫 화면과 단계별 전환의 리듬 |
| 4 | Mobbin | https://mobbin.com/ | 실제 제품의 업로드·선택·결과 화면 흐름 | 사진 업로드/판결 선택에서 사용성 확보 |
| 5 | Rive (웹 인터랙션) | https://rive.app/use-cases/websites | 클릭·호버·상태 변화 기반 인터랙티브 그래픽 | 망치 클릭, 판결 도장, 캐릭터 반응의 움직임 참고 |
| 6 | Rive (캐릭터) | https://rive.app/use-cases/character-animation | 표정/반응형 캐릭터 애니메이션 | 귀여움보다는 ‘억울함·안도’의 감정 반응 참고 |
| 7 | GETMD | https://www.getmd.kr/ | 실제 서비스의 화면 구조와 디자인 명세 | 화면 구성을 빠르게 확인할 보조 자료 |

**빠르게 볼 순서:** Design Details → Mobbin → Rive → getdesignmd.org. 디자인 검색/수집에 10분 이상 쓰지 않는다.

### 참고 스타일과 피해야 할 오해
- **참고:** 오래된 법정 서류, 황동 문패, 기록용 스탬프, 사건 번호, 증거 봉투, 그림자 극장의 스포트라이트.
- **참고:** 게임의 ‘승리/실패’가 아니라 ‘무죄/유죄’의 양면 결말 구조.
- **비참고:** 흔한 AI 앱의 퍼플/블루 그라디언트, 글래스모피즘, 반짝이는 우주 배경, 무의미한 대시보드 카드, 3D 이모지 남발.

## 2. 브랜드 성격

- **이름:** 사물 재판소 / OBJECT COURT
- **태그라인:** 버리기 전에, 마지막 변론을 들어주세요.
- **팀 표기:** A SAIDA PROJECT (푸터 또는 작은 스탬프)
- **브랜드 인상:** 능청스럽고 재치 있으나 실제 사용·안전·폐기 정보는 책임감 있게.
- **서사적 장치:** 사용자는 ‘판사’, 업로드한 물건은 ‘피고인’, AI는 물건의 변론을 수행한다.
- **원칙:** 판결은 사람이 내린다. AI는 단정적인 고장 진단을 하지 않는다.

## 3. 디자인 시스템 — 고유 토큰

### 색상

| 토큰 | 값 | 사용 |
|---|---|---|
| `--paper` | `#F5F0E6` | 본문 배경 / 기록지 |
| `--paper-deep` | `#E9DFCB` | 서류 보조면 |
| `--ink` | `#26221D` | 기본 텍스트 |
| `--wood` | `#543A2A` | 법정 단상/헤더 |
| `--wood-dark` | `#34241C` | 무대 그림자 |
| `--brass` | `#B18C4B` | 사건 번호 / 금속 라벨 |
| `--verdict-keep` | `#2E6954` | 무죄 / 재사용 |
| `--verdict-discard` | `#9A4538` | 유죄 / 폐기 |
| `--muted` | `#766F66` | 캡션 |
| `--line` | `#CBBFAE` | 구분선 |

금지: 영롱한 다중 그라디언트, 형광 색상, 모든 카드에 회색 그림자, 20px 이상 과도한 라운딩.

### 타이포그래피

- **제목:** `Noto Serif KR`, fallback `Georgia, serif` — 재판기록/신문 같은 무게.
- **본문·버튼:** `Pretendard`, fallback `system-ui, sans-serif` — 실제 웹 앱의 가독성.
- **사건번호·상태 태그:** `ui-monospace, SFMono-Regular, monospace`.
- H1 40px/1.2, H2 28px/1.3, H3 20px/1.35, Body 16px/1.6, Caption 12px/1.4.
- 모바일 H1 30px. 타이틀은 최대 두 줄.
- 긴 설명보다 짧은 법정 어휘: `사건 접수`, `피고인 소환`, `최후 변론`, `판결 선고`, `집행`, `귀환`.

### 형태/간격

- 기본 8px 그리드: 8/16/24/32/48/64.
- 문서형 카드 radius 6px, 버튼 8px, 스탬프/배지 2px.
- 카드 그림자 최소화. 가는 테두리, 종이 오프셋, 작은 모서리 접힘 효과 활용.
- 데스크톱 `max-width: 1120px`, 모바일 좌우 여백 16px.
- 주요 CTA 최소 높이 48px. 선택형 판결 버튼은 56px 이상.

## 4. 화면별 레이아웃

### SCREEN 01 — 사건 접수 / 촬영
- 상단: 작은 `OBJECT COURT / 제 001호` 표기, 우측 `사이다`.
- 중앙: 큼직한 세리프 제목 **“물건에게도 변론의 기회가 필요합니다.”**
- 아래: 종이 증거 봉투처럼 보이는 사진 업로드 영역(아이콘 1개 + CTA `증거 사진 제출`).
- 보조 입력: `왜 버리려고 하나요?` 한 줄 입력칸. 예: `오래됐고 뚜껑이 헐거워요`.
- 아래 조그마한 안내: `사진만으로 내부 고장 여부를 확정할 수 없습니다.`
- 금지: 랜딩 페이지용 feature grid, 고객 후기, 가격표, 로그인 유도.

### SCREEN 02 — 피고인 소환 / 생성 중
- 진행 표시를 **재판 기록 타이프라이터**로: `증거 확인 중…`, `피고인 진술 준비 중…`, `법정 입장 중…`.
- 로딩 스피너 단독 사용 금지. 3단계 중 현재 위치 표시.
- 생성 실패 시 `캐릭터 없이 재판 계속하기` 제공. **텍스트 변론은 반드시 이어지게**.

### SCREEN 03 — 법정 / 최후 변론
- 화면 가운데 가장 큰 시각 요소: **사용자 사진 기반 의인화 캐릭터**.
- 배경: 실제 사진 복사 아닌, CSS로 만든 목재 단상 + 크림색 벽 + 상단 원형 스포트라이트.
- 상단 좁은 사건 정보: `CASE 001 · 물통 · 상태: 심리 중`.
- 캐릭터 아래 **말풍선이 아닌 법정 진술서형 텍스트 패널**. 약 2~4문장.
- 버튼: `변론 듣기`(TTS), `한 가지 추궁하기`(선택적), `판결하기`.
- 텍스트를 읽지 않아도 사진 → 캐릭터 → 결정의 흐름이 보여야 한다.

### SCREEN 04 — 판결
- 좌측: `무죄 / 다시 사용하기` 색상 녹색, 우측: `유죄 / 보내주기` 적갈색.
- 버튼에 단순 이모지 대신 **도장/서명** 느낌의 타이포 처리.
- AI 의견은 참고만: `재사용 가능성을 확인해 볼 수 있습니다. 다만 실제 상태를 확인하세요.`
- 선택 뒤 0.4~0.7초 판결 도장 모션. **사용자의 선택이 최종 결과**.

### SCREEN 05A — 무죄 엔딩 / 귀환
- 캐릭터가 점차 사라지고 **원본 사진이 중앙으로 crossfade**.
- 원본 물건 이미지가 화면 하단의 심플한 손 실루엣/품 모양으로 이동.
- 카피: **“다시 함께하기로 했습니다.”**
- 작은 실용 팁 1개: `사용 전 뚜껑·누수 상태를 확인하세요.`
- 버튼: `새 사건 접수`.

### SCREEN 05B — 유죄 엔딩 / 집행
- 캐릭터가 먼저 **원래 사물로 변환**. 의인화된 채 파괴하지 않는다.
- 3시간 MVP에서 기본 액션은 `망치`와 `쓰레기통` 두 개.
- 망치: CSS scale/rotate, 짧은 screen-shake, 미리 준비된 파편 6~10개.
- 쓰레기통: 드래그 또는 버튼으로 투입, `translate + rotate + scale`.
- 화염방사기/밟기: 완성 후 추가하는 **순수 가상 효과**. 실제 물건을 태우거나 위험하게 해체하도록 안내하지 않는다.
- 카피: **“판결은 끝났습니다. 현실에서는 올바르게 처리해 주세요.”**
- 마지막 패널: 종류별 **분리배출 확인 안내**. 지역 규칙 불확실 시 `지자체 안내 확인 필요` 명시.

## 5. 캐릭터 이미지 생성 아트 디렉션

**핵심:** 원본 사진의 물건 형태·색상·로고 없는 특징이 유지돼야 재미가 산다. 텍스트는 이미지를 생성할 때 넣지 말고 HTML 오버레이로 표현한다.

이미지 생성 프롬프트 초안:

> Transform the photographed object into an expressive anthropomorphic defendant for a whimsical miniature courtroom. Preserve the object's recognizable silhouette, color, material, wear and distinct features. Add simple cartoon arms, legs and expressive eyes; make the pose pleading but dignified. Warm theatrical spotlight, wooden defendant podium, understated cream courtroom backdrop, handcrafted stop-motion toy aesthetic, tangible materials, restrained palette. Centered full character, uncluttered composition, no text, no watermark, no extra people, no second object. 4:5 vertical composition.

**원본과 변신 캐릭터 이미지를 모두 저장**(세션 메모리/임시 URL). 엔딩은 캐릭터에서 원본으로 crossfade, 새 이미지 API 호출 금지.

## 6. 모션 디렉션

| 사건 | 타이밍 | 효과 |
|---|---|---|
| 피고인 입장 | 450ms | 아래에서 살짝 올라오며 페이드인 |
| 진술 시작 | 250ms | 문서 패널 펼쳐짐 |
| TTS 재생 | 음성 길이 | 작은 사운드 바, 캐릭터의 미세한 상하 움직임 |
| 판결 도장 | 550ms | 위에서 찍히는 도장 + 순간 흔들림 |
| 무죄 귀환 | 900ms | 이미지 crossfade + 아래로 이동 |
| 망치 집행 | 750ms | 도구 회전 → 충격 → 파편 분산 |
| 쓰레기통 | 750ms | 사물 축소 + 포물선 이동 |

- `prefers-reduced-motion: reduce`에서는 파편/흔들림 생략하고 즉시 결과 표시.
- 과한 스크롤 애니메이션, 페이지 전체 패럴랙스, 자동 반복 파티클 금지.
- 같은 종류의 모션을 모든 버튼에 적용하지 않는다. **판결 도장만 특별하게**.

## 7. 디자인 구현 결정 (3시간 MVP)

### 반드시 구현
1. 사진 업로드 + 폐기 이유 입력
2. 법정 화면 + AI 의인화 캐릭터 1컷
3. AI 최후 변론 + 재생 가능한 음성 또는 텍스트 대체
4. 인간의 무죄/유죄 선택
5. 무죄: 캐릭터→원본 crossfade + 귀환
6. 유죄: 캐릭터→원본 crossfade + 망치 또는 쓰레기통
7. API 실패 시 기본 이미지/텍스트 대체 흐름

### 시간이 남으면
- 검사 질문 1회
- 유죄 액션 2개 모두 구현
- 화염방사기 / 밟기 (가상 연출만)
- 작은 종이 조각 파티클 / 사운드 효과

### 하지 말 것
- 회원가입·대시보드·프로필·SNS 공유·물건 도감·실시간 채팅 서버
- 사진을 정확한 3D 메쉬로 변환
- 이미지 생성 API를 엔딩마다 다시 호출
- 부정확한 수리 가능성 확정, 가상의 탄소절감 수치 만들기

## 8. 컴포넌트 및 작업 분배

```text
src/
  components/
    CaseHeader.tsx            # 사건번호/단계
    EvidenceUploader.tsx      # 사진 제출
    CourtroomStage.tsx        # 중앙 장면(무대 배경)
    DefendantPortrait.tsx     # 캐릭터 이미지
    TestimonySheet.tsx        # 최후 변론 문서
    VerdictButtons.tsx        # 무죄/유죄
    EndingStage.tsx           # 귀환/집행
  styles/
    tokens.css                # 본 문서 색/타이포/간격
    motion.css                # 애니메이션
```

- 디자이너/프론트 A: 사건 접수 + 토큰 + 반응형
- 프론트 B: 법정/판결/엔딩 모션
- AI 담당: 이미지·변론 API + 응답 스키마
- 통합 담당: API 연결·예외 흐름·배포·시연

### 개발 AI에게 그대로 전달할 지시문

> Read `DESIGN.md` before implementing UI. Build Object Court as a whimsical, restrained paper-and-wood courtroom experience, not a generic AI SaaS landing page. Follow the exact color, typography, spacing, and motion tokens. Use a stage-centered layout, one dominant character image, short Korean courtroom copy, and only two primary verdict actions. Preserve object identity across character/original crossfades. Do not add gradient backgrounds, glass cards, unrelated dashboards, fake data, extra sections, or unnecessary animations. Prioritize a complete upload → plea → human verdict → ending flow that runs reliably within the hackathon demo.

## 9. 시연 품질 체크리스트

- [ ] 첫 화면에서 3초 안에 무엇을 하는 서비스인지 알 수 있다.
- [ ] 물건 이미지가 법정의 가장 눈에 띄는 요소다.
- [ ] 디자인이 5개 화면에서 같은 세계관을 유지한다.
- [ ] AI 변론과 실제 안전·폐기 안내가 구분된다.
- [ ] 최종 선택은 사용자에게 있다.
- [ ] 무죄/유죄 엔딩이 시각적으로 뚜렷하게 다르다.
- [ ] 이미지 생성 실패에도 시연을 계속할 수 있다.
- [ ] 390px 모바일과 1440px 데스크톱에서 주요 CTA가 가려지지 않는다.
- [ ] 키보드 포커스 및 모션 감소 설정이 작동한다.
- [ ] 실물 파괴·화재 위험을 부추기는 설명이 없다.

## 10. 출처 링크

- https://getdesignmd.org/
- https://getdesign.md/
- https://designdetails.io/
- https://mobbin.com/
- https://rive.app/use-cases/websites
- https://rive.app/use-cases/character-animation
- https://www.getmd.kr/

> 본 문서는 링크된 사이트의 독점 DESIGN.md를 복제하거나 실제 CSS 값을 추출한 결과가 아니다. 조사한 참고 리소스의 성격을 확인한 뒤, Object Court의 프로젝트 요구에 맞게 작성한 **독자적인 디자인 명세**다.
