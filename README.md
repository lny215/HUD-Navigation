# 🔍 Accessibility & Tagging HUD Inspector (Chrome Extension)

웹 UI 개발 및 접근성(Accessibility) 검수를 위한 **고정밀 DOM 속성 검사 크롬 확장 프로그램**입니다.  
복잡한 미디어 래퍼, 지연 로딩(Lazy Loading), 영역을 덮고 있는 오버레이 이미지 속에서도 실제 마우스 커서 위치 아래의 **H태그, ALT값, P태그, `data-contents` 태깅 속성**을 정밀하게 추출하여 시각화합니다.

---

## ✨ 주요 기능 (Key Features)

- 🎯 **정밀 투과 호버 탐색 (Precision Layer Inspection)**
  - `elementsFromPoint` 기반 다중 레이어 투과로 클릭 방지 투명 오버레이 패널 뒤의 최하위 타깃 요소까지 수집
  - `requestAnimationFrame` 쓰로틀링 적용으로 마우스 이동 시 렉(Latency) 없는 쾌적한 렌더링
- 🏷️ **`data-contents` 태깅 아코디언 그룹화**
  - `_A1_` 형태의 규격화된 코드를 자동 파싱하여 동일 코드 항목끼리 트리 아코디언 구조로 정리
- 📌 **사이드바 네비게이션 & 실시간 토글 (Tri-Tab Navigation)**
  - H태그 구조 트리, 태깅값 그룹, 메타 디스크립션 전용 탭 지원
  - 원하는 위치로 원클릭 스크롤(`scrollIntoView`) 및 하늘색 하이라이트 애니메이션
- 💡 **메타 디스크립션 플로팅 배너 (Draggable Meta Banner)**
  - `meta[name="description"]` 속성을 화면 상단 드래그 가능한 배너 형태로 실시간 고정 표출
- 🔒 **보안 및 경량화 (Security & Performance)**
  - XSS 방지를 위한 HTML 이스케이프 처리 및 메모리 누수 방지

---

## 🎨 기술 스택 (Tech Stack)

- **Platform**: Chrome Extension (Manifest V3)
- **Language**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Font**: Pretendard Variable

---

## 🚀 설치 및 사용 방법 (Getting Started)

1. 이 저장소를 클론(Clone)하거나 ZIP으로 다운로드합니다.
   ```bash
   git clone [https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git](https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git)
   ```
2. Chrome 브라우저에서 `chrome://extensions` 로 이동합니다.
3. 우측 상단의 **[개발자 모드]**를 활성화합니다.
4. **[압축해제된 확장 프로그램을 로드합니다]** 버튼을 누르고 프로젝트 폴더를 선택합니다.
5. 검수할 웹페이지에서 확장 프로그램 팝업 및 사이드바 기능을 사용합니다.

---

## 🔒 License

Distributed under the MIT License. See `LICENSE` for more information.