/**
 * 极简 i18n 工具（小程序端）
 *
 * 特性：
 *  - 零依赖：纯函数 + localStorage 持久化语言偏好
 *  - 默认 zh-CN，可切到 en-US
 *  - 支持占位符插值：`t('hello', { name: '阿明' })`
 *  - 支持链式 key 降级：找不到翻译时回退到 key 字符串（开发期易发现）
 *
 * 用法：
 *   import { t, setLocale, getLocale, onLocaleChange } from '@/utils/i18n';
 *   t('lottery.draw');                       // → "抽取"
 *   t('lottery.winnerTitle', { name: '阿明' }); // → "恭喜 阿明"
 *
 * 局限：与 Vue 模板没有深度集成（需要响应式可用 reactive locale）
 * 进阶方案：可改为 composition API 的 useI18n()，集中维护 ref<locale>
 */
import { ref, watch } from 'vue';

export type Locale = 'zh-CN' | 'en-US';

const STORAGE_KEY = 'fm_locale';
const DEFAULT_LOCALE: Locale = 'zh-CN';

const translations: Record<Locale, Record<string, string>> = {
  'zh-CN': {
    // 通用
    'common.confirm': '确认',
    'common.cancel': '取消',
    'common.retry': '重试',
    'common.copy': '复制',
    'common.close': '关闭',
    'common.know': '知道啦',
    'common.networkError': '网络出错，请检查后重试',

    // 登录
    'login.title': '登录',
    'login.wechat': '微信一键登录',
    'login.guest': '游客模式',
    'login.phone': '手机号登录',
    'login.code': '验证码',
    'login.sendCode': '发送验证码',
    'login.submit': '登录',
    'login.processing': '登录中...',

    // 签到
    'checkin.title': '签到',
    'checkin.name': '昵称',
    'checkin.namePlaceholder': '请输入您的昵称',
    'checkin.submit': '完成签到',
    'checkin.success': '签到成功！',
    'checkin.tip': '本场您的身份标识：{displayId}',

    // 破冰
    'icebreaker.title': '选一个属于你的标签',
    'icebreaker.submit': '提交',
    'icebreaker.submitted': '已提交，等待大屏展示',
    'icebreaker.lit': '你已被点亮在大屏上',

    // 抽奖（用户端）
    'lottery.noPool': '暂未开始',
    'lottery.prize': '奖品',
    'lottery.lotteryWin': '恭喜您中奖',
    'lottery.checkResult': '查看中奖名单',

    // 抽奖管理（主持端）
    'host.lottery.create': '创建奖池',
    'host.lottery.draw': '抽取',
    'host.lottery.drawing': '抽取中…',
    'host.lottery.drawDone': '已抽完',
    'host.lottery.drawOne': '抽取 1 名',
    'host.lottery.drawFive': '一次性连抽 5 名',
    'host.lottery.drawTen': '一次性连抽 10 名',
    'host.lottery.prepick': '🎯 内顶',
    'host.lottery.prepicked': '🎯 已选 {n}',
    'host.lottery.winnerTitle': '恭喜 {name}',
    'host.lottery.winnerTitlePre': '🎯 内定 · 恭喜 {name}',
    'host.lottery.winnerTitleBig': '🌟 大奖 · 恭喜 {name}',
    'host.lottery.winnerTitlePreBig': '🎯 内定 · 🌟 大奖 · 恭喜 {name}',
    'host.lottery.exportCsv': '导出 CSV',
    'host.lottery.exporting': '导出中…',
    'host.lottery.batchTitle': '🎉 一次性连中 {n} 名',

    // Shake
    'shake.title': '摇一摇',
    'shake.tip': '疯狂摇动手机',
    'shake.start': '开始',
    'shake.end': '结束',
    'shake.leaderboard': '排行榜',

    // 错误
    'error.network': '网络异常，请稍后再试',
    'error.timeout': '请求超时，请重试',
    'error.unauthorized': '未登录或登录已过期',
    'error.forbidden': '没有权限',
    'error.notFound': '资源不存在',
    'error.serverError': '服务器开了小差，请稍后重试',
  },
  'en-US': {
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',
    'common.retry': 'Retry',
    'common.copy': 'Copy',
    'common.close': 'Close',
    'common.know': 'Got it',
    'common.networkError': 'Network error. Please retry.',

    'login.title': 'Sign in',
    'login.wechat': 'Continue with WeChat',
    'login.guest': 'Continue as guest',
    'login.phone': 'Phone number',
    'login.code': 'Verification code',
    'login.sendCode': 'Send code',
    'login.submit': 'Sign in',
    'login.processing': 'Signing in...',

    'checkin.title': 'Check in',
    'checkin.name': 'Nickname',
    'checkin.namePlaceholder': 'Your nickname',
    'checkin.submit': 'Check in',
    'checkin.success': 'Check-in successful!',
    'checkin.tip': 'Your ID for this event: {displayId}',

    'icebreaker.title': 'Pick a tag that fits you',
    'icebreaker.submit': 'Submit',
    'icebreaker.submitted': 'Submitted, waiting for the big screen',
    'icebreaker.lit': 'You are lit on the big screen',

    'lottery.noPool': 'Not started yet',
    'lottery.prize': 'Prize',
    'lottery.lotteryWin': 'You won!',
    'lottery.checkResult': 'View winners',

    'host.lottery.create': 'Create prize pool',
    'host.lottery.draw': 'Draw',
    'host.lottery.drawing': 'Drawing…',
    'host.lottery.drawDone': 'Completed',
    'host.lottery.drawOne': 'Draw 1',
    'host.lottery.drawFive': 'Draw 5',
    'host.lottery.drawTen': 'Draw 10',
    'host.lottery.prepick': '🎯 Pre-pick',
    'host.lottery.prepicked': '🎯 {n} picked',
    'host.lottery.winnerTitle': 'Congrats {name}',
    'host.lottery.winnerTitlePre': '🎯 Pre-pick · Congrats {name}',
    'host.lottery.winnerTitleBig': '🌟 Big · Congrats {name}',
    'host.lottery.winnerTitlePreBig': '🎯 Pre-pick · 🌟 Big · Congrats {name}',
    'host.lottery.exportCsv': 'Export CSV',
    'host.lottery.exporting': 'Exporting…',
    'host.lottery.batchTitle': '🎉 {n} winners at once',

    'shake.title': 'Shake',
    'shake.tip': 'Shake your phone hard',
    'shake.start': 'Start',
    'shake.end': 'End',
    'shake.leaderboard': 'Leaderboard',

    'error.network': 'Network error. Please try again.',
    'error.timeout': 'Request timeout. Please retry.',
    'error.unauthorized': 'Not signed in or session expired',
    'error.forbidden': 'Permission denied',
    'error.notFound': 'Not found',
    'error.serverError': 'Server error. Please retry later.',
  },
};

