# Echo Setting Check

메아리(에코) 스크린샷에서 서브스탯을 자동 추출 → 확인/수정 → 캐릭터별 유효 옵션 기준 점수 통계까지
처리하는 정적 웹 앱입니다.

## 시작하기 (VSCode)

## 화면 흐름 (페이지 구조)

```
캐릭터 선택 (시작 화면)
  └ 에코 캡처 (사진 업로드 + 자동 추출)
      └ 수정 (스탯 확인/수정, 사진 교체)
          └ 점수 통계 (유효 옵션만 반영해 점수 계산)
```

## 프로젝트 구조

```
src/
  main.jsx                      # 앱 진입점
  App.jsx                       # 페이지 라우팅 + 전역 상태(캐릭터별 에코/무기/에코세트조합/기초스탯) 관리
  App.css / index.css           # 레이아웃 셸 스타일 / 디자인 토큰(색상·타이포)

  pages/
    CharacterSelectPage.jsx     # 캐릭터 선택 화면 (검색 + 속성 필터 + 사진 카드 그리드) — 앱의 시작 화면
    CapturePage.jsx             # 캐릭터 선택 후 에코 캡처 화면 (캐릭터 사진 + 업로더)
    EditPage.jsx                # 캡처 이후 스탯 확인/수정 화면
    StatsPage.jsx                # 점수 통계 + 목표 스탯 계산기 화면 — 캐릭터/무기/에코 세트 조합/
                                  #   합산 스탯/이잘키 추천/에코 상세 편집/계산기를 한 화면에서 관리

  components/
    ImageUploader.jsx           # 사진 업로드 + 자동 크롭 + 업로드 즉시 자동 추출 (CapturePage에서 사용)
    EchoPanel.jsx                # 메인/서브 스탯 표시 및 서브 스탯 드롭다운 편집 (StatsPage에서 사용)
    ProcessingOverlay.jsx        # 인식 중 화면 전체를 덮는 로딩 오버레이
    Modal.jsx                    # 무기/에코 세트 조합 선택 팝업에 쓰는 범용 모달 셸
    ConfirmDialog.jsx            # 초기화 등 확인이 필요한 동작에 쓰는 확인/취소 다이얼로그
    HomePage.jsx / ScoreDisplay.jsx / SidebarNav.jsx / ExtractedForm.jsx / InfoTooltip.jsx
                                  # 미사용(어느 페이지에서도 import되지 않음) — 정리 대상 후보

  config/
    characters.js                # 캐릭터 목록 (사진 경로 + 이니셜 폴백, 5성만 유지)
    characterBaseStats.js        # 캐릭터별 기초 스탯 + 고유 % 보너스
    characterValidOptions.js     # 캐릭터별 유효 옵션(점수에 반영할 서브스탯) 목록
    characterEchoSets.js         # 캐릭터 ↔ 에코 세트 "조합"(defineCombo) 연결 — 고정 또는 여러 조합 중 선택
    characterMainEchoBonus.js    # 캐릭터+메인에코 조합 데미지 보너스 계산식(스탯 스케일링용, 현재 빈 틀)
    characterRecommendations.js  # 캐릭터별 "이잘키 추천" 빌드 정보(무기/세트/주옵 등)
    weapons.js                   # 무기 카탈로그(플랫 공격력 + 부스탯 + 패시브 보너스)
    echoSets.js                  # 에코 세트 카탈로그(defineSet 팩토리, 세트별 단계(1/2/3/5)·보너스·아이콘)
    mainEchoes.js                # 메인 에코(4코스트) 카탈로그(이름/아이콘/설명/장착 보너스)
    echoSetMainEchoes.js         # 에코 세트 ↔ 메인 에코 연결(세트를 고르면 메인 에코가 자동으로 딸려옴)
    regions.js                   # 캡처 화면 고정 크롭 좌표
    mainStatBonusNames.js        # 메인 스탯 1번째 줄 후보 목록
    subStatOptions.js            # 서브 스탯 고정 카탈로그(스탯명 + 가능한 수치·단계)
    subStatProbabilities.js      # 서브 스탯 옵션 변경 시 단계별 확률표

  utils/
    ocr.js                       # Tesseract.js 래핑, 텍스트 정리/보정, 카탈로그 매칭, 코스트 추론
    image.js                     # 정규화/크롭/OCR 전처리/dataURL 변환
    pipeline.js                  # 사진 한 장을 크롭까지 처리하는 재사용 파이프라인(사진 교체용)
    highlight.js                 # 서브 스탯 줄의 노란색 하이라이트 판별(참고용, 점수엔 미반영)
    probability.js                # 서브스탯이 목표 단계 이상으로 나올 확률 계산
    optimizer.js                 # "목표 스탯 계산기"의 추천 로직(빈 자리 채우기·민맥싱·재배치)
    persist.js                   # localStorage 저장/복원(진행 상태 유지, previewUrl 제외)
    scoreCalculator.js           # STAT_WEIGHTS(스탯명 카탈로그)만 ocr.js가 재사용 중 — 점수 계산 자체는 더 이상 안 씀

scripts/
  prepare-character-images.mjs   # raw-characters/ 원본 사진을 610x840 고정 크기로 리사이즈해 public/characters/에 생성

raw-characters/                  # 캐릭터 원본 사진 보관(리사이즈 스크립트 입력)
raw-weapons/                     # 무기 원본 사진 보관

public/
  characters/                    # 리사이즈된 캐릭터 사진
  weapons/                       # 무기 아이콘
  echo-sets/                     # 에코 세트 아이콘(세트 id.png — 실제 이미지 없으면 빈 PNG로 자리만 잡아둠)
  main-echoes/                   # 메인 에코 아이콘
```

## 트러블슈팅 내역 (Troubleshooting)
