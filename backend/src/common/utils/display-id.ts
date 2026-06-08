/**
 * display_id 生成与冲突解决
 *
 * 形式：{name}#{4位数字}
 * 示例："阿明#7392" / "Alex#0581"
 *
 * 用途：
 *  - 大屏 CheckinScene 的暗星短标识
 *  - 用户端"我被点亮在屏幕哪个位置"的身份锚点
 *  - 星系标签：破冰作答、中奖推送时携带
 *
 * 设计：
 *  - 同一 event_id 内唯一
 *  - 名称部分只保留 1-4 个字符（兼容中英文）
 *  - 4 位数字从 0000-9999 随机，最多 10000 名/活动
 *  - 冲突时仅在数字部分滚动，最多重试 5 次
 */
const DIGIT_LEN = 4;
const MAX_RETRY = 5;

/** 把 name 截断/清洗成可拼接片段 */
function sanitizeName(name?: string): string {
  const fallback = 'Star';
  if (!name) return fallback;
  // 去掉首尾空白，再去掉特殊符号
  const cleaned = name.trim().replace(/[\s#]+/g, '');
  if (!cleaned) return fallback;
  // 截前 4 个字符（中英文都按字符算）
  const sliced = Array.from(cleaned).slice(0, 4).join('');
  return sliced || fallback;
}

/** 生成单个候选 display_id */
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
 * @param existing 该 event 内已存在的 display_id 集合
 * @returns 不冲突的 display_id；超出重试则降级为时间戳后缀
 */
export function generateDisplayId(
  name: string | undefined,
  existing: ReadonlySet<string>,
): string {
  for (let i = 0; i < MAX_RETRY; i++) {
    const candidate = genOne(name);
    if (!existing.has(candidate)) return candidate;
  }
  // 极小概率（>10000 同名）降级
  const ts = Date.now() % 10_000;
  const n = sanitizeName(name);
  return `${n}#${ts.toString().padStart(DIGIT_LEN, '0')}`;
}

/** 校验 display_id 形式合法（仅做轻校验，权威校验在 DTO） */
export function isValidDisplayIdFormat(id: string | undefined | null): boolean {
  if (!id) return false;
  if (id.length > 32) return false;
  // 必须包含 # 且 # 后是 4 位数字
  const idx = id.indexOf('#');
  if (idx < 1 || idx > 16) return false;
  const tail = id.slice(idx + 1);
  return /^\d{4}$/.test(tail);
}
