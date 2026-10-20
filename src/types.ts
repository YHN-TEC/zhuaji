/** 爪迹 · 领域模型
 *  统一用 CareEvent + type 字段承载健康记录，避免每种记录独立建模。
 */

export type Species = 'cat' | 'dog'
export type CareEventType = 'weight' | 'vaccine' | 'deworm' | 'visit' | 'photo' | 'daily'
export type ReminderKind = 'vaccine' | 'deworm' | 'weight' | 'visit'
export type Visibility = 'private' | 'local' | 'followers'

export interface User {
  id: string
  nickname: string
  phone: string
  city: string
  district: string
  avatar: string
  dmEnabled: boolean
  profilePublic: boolean
  createdAt: string
}

export interface PetMember {
  id: string
  petId: string
  name: string
  role: 'owner' | 'family'
  avatar: string
}

export interface Pet {
  id: string
  name: string
  species: Species
  breed?: string
  /** birthday 用生日；gotcha 用到家日 */
  dateType: 'birthday' | 'gotcha'
  date?: string
  avatar: string
  neutered?: 'yes' | 'no' | 'unknown'
  allergies?: string
  hospital?: string
  emergencyContact?: string
  note?: string
  createdAt: string
}

export interface CareEvent {
  id: string
  petId: string
  type: CareEventType
  date: string
  createdAt: string
  title: string
  weight?: number
  vaccineName?: string
  hospital?: string
  dewormKind?: 'inner' | 'outer' | 'both'
  medicine?: string
  reason?: string
  diagnosis?: string
  cost?: number
  note?: string
  photo?: string
  /** 来源记录被分享过 */
  sharedPostId?: string
}

export interface Reminder {
  id: string
  petId: string
  kind: ReminderKind
  title: string
  dueDate: string
  done: boolean
  sourceEventId?: string
}

export interface Comment {
  id: string
  authorName: string
  authorAvatar: string
  city: string
  content: string
  createdAt: string
  isOwner?: boolean
}

export interface Post {
  id: string
  kind: 'share' | 'question' | 'moment'
  authorName: string
  authorAvatar: string
  petName?: string
  city: string
  district: string
  content: string
  images: string[]
  tags: string[]
  likes: number
  liked: boolean
  comments: Comment[]
  createdAt: string
  fromEventId?: string
  /** 医疗经验类内容强制免责声明 */
  medical?: boolean
  visibility: Visibility
  mine?: boolean
}

export interface BreedGroup {
  id: string
  name: string
  species: Species
  members: number
  intro: string
  joined: boolean
}

export interface Activity {
  id: string
  title: string
  city: string
  district: string
  date: string
  place: string
  cover: string
  participants: number
  joined: boolean
  desc: string
}

export interface BlockedUser {
  id: string
  name: string
}

export interface DB {
  user: User
  pets: Pet[]
  members: PetMember[]
  events: CareEvent[]
  reminders: Reminder[]
  posts: Post[]
  groups: BreedGroup[]
  activities: Activity[]
  blocked: BlockedUser[]
  activePetId: string | null
  seenLocationNotice: boolean
  schemaVersion: number
}
