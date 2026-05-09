# AutomationExercise QA 통합 실습

Automation Exercise 공개 서비스를 대상으로 **Postman/Newman API 테스트**와 **Playwright UI 테스트**를 함께 구성한 웹서비스 QA 통합 실습 프로젝트입니다.

이 프로젝트는 단순 도구 사용 실습이 아니라, 테스트 범위 정의 → TC 설계 → API/UI 자동화 → CLI 로그/HTML Report 산출물 정리 → GitHub Pages 기반 포트폴리오 연결까지 하나의 흐름으로 구성하는 것을 목표로 합니다.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 대상 서비스 | Automation Exercise |
| 대상 URL | https://automationexercise.com/ |
| 테스트 범위 | 회원가입, 로그인/인증, 상품 검색, 장바구니, 계정 삭제 |
| API 테스트 도구 | Postman, Newman |
| UI 테스트 도구 | Playwright |
| 실행 환경 | Windows 11, PowerShell 5, Node.js, npm |
| 산출물 | Newman Report, Playwright HTML Report, CLI Log |

---

## 2. 테스트 범위

본 실습은 웹서비스의 핵심 사용자 흐름을 아래 5개 기능 축으로 나누어 검증했습니다.

1. 회원가입
2. 로그인/인증
3. 상품 검색
4. 장바구니 상태 변경
5. 계정 삭제

API 테스트는 요청/응답, 상태코드, 응답 메시지, 데이터 체이닝을 중심으로 검증했고, UI 테스트는 실제 사용자 행동 기준의 화면 전환, 입력, 버튼 동작, 상태 반영을 중심으로 검증했습니다.

---

## 3. 테스트 설계 기준

- Google Sheet 기반으로 기능별 TC를 설계했습니다.
- API와 UI를 동일 기능 축 안에서 분리해 검증했습니다.
- API는 데이터와 응답 규칙 중심, UI는 사용자 흐름과 화면 반응 중심으로 역할을 나누었습니다.
- 회원가입/로그인/계정 삭제처럼 상태 의존성이 있는 테스트는 동적 이메일을 사용해 재실행 가능하도록 구성했습니다.
- UI 테스트는 이전 테스트 결과에 의존하지 않고, 각 테스트가 필요한 전제조건을 자체적으로 준비하도록 작성했습니다.

---

## 4. Postman / Newman API 테스트

### 구성

```text
postman
├─ AutomationExercise_API_Test.postman_collection.json
├─ ENV_AutomationExercise_API_Test.postman_environment.json
├─ run_newman.ps1
├─ run_newman.bat
└─ reports
```

### 주요 검증 내용

- 동적 이메일 생성
- 신규 계정 생성
- 생성 계정 조회
- 정상/비정상 로그인
- 상품 검색 API 응답 검증
- 계정 삭제
- 삭제 후 조회 실패 확인
- Cleanup 단계에서 실행 중 생성된 Postman 변수 정리

### API 테스트 특징

API 테스트는 요청 단위 검증과 계정 생명주기 기반 체이닝 검증을 함께 구성했습니다.

```text
동적 이메일 생성
→ 계정 생성
→ 계정 조회
→ 로그인 검증
→ 계정 삭제
→ 삭제 후 조회 실패 확인
→ 변수 Cleanup
```

---

## 5. Playwright UI 테스트

### 구성

```text
playwright
├─ tests
│  ├─ 01_auth
│  │  ├─ 01_signup.spec.js
│  │  └─ 02_login.spec.js
│  ├─ 02_search
│  │  └─ 01_search.spec.js
│  ├─ 03_cart
│  │  └─ 01_cart.spec.js
│  └─ 04_account
│     └─ 01_delete-account.spec.js
├─ utils
│  ├─ testData.js
│  ├─ signupHelper.js
│  └─ uiHelper.js
├─ reports
│  ├─ playwright_report_YYMMDD_HHMMSS
│  │  └─ index.html
│  └─ logs
│     └─ playwright_cli_YYMMDD_HHMMSS.log
├─ run_playwright.ps1
├─ run_playwright_headed.ps1
├─ run_playwright.bat
└─ run_playwright_headed.bat
```

