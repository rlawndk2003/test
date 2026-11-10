# SensorSprout

검은 바탕 정가운데에 있는 새싹. 센서값이 높을수록 선명해지고, 낮을수록 투명해져 흐릿해진다.

- 별도 이미지 없이 `<div class="sprout">` 안의 단일 SVG로 그린다.
- 위치: 화면 정가운데. 감싸는 `<section aria-label="새싹 상태">`는 min-height 70vh, flex 세로 정렬로 가로 세로 가운데. 소제목 없음
- level = clamp((value − SENSOR_MIN) / (SENSOR_MAX − SENSOR_MIN), 0, 1)
- level에 따라 새싹 전체의 opacity를 0.15에서 1까지 올린다. 새싹 크기와 형태는 바꾸지 않는다.
- 모션은 opacity transition만 사용하고, reduced-motion에서는 transition을 제거한다.
- 새싹 아래 space-6 간격으로 현재값 `t-value` (천 단위 콤마, 값 없으면 "—")
- `role="img"`, `aria-label="새싹 선명도 NN%"`
