/**
 * display_id 生成与校验
 *
 * 形式：{name}#{4位数字}，例如 "阿明#7392"
 *
 * 用于：
 *  - 大屏暗星短标识（CheckinScene）
 *  - 用户端"我被点亮在屏幕哪个位置"的身份锚点
 *
 * 关键点：
 *  - 同一 event_id 内唯一（服务端校验，本工具生成时先在本地去重候选）
 *  - 名称截前 4 个字符
 *  - 4 位数字从 0000-9999
 */
const DIGIT_LEN = 4;

function sanitizeName(name?: string): string {
  const fallback = 'Star';
  if (!name) return fallback;
  const cleaned = name.trim().replace(/[\s#]+/g, '');
  if (!cleaned) return fallback;
  const sliced = Array.from(cleaned).slice(0, 4).join('');
  return sliced || fallback;
}

function genOne(name?: string): string {
  const n = sanitizeName(name);
  const digits = Math.floor(Math.random() * 10_000)
    .toString()
    .padStart(DIGIT_LEN, '0');
  return `${n}#${digits}`;
}

/**
 * 生成一个不与"已存在集合"重复的 display_id
 * @param name 用户名（可能为 undefined）
 * @param existing 该 event 内已存在的 display_id 集合（Set / string[]）
 */
export function generateDisplayId(
  name: string | undefined,
  existing: ReadonlySet<string> | readonly string[] = [],
): string {
  const taken = existing instanceof Set ? existing : new Set(existing);
  for (let i = 0; i < 5; i++) {
    const candidate = genOne(name);
    if (!taken.has(candidate)) return candidate;
  }
  // 极端降级：用时间戳
  const ts = (Date.now() % 10_000).toString().padStart(DIGIT_LEN, '0');
  return `${sanitizeName(name)}#${ts}`;
}

/** 校验 display_id 形式合法 */
export function isValidDisplayId(id: string | undefined | null): boolean {
  if (!id || id.length > 32) return false;
  const idx = id.indexOf('#');
  if (idx < 1 || idx > 16) return false;
  return /^\d{4}$/.test(id.slice(idx + 1));
}
