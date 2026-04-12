export type ServiceArea = {
  cityId: number
  city: string
  districtId: number | null
  district: string | null
} | null

export type SocialLinks = Partial<Record<'instagram' | 'facebook' | 'threads' | 'website', string>>

export type UserSummary = {
  id: string
  name: string | null
  avatarUrl: string | null
}

export type BeauticianService = {
  id: string
  beauticianId: string
  name: string
  category: string
  description: string | null
  price: number
  durationMin: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type ReviewAuthor = {
  id: string
  name: string | null
  avatarUrl: string | null
}

export type PublicReview = {
  id: string
  reviewerId: string
  targetType: 'SPACE' | 'BEAUTICIAN'
  rating: number
  comment: string | null
  imageUrls: string[]
  hostReplyContent: string | null
  hostRepliedAt: string | null
  createdAt: string
  spaceId: string | null
  beauticianId: string | null
  reviewer: ReviewAuthor
}

export type BeauticianSummary = {
  id: string
  userId: string
  slug: string | null
  displayName: string
  bio: string | null
  specialties: string[]
  licenses: string[]
  licenseVerified: boolean
  portfolioUrls: string[]
  announcement: string | null
  announcementImageUrls: string[]
  socialLinks: SocialLinks
  yearsExperience: number | null
  ratingAvg: number
  ratingCount: number
  isPro: boolean
  proExpiresAt: string | null
  createdAt: string
  updatedAt: string
  user: UserSummary
  services: BeauticianService[]
  serviceArea: ServiceArea
  portfolioPreviewUrl: string | null
  reviewStatus: 'APPROVED' | 'PENDING' | 'CHANGES_REQUESTED' | string
  serviceCount?: number
}

export type BeauticianDetail = BeauticianSummary & {
  reviews: PublicReview[]
  ratingDistribution: Record<'1' | '2' | '3' | '4' | '5', number>
  canContact: boolean
}

export type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type BeauticianSearchParams = {
  page?: number
  limit?: number
  category?: string
  specialty?: string
  city?: string
  district?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  verified?: boolean
  search?: string
  sortBy?: string
}

export type BeauticianSearchResponse = {
  success: true
  data: BeauticianSummary[]
  pagination: Pagination
}

export type BeauticianDetailResponse = {
  success: true
  data: BeauticianDetail
}

export type FeaturedBeauticianResponse = {
  success: true
  data: BeauticianSummary[]
}

export type ShareEntityType = 'space' | 'beautician'

export type SpacePhoto = {
  url: string
}

export type SpaceSummary = {
  id: string
  title: string
  city?: string
  district?: string
  hourlyRate?: number
  photos?: SpacePhoto[]
  recommendedServices?: string[]
  ratingAvg?: number
  ratingCount?: number
}

export type ShareableSpaceResponse = {
  success: true
  data: SpaceSummary
}

export type ShareableBeauticianResponse = {
  success: true
  data: BeauticianDetail
}
