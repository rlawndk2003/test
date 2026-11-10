# SensorSprout

검은 바탕 정가운데에 있는 새싹. 센서값에 따라 줄기가 자라고 두 잎이 펼쳐진다.

- 별도 이미지 없이 `<div class="sprout">` 안의 단일 SVG로 그린다.
- 위치: 화면 정가운데. 감싸는 `<section aria-label="새싹 상태">`는 min-height 70vh, flex 세로 정렬로 가로 세로 가운데. 소제목 없음
- level = clamp((value − SENSOR_MIN) / (SENSOR_MAX − SENSOR_MIN), 0, 1)
- level에 따라 줄기 `scaleY`, 두 잎 `scale`, 잎의 불투명도가 증가한다.
- 모션은 값이 바뀔 때의 transition만 사용하고, reduced-motion에서는 transition을 제거한다.
- 새싹 아래 space-6 간격으로 현재값 `t-value` (천 단위 콤마, 값 없으면 "—")
- `role="img"`, `aria-label="새싹 성장 NN%"`
