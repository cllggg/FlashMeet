/**
 * 用户档案与活动级签到快照（持久化）
 * - 设备 token 之外，补充"用户已经填过的信息"和"每场活动的签到"
 * - 四层存储形成完整闭环：
 *   1) flashmeet_device_token         → 设备身份（前端 UUID）
 *   2) flashmeet_user_token           → 服务端签发的稳定身份
 *   3) flashmeet_user_profile         → 跨活动共享的用户档案
 *   4) flashmeet_event_{event_id}     → 单场活动的签到快照
 *   + 备份键：flashmeet_user_token_bk → user_token 备份（防单点失效）
 *
 * 设计目标：
 * - 扫码静默召回：按 user_token > device_token > phone 优先级命中服务端
 * - 离线兜底：服务端不可用时，命中本地 event 缓存 → 也能"已签到"视图
 * - 跨活动预填：展示表单时预填昵称/手机号
 * - 微信 H5 可靠：user_token 同时写入主键 + 备份键，提升 localStorage 失效率容忍度
 */

const PROFILE_KEY = 'flashmeet_user_profile';
const LEGACY_KEY = 'flashmeet_user'; // 旧版扁平存储（过渡兼容）

// user_token 关键存储：主键 + 备份键（防止其中一个 key 被清空或冲突）
const USER_TOKEN_KEY = 'flashmeet_user_token';
const USER_TOKEN_BK_KEY = 'flashmeet_user_token_bk';

export interface UserProfile {
  user_id?: string;
  /** 服务端签发的稳定身份（最强召回 key） */
  user_token?: string;
  nickname?: string;
  phone?: string;
  avatar_url?: string;
  /** 跨活动默认 display_id（取自最近一次成功签到） */
  default_display_id?: string;
  updated_at?: number;
}

export interface EventCheckinSnapshot {
  event_id: string;
  user_id?: string;
  user_token?: string;
  display_id?: string;
  name?: string;
  checked_in_at?: number;
  is_repeat?: boolean;
}

function safeGet<T>(key: string): T | null {
  try {
    const raw = uni.getStorageSync(key);
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : (raw as T);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: any): void {
  try {
    uni.setStorageSync(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

function safeSetString(key: string, value: string): void {
  try {
    uni.setStorageSync(key, value);
  } catch {
    /* noop */
  }
}

function safeRemove(key: string): void {
  try {
    uni.removeStorageSync(key);
  } catch {
    /* noop */
  }
}

/* ---------- user_token (服务端签发身份) ---------- */

/**
 * 读取服务端 user_token（双键读：主键优先，备份键兜底）
 * - 任何键读到即返回
 * - 读到时会反向同步另一个键（自愈）
 */
export function loadUserToken(): string | null {
  try {
    const a = uni.getStorageSync(USER_TOKEN_KEY);
    const b = uni.getStorageSync(USER_TOKEN_BK_KEY);
    const aStr = typeof a === 'string' ? a : '';
    const bStr = typeof b === 'string' ? b : '';
    const token = aStr || bStr;
    if (!token) return null;
    if (aStr !== token && aStr === '') safeSetString(USER_TOKEN_KEY, token);
    if (bStr !== token && bStr === '') safeSetString(USER_TOKEN_BK_KEY, token);
    return token;
  } catch {
    return null;
  }
}

/**
 * 写入 user_token（双键冗余）
 * - 写入主键和备份键，两个 key 互为备份
 * - 微信 H5 偶发清缓存场景下，至少一个键能存活
 */
export function saveUserToken(token: string | null | undefined): void {
  if (!token || typeof token !== 'string') return;
  safeSetString(USER_TOKEN_KEY, token);
  safeSetString(USER_TOKEN_BK_KEY, token);
  // 同步到 profile（profile 自身也持久化）
  saveUserProfile({ user_token: token });
}

export function clearUserToken(): void {
  safeRemove(USER_TOKEN_KEY);
  safeRemove(USER_TOKEN_BK_KEY);
}

/* ---------- 用户档案 ---------- */

export function loadUserProfile(): UserProfile {
  const p = safeGet<UserProfile>(PROFILE_KEY);
  if (p) return p;
  // 兼容旧版 flashmeet_user
  const legacy = safeGet<any>(LEGACY_KEY);
  if (legacy?.nickname || legacy?.phone) {
    return {
      nickname: legacy.nickname,
      phone: legacy.phone,
      avatar_url: legacy.avatar_url,
      default_display_id: legacy.display_id,
    };
  }
  return {};
}

export function saveUserProfile(patch: Partial<UserProfile>): UserProfile {
  const cur = loadUserProfile();
  const next: UserProfile = {
    ...cur,
    ...patch,
    updated_at: Date.now(),
  };
  safeSet(PROFILE_KEY, next);
  // 旧版字段也同步一下（避免其他老页面拿不到）
  const legacy = {
    ...legacyRead(),
    nickname: next.nickname,
    phone: next.phone,
    avatar_url: next.avatar_url,
    display_id: next.default_display_id,
  };
  safeSet(LEGACY_KEY, legacy);
  // 如果 patch 携带了 user_token，双键冗余写一份
  if (patch.user_token) saveUserToken(patch.user_token);
  return next;
}

function legacyRead(): any {
  return safeGet<any>(LEGACY_KEY) || {};
}

/* ---------- 活动级签到快照 ---------- */

export function eventSnapshotKey(eventId: string): string {
  return `flashmeet_event_${eventId}`;
}

export function loadEventSnapshot(eventId: string): EventCheckinSnapshot | null {
  if (!eventId) return null;
  const snap = safeGet<EventCheckinSnapshot>(eventSnapshotKey(eventId));
  if (snap?.event_id === eventId) return snap;
  return null;
}

export function saveEventSnapshot(snap: EventCheckinSnapshot): void {
  if (!snap?.event_id) return;
  safeSet(eventSnapshotKey(snap.event_id), {
    ...snap,
    checked_in_at: snap.checked_in_at ?? Date.now(),
  });
}

export function clearEventSnapshot(eventId: string): void {
  if (!eventId) return;
  safeRemove(eventSnapshotKey(eventId));
}
