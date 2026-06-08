import { randomBytes } from 'crypto';

/**
 * 服务端签发的稳定身份 Token
 * - 48 字节随机 → base64url 编码（64 字符）
 * - 不可逆：不携带任何用户信息，纯随机
 * - 一经签发永不轮换（用户召回的根）
 */
export function generateUserToken(): string {
  // 32 字节足够安全（256 bit 熵），base64url 编码后约 43 字符
  return randomBytes(32)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
