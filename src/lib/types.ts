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
  reviewStatus: 'APPROVED' | 'PENDING' | 'CHANGES_REQUESTED'
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

// ---------------------------------------------------------------------------
// Public space pages (/spaces, /spaces/[id])
//
// PRIVACY: the backend /spaces endpoints also return the full street address,
// latitude/longitude, host name/avatar, camera locations, bookings and
// schedules. NONE of those fields exist on PublicSpace on purpose: raw API
// records are reduced to this whitelist in `toPublicSpace()` (lib/spaces.ts)
// on the server, so the extra fields can never reach the HTML, JSON-LD or the
// RSC payload. Do not add address / latitude / longitude / host here without
// Jasper's sign-off (approved scope: city + district only).
// ---------------------------------------------------------------------------

export type SpaceStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export type SpaceType = 'OPEN_SPACE' | 'CURTAIN_PARTITION' | 'PRIVATE_ROOM'

export type CameraDisclosureStatus = 'HAS_CAMERA' | 'NO_CAMERA' | 'UNDISCLOSED'

export type PublicSpacePhoto = {
  url: string
  category: string | null
}

export type PublicSpace = {
  id: string
  title: string
  description: string | null
  city: string | null
  district: string | null
  spaceType: SpaceType | null
  isFullyPrivate: boolean
  hourlyRate: number | null
  halfDayRate: number | null
  fullDayRate: number | null
  minimumHours: number | null
  maxCapacity: number | null
  equipment: string[]
  recommendedServices: string[]
  prohibitedServices: string[]
  cameraDisclosureStatus: CameraDisclosureStatus | null
  coverPhotoUrl: string | null
  photos: PublicSpacePhoto[]
  roomScanUrl: string | null
  ratingAvg: number
  ratingCount: number
  updatedAt: string | null
}

/** Shape of the raw backend record — only the fields we read. */
export type RawSpaceRecord = {
  id: string
  status?: SpaceStatus | string | null
  deletedAt?: string | null
  title?: string | null
  description?: string | null
  city?: string | null
  district?: string | null
  spaceType?: string | null
  isFullyPrivate?: boolean | null
  hourlyRate?: number | null
  halfDayRate?: number | null
  fullDayRate?: number | null
  minimumHours?: number | null
  maxCapacity?: number | null
  equipment?: string[] | null
  recommendedServices?: string[] | null
  prohibitedServices?: string[] | null
  cameraDisclosureStatus?: string | null
  coverPhoto?: { url?: string | null } | null
  photos?: Array<{ url?: string | null; category?: string | null; sortOrder?: number | null }> | null
  roomScan?: { usdzUrl?: string | null } | null
  ratingAvg?: number | null
  ratingCount?: number | null
  updatedAt?: string | null
}

export type RawSpaceListResponse = {
  success: boolean
  data: RawSpaceRecord[]
  pagination?: Pagination
}

export type RawSpaceDetailResponse = {
  success: boolean
  data: RawSpaceRecord
}