### UI 테스트 결과

| 기능 | TC 수 | 결과 |
|---|---:|---|
| 회원가입 | 6 | PASS |
| 로그인/인증 | 6 | PASS |
| 상품 검색 | 7 | PASS |
| 장바구니 | 10 | PASS |
| 계정 삭제 | 3 | PASS |
| **합계** | **32** | **PASS** |

### 주요 구현 포인트

- 번호 기반 폴더/파일 구조로 실행 흐름 정렬
- 각 TC가 필요한 전제조건을 직접 준비하도록 구성
- 동적 이메일 기반 신규 계정 생성
- 회원가입 반복 입력 로직을 `signupHelper.js`로 분리
- Google Vignette 광고 노출 시 `Close` 버튼을 감지해 닫는 예외처리 구현
- CLI 로그와 Playwright HTML Report를 실행 시점별로 보관
- Headed / Headless 전체 실행 모두 PASS 확인

---

## 6. 실행 방법

### Postman / Newman 실행

```powershell
cd C:\00_QA\AutomationExercise\postman
.\run_newman.bat
```

### Playwright UI 테스트 실행

기본 Headless 실행:

```powershell
cd C:\00_QA\AutomationExercise\playwright
.\run_playwright.bat
```

브라우저 표시 Headed 실행:

```powershell
cd C:\00_QA\AutomationExercise\playwright
.\run_playwright_headed.bat
```

직접 실행:

```powershell
cd C:\00_QA\AutomationExercise\playwright
npx playwright test
npx playwright test --headed
npx playwright show-report
```

---

## 7. 산출물

### API 산출물

- Newman HTML Report
- Newman JSON Report
- Newman CLI Log

### UI 산출물

- Playwright HTML Report
- Playwright CLI Log
- 실패 시 screenshot / video / trace 산출 가능

### GitHub Pages 연결 기준

리포트와 로그는 GitHub Pages에서 확인 가능한 형태로 관리합니다.

```text
playwright/reports/playwright_report_YYMMDD_HHMMSS/index.html
playwright/reports/logs/playwright_cli_YYMMDD_HHMMSS.log
```

---

## 8. 트러블슈팅 및 개선 포인트

### Google Vignette 광고 예외처리

상품 페이지 진입 시 간헐적으로 `#google_vignette` 광고 레이어가 노출되어 `/products` 이동 검증이 실패하는 문제가 있었습니다.

이를 테스트 대상 기능의 결함이 아닌 외부 광고 레이어 간섭으로 판단하고, 공통 UI helper에서 `Close` 버튼을 감지해 닫는 방식으로 예외처리했습니다.

### Windows / PowerShell 5 로그 인코딩

한글 TC명과 ANSI 컬러 코드가 CLI 로그에 깨지거나 제어문자로 남는 문제가 있어, `.bat`의 UTF-8 코드페이지 설정과 PowerShell 로그 저장 시 ANSI 제거 로직을 적용했습니다.

---

## 9. 회고

이번 실습을 통해 웹서비스 QA에서 API 테스트와 UI 테스트를 어떻게 분리하고 연결할 수 있는지 확인했습니다.

특히 단순히 테스트 코드를 작성하는 것에서 끝내지 않고, TC 설계, 실행 스크립트, 로그, HTML Report, GitHub Pages 연결까지 포함해 포트폴리오로 설명 가능한 산출물 구조를 구성했습니다.

---

## 10. 관련 문서

- 상세 TC 시트: https://docs.google.com/spreadsheets/d/1R6EbpAYBsj402XYRLijOSnZVHxmYSjTSWGgJa7a4qGM
- 설계 문서: https://www.notion.so/35865480da4280ed90d7f3f46f766b2a
