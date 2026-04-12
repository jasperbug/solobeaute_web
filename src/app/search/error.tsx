'use client'

export default function SearchError() {
  return (
    <main className="bg-[var(--color-bg)] pb-20 pt-32">
      <div className="container">
        <div className="sb-card px-6 py-10 text-center">
          <h1 className="text-2xl font-semibold text-ink">搜尋結果暫時無法載入</h1>
          <p className="mt-3 text-sm leading-7 text-black/60">請稍後再試，或返回首頁重新開始搜尋。</p>
        </div>
      </div>
    </main>
  )
}