// 响应式 locale（供组件用 computed/watch 订阅）
const _locale = ref<Locale>(loadStoredLocale());

function loadStoredLocale(): Locale {
  try {
    const v = uni.getStorageSync(STORAGE_KEY) as Locale;
    if (v === 'zh-CN' || v === 'en-US') return v;
  } catch {
    // localStorage / 同步 API 失败时降级
  }
  return DEFAULT_LOCALE;
}

export function getLocale(): Locale {
  return _locale.value;
}

export function setLocale(loc: Locale) {
  _locale.value = loc;
  try {
    uni.setStorageSync(STORAGE_KEY, loc);
  } catch {
    // ignore
  }
}

/** 监听语言变化（用于在语言切换时刷新 UI） */
export function onLocaleChange(fn: (loc: Locale) => void) {
  return watch(_locale, (v) => fn(v));
}

/**
 * 翻译函数
 * @param key  例如 'host.lottery.winnerTitle'
 * @param vars 插值占位符 { name: '阿明' }
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  const dict = translations[_locale.value] || translations[DEFAULT_LOCALE];
  let s = dict[key];
  if (s == null) {
    // 回退：尝试英文，最后回退到 key
    s = translations['en-US'][key] ?? key;
  }
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return s;
}

/** 暴露响应式 locale，组件可用 useI18n() 取 */
export function useI18n() {
  return {
    locale: _locale,
    t,
    setLocale,
  };
}
