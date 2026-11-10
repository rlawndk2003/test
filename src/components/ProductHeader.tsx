import { useEffect } from "react"
import { IS_DEMO_MODE } from "../lib/supabase"
import { PRODUCT } from "../product"

function Slot({
  value,
  placeholder,
  className,
}: {
  value: string
  placeholder: string
  className: string
}) {
  return (
    <div className={`${className}${value ? "" : " placeholder"}`}>
      {value || placeholder}
    </div>
  )
}

export default function ProductHeader() {
  useEffect(() => {
    document.title = PRODUCT.name
  }, [])

  return (
    <header className="product-header">
      <Slot
        value={PRODUCT.name}
        placeholder="[제품 이름]"
        className="t-display product-name"
      />
      <Slot
        value={PRODUCT.concept}
        placeholder="[제품 컨셉, 한 줄]"
        className="t-label product-concept"
      />
      <Slot
        value={PRODUCT.description}
        placeholder="[제품 설명, 2~3문장]"
        className="t-body product-description"
      />
      {IS_DEMO_MODE && (
        <p className="t-caption demo-caption">데모 데이터로 표시 중</p>
      )}
    </header>
  )
}
