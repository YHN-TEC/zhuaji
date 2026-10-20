import type { CareEvent, Comment, DB, Pet, Post, Reminder, Visibility } from '../types'
import { createEmptyDB, createSeed } from '../data/seed'
import { addDays, todayISO } from './format'

const DB_KEY = 'zhuaji.db.v1'
const AUTH_KEY = 'zhuaji.auth.v1'

export type AuthMode = 'demo' | 'new'
export interface AuthState {
  loggedIn: boolean
  mode: AuthMode
}

export interface Snapshot {
  db: DB | null
  auth: AuthState
  loading: boolean
  error: string | null
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`

export type NewEventInput = {
  petId: string
  type: CareEvent['type']
  date: string
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
  title?: string
}

/**
 * 集中式数据访问层：目前基于 localStorage 模拟后端，
 * 后续替换为真实接口时，只需要改动这个文件里的实现，页面无需修改。
 */
class Api {
  private db: DB | null = null
  private auth: AuthState = { loggedIn: false, mode: 'demo' }
  private loading = true
  private error: string | null = null
  private listeners = new Set<() => void>()
  private snapshot: Snapshot = { db: null, auth: this.auth, loading: true, error: null }

  private emit() {
    this.snapshot = { db: this.db, auth: this.auth, loading: this.loading, error: this.error }
    this.listeners.forEach((l) => l())
  }

  subscribe = (l: () => void) => {
    this.listeners.add(l)
    return () => this.listeners.delete(l)
  }

  getSnapshot = () => this.snapshot

  private persist() {
    if (this.db) localStorage.setItem(DB_KEY, JSON.stringify(this.db))
    localStorage.setItem(AUTH_KEY, JSON.stringify(this.auth))
  }

  async bootstrap() {
    this.loading = true
    this.error = null
    this.emit()
    await wait(420)
    try {
      const rawAuth = localStorage.getItem(AUTH_KEY)
      const rawDb = localStorage.getItem(DB_KEY)
      this.auth = rawAuth ? (JSON.parse(rawAuth) as AuthState) : { loggedIn: false, mode: 'demo' }
      if (rawDb) {
        this.db = JSON.parse(rawDb) as DB
      } else {
        this.db = this.auth.mode === 'new' ? createEmptyDB() : createSeed()
      }
      if (!this.db.activePetId && this.db.pets[0]) this.db.activePetId = this.db.pets[0].id
      this.loading = false
    } catch {
      this.error = '本地数据读取失败，已为你重新载入示例数据。'
      this.db = createSeed()
      this.loading = false
    }
    this.emit()
  }

  async login(mode: AuthMode, _phone?: string, _code?: string) {
    await wait(500)
    this.auth = { loggedIn: true, mode }
    const raw = localStorage.getItem(DB_KEY)
    const existing = raw ? (JSON.parse(raw) as DB) : null
    if (existing && mode === 'demo') {
      this.db = existing
    } else if (mode === 'new') {
      this.db = createEmptyDB()
    } else {
      this.db = createSeed()
    }
    this.persist()
    this.emit()
  }

  async logout() {
    await wait(200)
    this.auth = { loggedIn: false, mode: this.auth.mode }
    this.persist()
    this.emit()
  }

  async resetDemo() {
    await wait(300)
    this.db = createSeed()
    this.auth = { loggedIn: true, mode: 'demo' }
    this.persist()
    this.emit()
  }

  private need(): DB {
    if (!this.db) throw new Error('数据尚未加载')
    return this.db
  }

  private commit() {
    this.persist()
    this.emit()
  }

  get pet() {
    const db = this.need()
    return db.pets.find((p) => p.id === db.activePetId) ?? db.pets[0] ?? null
  }

  async createPet(input: Partial<Pet> & { name: string; species: Pet['species'] }): Promise<Pet> {
    await wait(420)
    const db = this.need()
    const pet: Pet = {
      id: uid('pet'),
      name: input.name.trim(),
      species: input.species,
      breed: input.breed?.trim() || undefined,
      dateType: input.dateType ?? 'birthday',
      date: input.date || undefined,
      avatar: input.avatar || (input.species === 'cat' ? 'img/avatar-cat.svg' : 'img/avatar-dog.svg'),
      neutered: input.neutered ?? 'unknown',
      allergies: input.allergies?.trim() || undefined,
      hospital: input.hospital?.trim() || undefined,
      emergencyContact: input.emergencyContact?.trim() || undefined,
      note: input.note?.trim() || undefined,
      createdAt: todayISO(),
    }
    db.pets.push(pet)
    db.members.push({ id: uid('pm'), petId: pet.id, name: db.user.nickname, role: 'owner', avatar: db.user.avatar })
    db.activePetId = pet.id
    this.commit()
    return pet
  }

  async updatePet(id: string, patch: Partial<Pet>) {
    await wait(260)
    const db = this.need()
    db.pets = db.pets.map((p) => (p.id === id ? { ...p, ...patch } : p))
    this.commit()
  }

  async setActivePet(id: string) {
    const db = this.need()
    db.activePetId = id
    this.commit()
  }

  async addEvent(input: NewEventInput): Promise<{ event: CareEvent; prevWeight?: number; delta?: number }> {
    await wait(420)
    const db = this.need()
    const prev = db.events
      .filter((e) => e.petId === input.petId && e.type === 'weight' && e.weight !== undefined)
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0]
    const titles: Record<CareEvent['type'], string> = {
      weight: '体重记录',
      vaccine: input.vaccineName || '疫苗接种',
      deworm: input.dewormKind === 'inner' ? '体内驱虫' : input.dewormKind === 'outer' ? '体外驱虫' : '体内外驱虫',
      visit: input.reason ? `就诊 · ${input.reason.slice(0, 12)}` : '就诊记录',
      photo: input.title || '照片记录',
      daily: input.title || '日常记录',
    }
    const event: CareEvent = {
      id: uid('ev'),
      petId: input.petId,
      type: input.type,
      date: input.date,
      createdAt: new Date().toISOString(),
      title: input.title || titles[input.type],
      weight: input.weight,
      vaccineName: input.vaccineName,
      hospital: input.hospital,
      dewormKind: input.dewormKind,
      medicine: input.medicine,
      reason: input.reason,
      diagnosis: input.diagnosis,
      cost: input.cost,
      note: input.note,
      photo: input.photo,
    }
    db.events.push(event)
    // 体重提醒：记录后自动把「本周体重记录」标记完成
    if (input.type === 'weight') {
      db.reminders = db.reminders.map((r) =>
        r.petId === input.petId && r.kind === 'weight' && !r.done ? { ...r, done: true } : r,
      )
    }
    this.commit()
    return {
      event,
      prevWeight: prev?.weight,
      delta: input.weight !== undefined && prev?.weight !== undefined ? input.weight - prev.weight : undefined,
    }
  }

  async deleteEvent(id: string) {
    await wait(220)
    const db = this.need()
    db.events = db.events.filter((e) => e.id !== id)
    db.posts = db.posts.filter((p) => p.fromEventId !== id || !p.mine)
    this.commit()
  }

  async addReminder(input: { petId: string; kind: Reminder['kind']; title: string; dueDate: string; sourceEventId?: string }) {
    await wait(260)
    const db = this.need()
    const r: Reminder = { id: uid('rm'), done: false, ...input }
    db.reminders.push(r)
    this.commit()
    return r
  }

  async completeReminder(id: string) {
    await wait(200)
    const db = this.need()
    db.reminders = db.reminders.map((r) => (r.id === id ? { ...r, done: true } : r))
    this.commit()
  }

  async snoozeReminder(id: string, days = 3) {
    await wait(200)
    const db = this.need()
    db.reminders = db.reminders.map((r) => (r.id === id ? { ...r, dueDate: addDays(todayISO(), days) } : r))
    this.commit()
  }

  async deleteReminder(id: string) {
    await wait(160)
    const db = this.need()
    db.reminders = db.reminders.filter((r) => r.id !== id)
    this.commit()
  }

  async createPost(input: {
    content: string
    images: string[]
    visibility: Visibility
    kind?: Post['kind']
    fromEventId?: string
    tags?: string[]
    medical?: boolean
  }): Promise<Post> {
    await wait(520)
    const db = this.need()
    const pet = db.pets.find((p) => p.id === db.activePetId)
    const post: Post = {
      id: uid('post'),
      kind: input.kind ?? 'share',
      authorName: db.user.nickname,
      authorAvatar: db.user.avatar,
      petName: pet?.name,
      city: db.user.city,
      district: db.user.district,
      content: input.content,
      images: input.images,
      tags: input.tags ?? [],
      likes: 0,
      liked: false,
      comments: [],
      createdAt: new Date().toISOString(),
      fromEventId: input.fromEventId,
      medical: input.medical,
      visibility: input.visibility,
      mine: true,
    }
    db.posts.unshift(post)
    if (input.fromEventId) {
      db.events = db.events.map((e) => (e.id === input.fromEventId ? { ...e, sharedPostId: post.id } : e))
    }
    this.commit()
    return post
  }

  async likePost(id: string) {
    const db = this.need()
    db.posts = db.posts.map((p) =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p,
    )
    this.commit()
  }

  async addComment(postId: string, content: string) {
    await wait(280)
    const db = this.need()
    const comment: Comment = {
      id: uid('cm'),
      authorName: db.user.nickname,
      authorAvatar: db.user.avatar,
      city: `${db.user.city} · ${db.user.district}`,
      content,
      createdAt: new Date().toISOString(),
      isOwner: true,
    }
    db.posts = db.posts.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, comment] } : p))
    this.commit()
    return comment
  }

  async joinGroup(id: string) {
    const db = this.need()
    db.groups = db.groups.map((g) => (g.id === id ? { ...g, joined: !g.joined, members: g.members + (g.joined ? -1 : 1) } : g))
    this.commit()
  }

  async joinActivity(id: string) {
    const db = this.need()
    db.activities = db.activities.map((a) =>
      a.id === id ? { ...a, joined: !a.joined, participants: a.participants + (a.joined ? -1 : 1) } : a,
    )
    this.commit()
  }

  async updateSettings(patch: Partial<DB['user']>) {
    await wait(200)
    const db = this.need()
    db.user = { ...db.user, ...patch }
    this.commit()
  }

  async markLocationNoticeSeen() {
    const db = this.need()
    db.seenLocationNotice = true
    this.commit()
  }

  async blockUser(name: string) {
    await wait(200)
    const db = this.need()
    if (!db.blocked.some((b) => b.name === name)) db.blocked.push({ id: uid('bk'), name })
    db.posts = db.posts.filter((p) => p.authorName !== name || p.mine)
    this.commit()
  }

  async unblockUser(id: string) {
    const db = this.need()
    db.blocked = db.blocked.filter((b) => b.id !== id)
    this.commit()
  }

  async reportPost(postId: string, reason: string) {
    await wait(320)
    const db = this.need()
    db.posts = db.posts.map((p) => (p.id === postId ? { ...p, visibility: 'private' } : p))
    this.commit()
    return reason
  }

  exportSummary(petId: string, days = 180): string {
    const db = this.need()
    const pet = db.pets.find((p) => p.id === petId)
    if (!pet) throw new Error('宠物档案不存在')
    const since = addDays(todayISO(), -days)
    const list = db.events
      .filter((e) => e.petId === petId && e.date >= since)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
    if (list.length === 0) throw new Error('该时间段内还没有健康记录，暂时无法生成摘要')
    const weights = list.filter((e) => e.type === 'weight' && e.weight).sort((a, b) => (a.date < b.date ? -1 : 1))
    const head = [
      `【爪迹】${pet.name} 健康档案摘要`,
      `宠物：${pet.name} · ${pet.breed ?? (pet.species === 'cat' ? '猫' : '狗')} · ${pet.dateType === 'birthday' ? '生日' : '到家日'} ${pet.date ?? '未填写'}`,
      `统计区间：${since} 至 ${todayISO()}（近 ${days} 天，共 ${list.length} 条记录）`,
      `过敏信息：${pet.allergies ?? '未填写'}　常去医院：${pet.hospital ?? '未填写'}`,
    ]
    const w = weights.length
      ? `体重：最新 ${weights[weights.length - 1].weight!.toFixed(1)} kg（${weights[weights.length - 1].date}），区间 ${weights[0].weight!.toFixed(1)} → ${weights[weights.length - 1].weight!.toFixed(1)} kg`
      : '体重：区间内无记录'
    const body = list.map((e) => {
      const detail = [
        e.weight ? `${e.weight.toFixed(1)} kg` : '',
        e.vaccineName ?? '',
        e.medicine ?? '',
        e.hospital ?? '',
        e.diagnosis ?? '',
        e.note ?? '',
      ]
        .filter(Boolean)
        .join('；')
      return `· ${e.date} ${e.title}${detail ? `：${detail}` : ''}`
    })
    return [
      ...head,
      w,
      '',
      '记录明细：',
      ...body,
      '',
      '说明：以上内容由主人自行记录，仅供就诊沟通参考，不构成诊断结论。',
    ].join('\n')
  }

  async wipeAll() {
    await wait(400)
    this.db = createEmptyDB()
    this.auth = { loggedIn: false, mode: 'new' }
    localStorage.removeItem(DB_KEY)
    this.persist()
    this.emit()
  }
}

export const api = new Api()
