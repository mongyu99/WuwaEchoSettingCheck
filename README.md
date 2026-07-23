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
  components/
    ImageUploader.jsx     # 사진 업로드 + 자동 크롭 + 업로드 즉시 자동 추출 (캡처 페이지에서 사용)
    EchoPanel.jsx          # 메인/서브 스탯 표시 및 서브 스탯 드롭다운 편집 (수정 페이지에서 사용)
    ProcessingOverlay.jsx   # 인식 중 화면 전체를 덮는 로딩 오버레이 (캐릭터 사진 + 회전 링)
  pages/
    CharacterSelectPage.jsx  # 캐릭터 선택 화면 (사진+이름 카드 그리드) — 앱의 시작 화면
    CapturePage.jsx           # 캐릭터 선택 후 에코 캡처 화면 (왼쪽 캐릭터 사진 + 오른쪽 업로더)
    EditPage.jsx               # 캡처 이후 스탯 확인/수정 화면
    StatsPage.jsx                # 점수 통계 화면 (왼쪽 캐릭터/유효 옵션, 오른쪽 에코별 점수 카드 그리드)
  config/
    characters.js             # 캐릭터 목록 (사진 경로 + 이니셜 폴백)
    characterValidOptions.js   # 캐릭터별 유효 옵션(점수에 반영할 서브스탯) 목록
    regions.js                  # 고정 크롭 좌표
    mainStatBonusNames.js        # 메인 스탯 1번째 줄 후보 목록
    subStatOptions.js             # 서브 스탯 고정 카탈로그 (스탯명 + 가능한 수치, 단계)
  utils/
    ocr.js                    # Tesseract.js 래핑, 텍스트 정리/보정, 카탈로그 매칭
    image.js                   # 정규화/크롭/OCR 전처리/dataURL 변환
    pipeline.js                  # 사진 한 장을 크롭까지 처리하는 재사용 파이프라인 (사진 교체용)
    highlight.js                 # 서브 스탯 줄의 노란색 하이라이트 판별 (참고용 데이터, 점수엔 미반영)
    scoring.js                    # 단계(tier) 기반 점수 계산 (StatsPage가 사용)
    persist.js                     # localStorage 저장/복원 (진행 상태 유지)
    scoreCalculator.js            # 예전 점수 로직 (더 이상 쓰이지 않음)
  App.jsx                      # 페이지 라우팅 및 전역 상태(캐릭터, 에코 목록) 관리
  index.css                    # 디자인 토큰 (색상/타이포)
scripts/
  prepare-character-images.mjs  # raw-characters/ 원본 사진을 610x840 고정 크기로 리사이즈해 public/characters/에 생성
raw-characters/                  # 캐릭터 원본 사진 보관 (리사이즈 스크립트의 입력)
public/characters/                # 리사이즈된 캐릭터 사진 (앱이 실제로 불러오는 파일)
```

## 트러블슈팅 내역 (Troubleshooting)
