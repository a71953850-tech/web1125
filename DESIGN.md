---
version: alpha
name: 저녁 테라스
description: 따뜻한 전구빛과 라탄의 질감을 출장여비 계산기의 시각 언어로 옮긴 디자인 시스템.
colors:
  primary: "#23291E"
  on-primary: "#FFF6E8"
  secondary: "#735238"
  accent: "#E8AC59"
  accent-hover: "#F0BA71"
  on-accent: "#23291E"
  canvas: "#F2DFC3"
  surface: "#FFF6E8"
  surface-raised: "#FFFAF2"
  text: "#2B241C"
  text-muted: "#6B5141"
  border: "#947455"
  focus: "#395C7F"
  error: "#852E24"
  on-error-container: "#852E24"
  error-container: "#FBE7E0"
typography:
  headline-lg:
    fontFamily: '"Malgun Gothic", "Apple SD Gothic Neo", system-ui, sans-serif'
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 1.25
  headline-md:
    fontFamily: '"Malgun Gothic", "Apple SD Gothic Neo", system-ui, sans-serif'
    fontSize: 1.125rem
    fontWeight: 700
    lineHeight: 1.4
  body-md:
    fontFamily: '"Malgun Gothic", "Apple SD Gothic Neo", system-ui, sans-serif'
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  label-md:
    fontFamily: '"Malgun Gothic", "Apple SD Gothic Neo", system-ui, sans-serif'
    fontSize: 0.875rem
    fontWeight: 700
    lineHeight: 1.45
  total:
    fontFamily: '"Malgun Gothic", "Apple SD Gothic Neo", system-ui, sans-serif'
    fontSize: 2.5rem
    fontWeight: 800
    lineHeight: 1.2
    fontFeature: '"tnum"'
rounded:
  sm: 8px
  md: 12px
  lg: 16px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  header:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  field:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    height: 44px
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    height: 44px
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.on-accent}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    height: 44px
  result-total:
    textColor: "{colors.primary}"
    typography: "{typography.total}"
---

# 저녁 테라스

## Overview

짙은 잎과 푸른 저녁빛이 테라스를 감싸고, 전구와 촛불이 라탄 소파와 크림색 쿠션을 비춘다. 햇빛이 사라진 공간에서 따뜻하게 밝힌 중앙이 먼저 보이는 구도를 가져온다. 출장여비 계산기에서는 올리브색 상단, 밝은 입력 카드, 골드색 계산 버튼으로 이 위계를 구현한다.

## Colors

아래 표본은 첨부 사진에서 각 소재가 보이는 작은 영역의 RGB 중앙값을 추정한 것이다. YAML의 색상은 이 표본을 화면의 대비와 역할에 맞춰 조정한 적용값이다.

| 사진 요소 | 대표 표본 | 화면에서의 역할 |
| --- | --- | --- |
| 어두운 잎 | `#11140D` | 딥 올리브 상단 바와 결과 금액 |
| 라탄 짜임과 소파 원단 | `#403025`, `#986947` | 브라운 보조 버튼, 입력 테두리 |
| 밝은 쿠션 | `#D7BFB5` | 샌드 베이지 바탕과 웜 아이보리 카드 |
| 촛불을 받은 물체 | `#E79955` | 앰버 골드 기본 버튼과 결과 카드의 가는 강조선 |
| 뒤편의 푸른 저녁빛 | `#395C7F` | 키보드 포커스 표시 |

앰버 버튼에는 짙은 올리브 글자를 사용한다. 아이보리 카드의 본문과 보조 설명에는 각각 `text`와 `text-muted`를 쓴다. 오류는 브릭색 글자와 밝은 배경 위에 원인과 수정 방법을 문장으로 표시한다.

## Typography

한글 시스템 글꼴을 사용해 오프라인에서도 읽기 쉽게 표시한다. 화면 제목은 36px, 카드 제목은 18px, 본문은 16px, 필드 레이블과 보조 설명은 14px을 기준으로 한다. 예상 지급액은 40px 굵은 숫자로 표시하고 좁은 화면에서는 32px까지 줄인다. 항목별 금액은 천 단위 구분을 유지하고 고정폭 숫자로 오른쪽에 맞춘다.

## Layout

넓은 화면에서는 왼쪽에 입력 폼, 오른쪽에 예상 지급액을 두고 약 5 대 3 비율로 배치한다. 전체 폭은 최대 1,100px, 열 사이 간격은 24px이다. 같은 입력 그룹 안에서는 16px 간격을 사용한다. 화면이 760px 이하일 때는 입력 폼, 계산 버튼, 결과 순서의 한 열로 놓는다. 결과 영역의 인쇄·엑셀 저장 버튼은 공간에 맞춰 줄바꿈한다.

## Elevation & Depth

짙은 상단, 샌드색 바탕, 밝은 카드의 명도 차이로 깊이를 만든다. 사진 속 라탄의 결은 반복되는 가는 구분선과 화면 여백으로 표현한다. 상단에 테라스 사진을 활용하는 경우에만 희미한 전구빛을 살리고, 금액과 입력값이 놓인 면에는 단색 배경을 사용한다.

## Shapes

카드 모서리는 16px, 카드 안의 운임·숙박 항목 묶음은 12px, 버튼과 입력 필드는 8px 반경으로 다듬는다. 입력 필드와 주요 버튼에는 최소 44px 높이를 확보한다.

## Components

- **상단 바**는 딥 올리브 바탕과 아이보리 글자로 앱 이름과 오프라인 사용 상태를 표시한다.
- **입력 카드**는 밝은 아이보리, 가는 브라운 테두리, 위쪽 필드 레이블을 사용한다. 안내 문구는 관련 입력 바로 아래에 둔다.
- **여비 계산**은 앰버로 채운 기본 버튼이다. **결과 인쇄**, **엑셀 저장**, **초기화**에는 브라운 테두리와 아이보리 바탕을 사용한다.
- **결과 카드**는 가는 골드 상단선, 예상 지급액, 출장 기간, 항목별 금액 순으로 배치한다. 인쇄 화면에는 흰 바탕과 검정 글자를 사용하고 결과 내역이 읽히도록 한다.
- **입력 상태**는 키보드 포커스에 2px 이상의 더스크 블루 외곽선을, 오류에는 브릭색과 원인을 설명하는 문구를 사용한다.

문서 구조와 토큰 문법은 [Google DESIGN.md 형식 사양](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md)을 따랐다.
