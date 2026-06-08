/**
 * 设备级稳定身份 (Device Token)
 * - 首次启动时生成 UUID v4，写入本地存储，永久不变
 * - 用于"扫码签到再次直接进入"的召回机制
 * - 后端通过 X-Device-Token 接收，绑定到 GlobalUser.device_id
 * - 用户清除浏览器/小程序缓存后才会重置（符合预期）
 */

const STORAGE_KEY = 'flashmeet_device_token';

/** 生成 RFC4122 v4 风格 UUID */
function generateUuidV4(): string {
  // 优先尝试使用加密 API；不可用则回退到 Math.random
  let cryptoObj: Crypto | undefined;
  try {
    cryptoObj = typeof crypto !== 'undefined' ? crypto : undefined;
  } catch {
    cryptoObj = undefined;
  }

  if (cryptoObj?.randomUUID) {
    try {
      return cryptoObj.randomUUID();
    } catch {
      /* fallthrough */
    }
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** 获取/创建当前设备的稳定 token */
export function getDeviceToken(): string {
  try {
    let token = uni.getStorageSync(STORAGE_KEY);
    if (!token || typeof token !== 'string') {
      token = generateUuidV4();
      uni.setStorageSync(STORAGE_KEY, token);
    }
    return token;
  } catch {
    // 存储不可用时仍返回内存中的 token，保证请求可带 header
    return generateUuidV4();
  }
}

/** 调试用：清空当前设备的 token（下次访问将视为新设备） */
export function resetDeviceToken(): void {
  try {
    uni.removeStorageSync(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
