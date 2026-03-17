import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import './SharePage.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.solobeaute.com/api/v1'
const SITE_BASE_URL = import.meta.env.VITE_SITE_URL || 'https://solobeaute.com'

export default function SharePage({ type }) {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadDetail() {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(`${API_BASE_URL}/${type === 'space' ? 'spaces' : 'beauticians'}/${id}`)
        const payload = await response.json()

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error('NOT_FOUND')
        }

        if (isMounted) {
          setData(payload.data)
        }
      } catch {
        if (isMounted) {
          setError('找不到這個分享內容')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadDetail()

    return () => {
      isMounted = false
    }
  }, [id, type])

  const pageTitle = useMemo(() => {
    if (!data) {
      return 'SoloBeauté Share'
    }

    return type === 'space'
      ? `${data.title} | SoloBeauté`
      : `${data.displayName} | SoloBeauté`
  }, [data, type])

  useEffect(() => {
    document.title = pageTitle
  }, [pageTitle])

  const shareUrl = `${SITE_BASE_URL}/share/${type}/${id}`
  const appUrl = `tw.solobeauty.app://${type}/${id}`
  const heroImageUrl = resolveHeroImage(type, data)
  const tagList = resolveTags(type, data)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="share-page">
      <div className="share-page__backdrop" />
      <main className="share-page__shell">
        <div className="share-page__brand">
          <img src="/images/brand/logo.png" alt="SoloBeauté" />
          <span>SoloBeauté</span>
        </div>

        {isLoading ? (
          <section className="share-card share-card--state">
            <p>載入中...</p>
          </section>
        ) : error ? (
          <section className="share-card share-card--state">
            <h1>內容不存在</h1>
            <p>{error}</p>
            <a className="share-card__secondary" href={SITE_BASE_URL}>
              返回 SoloBeauté
            </a>
          </section>
        ) : (
          <section className="share-card">
            <div className="share-card__media">
              {heroImageUrl ? (
                <img src={heroImageUrl} alt={pageTitle} />
              ) : (
                <div className="share-card__media-fallback">
                  <span>{type === 'space' ? 'SPACE' : 'BEAUTICIAN'}</span>
                </div>
              )}
            </div>

            <div className="share-card__body">
              <p className="share-card__eyebrow">{type === 'space' ? '分享空間' : '分享美容師'}</p>
              <h1 className="share-card__title">
                {type === 'space' ? data.title : data.displayName}
              </h1>
              <p className="share-card__summary">
                {type === 'space'
                  ? `${data.city} ${data.district} ・ NT$${data.hourlyRate}/hr`
                  : buildBeauticianSummary(data)}
              </p>

              <div className="share-card__metrics">
                <span>⭐ {buildRatingText(data.ratingAvg, data.ratingCount)}</span>
                {type === 'beautician' && data.services?.length > 0 ? (
                  <span>{data.services.length} 項服務</span>
                ) : null}
              </div>

              {tagList.length > 0 ? (
                <div className="share-card__tags">
                  {tagList.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              ) : null}

              <div className="share-card__actions">
                <a className="share-card__primary" href={appUrl}>
                  在 App 開啟
                </a>
                <button className="share-card__secondary" type="button" onClick={copyLink}>
                  {copied ? '已複製連結' : '複製連結'}
                </button>
              </div>

              <p className="share-card__hint">
                沒有安裝 App 也可以直接在這個網頁查看內容。
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function resolveHeroImage(type, data) {
  if (!data) return ''

  if (type === 'space') {
    return resolveImageUrl(data.photos?.[0]?.url)
  }

  return resolveImageUrl(data.portfolioUrls?.[0] || data.user?.avatarUrl)
}

function resolveTags(type, data) {
  if (!data) return []

  if (type === 'space') {
    return (data.recommendedServices || []).slice(0, 3)
  }

  return (data.specialties || []).slice(0, 3)
}

function resolveImageUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `https://api.solobeaute.com${path}`
}

function buildRatingText(ratingAvg, ratingCount) {
  if (!ratingCount) {
    return '尚無評價'
  }

  return `${Number(ratingAvg || 0).toFixed(1)} (${ratingCount})`
}

function buildBeauticianSummary(profile) {
  if (profile.yearsExperience > 0) {
    return `${profile.yearsExperience} 年經驗`
  }

  const specialties = (profile.specialties || []).slice(0, 3)
  if (specialties.length > 0) {
    return specialties.join(' ・ ')
  }

  return '美容師品牌頁'
}
