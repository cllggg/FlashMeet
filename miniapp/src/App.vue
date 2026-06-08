<script setup lang="ts">
import { onLaunch, onShow } from "@dcloudio/uni-app";
import NetBanner from "./components/NetBanner.vue";

/** 路由白名单（无需登录可访问） */
const WHITE_LIST = [
  "/pages/login/index",
  "/pages/index/index",
  // 签到流程：扫码后必须能直接进入，否则 token 还没拿到就被踢回 login，
  // 会导致大屏二维码扫了进不来。checkin 内部会自动签发 user_token 并写回本地。
  "/pages/live/index",
];

const isWhiteListed = (route: string) => {
  return WHITE_LIST.some((p) => route.startsWith(p));
};

const getCurrentRoute = (): string => {
  try {
    const pages = getCurrentPages() as any[];
    const last = pages[pages.length - 1];
    return last ? `/${last.route}` : '';
  } catch {
    return '';
  }
};

const checkAuth = () => {
  const token = uni.getStorageSync('flashmeet_token');
  const current = getCurrentRoute();
  if (!token && current && !isWhiteListed(current)) {
    uni.reLaunch({ url: '/pages/login/index' });
  }
};

onLaunch(() => {
  console.log("FlashMeet MiniApp Launch");
  // 把系统状态栏高度写入全局 CSS 变量，供 NetBanner 等 fixed 顶部组件避开
  try {
    const sys: any = (uni as any).getSystemInfoSync?.();
    const sbh = sys?.statusBarHeight ?? 20;
    // #ifdef MP-WEIXIN
    document?.documentElement?.style?.setProperty('--status-bar-height', `${sbh}px`);
    // #endif
    // 写到一个全局对象上，供 sass/css 引用
    (window as any).__STATUS_BAR_HEIGHT__ = sbh;
  } catch {}
  checkAuth();
});

onShow(() => {
  // 每次回到前台都做一次鉴权
  checkAuth();
});
</script>

<template>
  <NetBanner />
</template>

<style>
/* 全局基础样式：默认深色主题 + 字体 + 数字等宽 */
/* 注意：@import 必须放在所有其他规则之前 */
@import url('./styles/design-tokens.css');

page {
  --status-bar-height: 20px;
  background-color: #0a0a2e;
  color: #ffffff;
  font-family: 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont,
    'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 通用数字字符等宽，避免倒计时/分数抖动 */
text {
  font-variant-numeric: tabular-nums;
}
</style>

