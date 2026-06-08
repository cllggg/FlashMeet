<template>
  <view class="checkin-page">
    <!-- 未签到态 -->
    <view class="scan-area" v-if="!checkedIn && !showManualInput">
      <view class="brand">
        <view class="brand-logo">
          <text class="brand-icon">✨</text>
        </view>
        <text class="title">扫码签到</text>
      </view>
      <text class="desc">扫描大屏二维码，1秒上墙</text>

      <view class="scan-actions">
        <button class="scan-btn primary" @tap="scanQRCode" hover-class="none">
          扫描二维码
        </button>
        <button class="scan-btn ghost" @tap="mockCheckin" hover-class="none">
          MVP 模拟签到
        </button>
      </view>

      <text class="scan-hint" v-if="lastEventId">
        上次扫码：{{ lastEventId }} · 直接点上方按钮再次进入
      </text>
    </view>

    <!-- 手动输入 / 表单 -->
    <view class="event-input" v-if="showManualInput && !checkedIn">
      <view class="form-header">
        <text class="form-title">{{ formTitle }}</text>
        <text class="form-desc" v-if="formDesc">{{ formDesc }}</text>
      </view>

      <input
        class="input"
        v-model="eventId"
        placeholder="活动ID"
        :disabled="eventIdLocked"
        placeholder-style="color: rgba(255,255,255,0.3)"
      />
      <input
        class="input"
        v-model="userName"
        placeholder="你的名字 (用于大屏显示)"
        placeholder-style="color: rgba(255,255,255,0.3)"
        maxlength="16"
      />
      <input
        class="input"
        v-model="userPhone"
        placeholder="手机号 (跨活动快速签到，可选)"
        placeholder-style="color: rgba(255,255,255,0.3)"
        type="number"
        maxlength="11"
      />

      <view class="recognition-tag" v-if="recognizeHint">
        <text class="recognition-icon">⚡</text>
        <text class="recognition-text">{{ recognizeHint }}</text>
      </view>

      <view class="recall-fallback" v-if="!recognizeHint">
        <text class="recall-fallback-text">
          💡 填入手机号可永久记住你的身份，再次扫码直接进入
        </text>
      </view>

      <button
        class="submit-btn"
        @tap="doCheckin"
        :loading="checkingIn"
        :disabled="!eventId || !userName.trim()"
        hover-class="none"
      >
        {{ checkingIn ? '签到中…' : '立即签到' }}
      </button>

      <view class="back-to-scan" @tap="goBackScan">
        <text class="back-to-scan-text">← 返回扫码</text>
      </view>
    </view>

    <!-- 签到成功 -->
    <view class="checked-in" v-if="checkedIn">
      <view v-if="isRepeatCheckin" class="welcome-back">
        <text class="welcome-back-icon">👋</text>
        <text class="welcome-back-text">欢迎回来，{{ checkedInName }}</text>
      </view>

      <view class="order-badge">
        <text class="order-suffix">你是第</text>
        <text class="order-num">{{ checkinOrder }}</text>
        <text class="order-label">位</text>
      </view>

      <view class="success-icon-wrap">
        <view class="success-icon">✅</view>
        <view class="success-pulse" />
      </view>
      <text class="success-text">签到成功！</text>
      <text class="event-title" v-if="eventTitle">{{ eventTitle }}</text>

      <!-- 微信 H5 持久化提示：让用户主动保存，提升下次召回率 -->
      <view class="save-tip" v-if="isWechatH5">
        <text class="save-tip-icon">💡</text>
        <text class="save-tip-text">
          建议收藏此页面或加入桌面，下次扫码可一键进入
        </text>
        <view class="save-tip-actions">
          <text class="save-tip-link" @tap="copyCurrentLink">复制链接</text>
        </view>
      </view>

      <view class="display-id-card">
        <Avatar
          class="display-id-avatar"
          :name="checkedInName"
          :tier="checkinOrder <= 3 ? 'big' : 'normal'"
          size="lg"
        />
        <view class="display-id-meta">
          <text class="display-id-label">大屏上的你</text>
          <text class="display-id-value">{{ checkedInDisplayId }}</text>
        </view>
        <view v-if="checkinOrder <= 3" class="display-id-tag">
          <text>🚀 早鸟</text>
        </view>
      </view>

      <view class="welcome-msg">
        <text class="welcome-text">{{ welcomeMessage }}</text>
      </view>

      <text class="hint">主持人发起互动时，你的小行星会被点亮 ✨</text>

      <view class="next-steps">
        <StepList
          title="接下来 · 流程提示"
          :steps="[
            { label: '等待主持人开启破冰环节', hint: '大屏将展示趣味问题，4 选 1 即可', icon: '💬', tone: 'primary' },
            { label: '关注大屏，参与互动', hint: '摇一摇 / 匹配 / 抽奖陆续登场', icon: '🎮', tone: 'cyan' },
            { label: '抽奖环节，试试你的运气', hint: '提前到「我的画像」积累好人品', icon: '🎁', tone: 'gold' },
          ]"
        />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { checkinApi, eventApi } from '../../services/api';
import { generateDisplayId } from '../../utils/display-id';
import { mapErrorToMessage } from '../../utils/error-message';
import {
  loadUserProfile,
  saveUserProfile,
  loadEventSnapshot,
  saveEventSnapshot,
  loadUserToken,
  saveUserToken,
} from '../../utils/user-storage';
import { socketService } from '../../services/socket';
import { EventStatus } from '../../services/ws-events';
import Avatar from '../../components/Avatar.vue';
import StepList from '../../components/StepList.vue';

const eventId = ref('');
const eventIdLocked = ref(false);
const userName = ref('');
const userPhone = ref('');
const checkedIn = ref(false);
const showManualInput = ref(false);
const checkedInDisplayId = ref('');
const checkedInName = ref('');
const checkinOrder = ref(0);
const eventTitle = ref('');
const checkingIn = ref(false);
const isRepeatCheckin = ref(false);
const recognizeHint = ref('');
const lastEventId = ref('');
/** 客户端当前持有的服务端 user_token（每次召回/签到后回写） */
const currentUserToken = ref(loadUserToken() || '');

const formTitle = computed(() =>
  isRepeatCheckin.value ? '再次确认信息' : '完善签到信息',
);
const formDesc = computed(() =>
  isRepeatCheckin.value
    ? '我们已为你保留上次的资料，确认即可'
    : '首次参与本活动，请填入一些信息',
);

const welcomeMessages = [
  '欢迎进入聚闪耀！准备好闪耀全场了吗？',
  '一颗新星降临！大屏上你的专属编号已就位。',
  '签到成功！你的暗星正在等待点亮...',
  '欢迎加入派对！今晚的欢乐由你定义。',
  '已就位！准备好迎接惊喜了吗？',
];

const welcomeMessage = computed(() => {
  const idx = checkinOrder.value % welcomeMessages.length;
  return welcomeMessages[idx];
});

/** 微信 H5 容器判断（用于显示"收藏页面"提示） */
const isWechatH5 = computed(() => {
  // #ifdef H5
  try {
    const ua = (navigator?.userAgent || '').toLowerCase();
    return ua.includes('micromessenger');
  } catch {
    return false;
  }
  // #endif
  // #ifndef H5
  return false;
  // #endif
});

/** 复制当前页面 URL（用户可粘贴到微信文件传输助手/收藏） */
const copyCurrentLink = () => {
  // #ifdef H5
  try {
    const url = location?.href || '';
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
    } else {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    uni.showToast({ title: '链接已复制', icon: 'success' });
  } catch {
    uni.showToast({ title: '复制失败，请手动收藏', icon: 'none' });
  }
  // #endif
  // #ifndef H5
  uni.setClipboardData({ data: '' });
  // #endif
};

/** 从大屏 URL 提取 event_id */
function parseEventIdFromUrl(q: string): string {
  if (!q) return '';
  const m1 = q.match(/\/e\/([^?/#]+)/);
  if (m1) return m1[1];
  const m2 = q.match(/[?&]event_id=([^&]+)/);
  if (m2) return m2[1];
  if (/^[A-Za-z0-9]{6,12}$/.test(q)) return q;
  return '';
}

/**
 * 入口 1：从二维码 / URL 进入
 *
 * 召回策略（按"丢失概率由低到高"递进）：
 *   1) 本地活动快照（已签到 → 0 表单）                              → 命中 = 已签到
 *   2) 服务端 /checkin/resolve：user_token + device_token 双身份     → 命中 = 已签到
 *   3) 服务端 resolve 没找到，但服务端仍返回 user（曾签到其他场）    → 预填表单
 *   4) 全无：本地 profile 兜底预填（昵称/手机号），用户 1 键确认即可
 *
 * 注：user_token 是服务端签发、写于 GlobalUser.user_token 列，丢失后由
 *     guestCheckIn 自动补发；本地双键冗余保存（主键 + 备份键）。
 */
async function enterEventFlow(parsed: string) {
  if (!parsed) return;
  eventId.value = parsed;
  eventIdLocked.value = true;
  lastEventId.value = parsed;
  uni.setStorageSync('flashmeet_current_event', parsed);

  // 并行：拿活动信息 + 总数（用于显示标题和顺序号）
  Promise.allSettled([
    eventApi.getOne(parsed).catch(() => null),
    checkinApi.getCount(parsed).catch(() => null),
  ]).then(([evtRes, countRes]) => {
    const e: any = (evtRes as any)?.value || null;
    const c: any = (countRes as any)?.value || null;
    if (e?.title) eventTitle.value = e.title;
    if (typeof c?.count === 'number') checkinOrder.value = c.count + 1;
  });

  // 0) 重新读一遍 token（防页面间 token 已被更新过）
  const freshToken = loadUserToken() || '';

  // 1) 本地快照优先（最稳）
  const localSnap = loadEventSnapshot(parsed);
  if (localSnap?.display_id) {
    applySnapshotToView(localSnap);
    isRepeatCheckin.value = !!localSnap.is_repeat;
    checkedIn.value = true;
    connectWs(parsed);
    return;
  }

  // 2) 服务端 resolve（user_token + device_token 双身份）
  try {
    const res: any = await checkinApi.resolve(parsed, {
      userToken: freshToken || undefined,
    });

    // 拿到 user_token 必须立即持久化（无论是否找到 checkin）
    if (res?.user_token && res.user_token !== freshToken) {
      saveUserToken(res.user_token);
      currentUserToken.value = res.user_token;
    }

    if (res?.found) {
      const snap = applyResolveToSnapshot(res);
      // 同步 user_token 到快照（便于离线时也能走通）
      snap.user_token = res.user_token || freshToken;
      saveEventSnapshot(snap);
      isRepeatCheckin.value = true;
      checkedIn.value = true;
      connectWs(parsed);
      return;
    }

    // 3) 设备/账号已识别（曾在本设备或本账号签到过其他活动）：预填
    if (res?.nickname) userName.value = res.nickname;
    if (res?.phone) userPhone.value = res.phone;
    if (res?.name) userName.value = res.name;
    if (res?.user_id) {
      saveUserProfile({
        user_id: res.user_id,
        user_token: res.user_token,
        nickname: res.nickname,
        phone: res.phone,
      });
      recognizeHint.value = res.user_token
        ? '已识别到你的账号，预填信息后一键签到'
        : '识别到本设备曾在其他活动签到，已为你预填';
    } else {
      const profile = loadUserProfile();
      if (profile.nickname) userName.value = profile.nickname;
      if (profile.phone) userPhone.value = profile.phone;
    }
    showManualInput.value = true;
  } catch (e) {
    // 4) 网络异常 → 本地 profile 兜底预填
    const profile = loadUserProfile();
    if (profile.nickname) userName.value = profile.nickname;
    if (profile.phone) userPhone.value = profile.phone;
    if (profile.nickname || profile.phone) {
      recognizeHint.value = '网络异常，已使用本机缓存信息';
    } else {
      recognizeHint.value = '';
    }
    showManualInput.value = true;
  }
}

function applySnapshotToView(snap: any) {
  checkedInDisplayId.value = snap.display_id || '';
  checkedInName.value = snap.name || '你';
}

function applyResolveToSnapshot(res: any) {
  checkedInDisplayId.value = res.display_id;
  checkedInName.value = res.name || '你';
  return {
    event_id: res.event_id,
    user_id: res.user_id,
    user_token: res.user_token,
    display_id: res.display_id,
    name: res.name,
    checked_in_at: res.checked_in_at
      ? new Date(res.checked_in_at).getTime()
      : Date.now(),
    is_repeat: true,
  };
}

onLoad(async (options: any) => {
  // 兼容多种小程序入口：微信扫码(scene) / Taro扫码(q) / 直接传event_id
  const fromQr = options?.q || options?.scene;
  const direct = options?.event_id;
  const parsed = parseEventIdFromUrl(decodeURIComponent(fromQr || '')) || direct || '';
  if (parsed) {
    enterEventFlow(parsed);
  }
});

const scanQRCode = () => {
  uni.vibrateShort?.({ type: 'light' });
  uni.scanCode({
    onlyFromCamera: true,
    scanType: ['qrCode'],
    success: (res) => {
      const match = res.result.match(/\/e\/([^?/]+)/);
      if (match) {
        enterEventFlow(match[1]);
      } else {
        showManualInput.value = true;
      }
    },
    fail: () => {
      showManualInput.value = true;
    },
  });
};

const mockCheckin = () => {
  uni.vibrateShort?.({ type: 'light' });
  showManualInput.value = true;
  if (!eventId.value) {
    const profile = loadUserProfile();
    if (profile.nickname) userName.value = profile.nickname;
    if (profile.phone) userPhone.value = profile.phone;
  }
};

const goBackScan = () => {
  showManualInput.value = false;
  eventId.value = '';
  eventIdLocked.value = false;
  userName.value = '';
  userPhone.value = '';
  recognizeHint.value = '';
};

const doCheckin = async () => {
  if (!eventId.value) {
    uni.showToast({ title: '请输入活动ID', icon: 'none' });
    return;
  }
  if (!userName.value.trim()) {
    uni.showToast({ title: '请输入你的名字', icon: 'none' });
    return;
  }
  // 手机号格式校验（非必填，但填了就必须合法）
  if (userPhone.value.trim() && !/^1[3-9]\d{9}$/.test(userPhone.value.trim())) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
    return;
  }

  checkingIn.value = true;
  const myDisplayId = generateDisplayId(userName.value);
  // 重新读取最新 user_token（避免被旧 ref 持有过期值）
  const freshToken = loadUserToken() || '';

  try {
    const res: any = await checkinApi.guestCheckIn(
      eventId.value,
      userName.value.trim(),
      userPhone.value.trim(),
      { displayId: myDisplayId, userToken: freshToken || undefined },
    );
    const checkin = res?.checkin || res;
    const user = res?.user;

    // 0) 关键：服务端每次签到都会回传 user_token（首次签发 / 旧账号补发）
    if (user?.user_token) {
      saveUserToken(user.user_token);
      currentUserToken.value = user.user_token;
    }

    // 1) 写活动快照（包含 user_token，离线时也能命中）
    const snap = {
      event_id: eventId.value,
      user_id: user?.user_id,
      user_token: user?.user_token || freshToken,
      display_id: checkin?.display_id || myDisplayId,
      name: userName.value,
      checked_in_at: Date.now(),
      // isNew=false 表示服务端识别到该设备/手机已有用户
      is_repeat: res && res.isNew === false,
    };
    saveEventSnapshot(snap);

    // 2) 写用户档案（跨活动复用）
    saveUserProfile({
      user_id: user?.user_id,
      user_token: user?.user_token,
      nickname: userName.value,
      phone: userPhone.value,
      avatar_url: user?.avatar_url,
      default_display_id: snap.display_id,
    });

    // 3) 切换到已签到视图
    checkedIn.value = true;
    checkedInDisplayId.value = snap.display_id;
    checkedInName.value = userName.value || '你';
    if (checkin?.order) {
      checkinOrder.value = checkin.order;
    } else if (checkinOrder.value === 0) {
      checkinOrder.value = 1;
    }
    // 服务端认为该用户已存在 → 标记为"回来"
    if (res && res.isNew === false) {
      isRepeatCheckin.value = true;
    }

    // 4) 写入"最近活动"快捷入口（首页会用）
    try {
      uni.setStorageSync('flashmeet_recent_event', JSON.stringify({
        event_id: eventId.value,
        title: eventTitle.value || '',
        checked_in_at: Date.now(),
      }));
    } catch {}

    connectWs(eventId.value);
    uni.vibrateShort({ type: 'medium' });
    uni.showToast({ title: '签到成功！', icon: 'success' });
  } catch (err: any) {
    // 网络层失败 → 走离线兜底：仅当本地有快照时
    const snap = loadEventSnapshot(eventId.value);
    if (snap && !err?.status) {
      checkedIn.value = true;
      applySnapshotToView(snap);
      isRepeatCheckin.value = true;
      connectWs(eventId.value);
      uni.showToast({ title: '已使用本地记录', icon: 'none' });
      return;
    }
    uni.showToast({
      title: mapErrorToMessage(err),
      icon: 'none',
      duration: 2500,
    });
  } finally {
    checkingIn.value = false;
  }
};

const connectWs = (eid: string) => {
  socketService.connect(eid);
  // 清理旧监听避免重复绑定
  if (unbindScene) unbindScene();
  unbindScene = socketService.onSceneChange((data) => {
    if (!data || data.event_id !== eid) return;
    const state = data.state;
    const pages = getCurrentPages();
    const cur = pages[pages.length - 1];
    const curRoute = cur?.route || '';

    if (state === EventStatus.ICEBREAKER) {
      if (!curRoute.includes('icebreaker')) {
        uni.navigateTo({ url: `/pages/user/icebreaker?event_id=${eid}` });
      }
    } else if (state === EventStatus.GAME_SHAKE) {
      if (!curRoute.includes('shake')) {
        uni.navigateTo({ url: `/pages/user/shake?eventId=${eid}` });
      }
    } else if (state === EventStatus.GAME_MATCH) {
      if (!curRoute.includes('match')) {
        uni.navigateTo({ url: `/pages/user/match?eventId=${eid}` });
      }
    } else if (state === EventStatus.LOTTERY_RUNNING || state === EventStatus.LOTTERY_READY) {
      if (!curRoute.includes('lottery')) {
        uni.navigateTo({ url: `/pages/user/lottery?eventId=${eid}` });
      }
    } else if (state === EventStatus.ENDED) {
      if (!curRoute.includes('achievement')) {
        uni.navigateTo({ url: `/pages/user/achievement?eventId=${eid}` });
      }
    }
  });
};

let unbindScene: (() => void) | null = null;

onUnload(() => {
  // 离开签到页时清理场景切换监听，避免在其他页面重复触发导航
  if (unbindScene) {
    unbindScene();
    unbindScene = null;
  }
});
</script>

<style scoped>
.checkin-page {
  min-height: 100vh;
  padding: calc(60rpx + env(safe-area-inset-top)) 40rpx
    calc(60rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%);
}

/* 扫码区 */
.scan-area {
  text-align: center;
  padding-top: 80rpx;
}
.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
}
.brand-logo {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #ff6b6b 50%, #ffd700 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 32rpx rgba(102, 126, 234, 0.4);
  animation: pulse-glow 3s ease-in-out infinite;
}
.brand-icon { font-size: 64rpx; line-height: 1; }
.title {
  font-size: 56rpx;
  font-weight: 800;
  color: white;
  letter-spacing: 4rpx;
}
.desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.55);
  display: block;
  margin-bottom: 80rpx;
  letter-spacing: 1rpx;
}
.scan-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}
.scan-btn {
  width: 480rpx;
  height: 96rpx;
  line-height: 96rpx;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 700;
  border: none;
  transition: transform 0.2s ease, opacity 0.2s;
  letter-spacing: 2rpx;
}
.scan-btn::after { border: none; }
.scan-btn:active { transform: scale(0.97); opacity: 0.9; }
.scan-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
}
.scan-btn.ghost {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 28rpx;
  font-weight: 500;
}
.scan-hint {
  display: block;
  margin-top: 40rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 1rpx;
}

/* 表单 */
.event-input {
  margin-top: 60rpx;
  padding: 0 20rpx;
  animation: fade-in 0.3s ease;
}
.form-header {
  margin-bottom: 24rpx;
  text-align: center;
}
.form-title {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: white;
  letter-spacing: 2rpx;
}
.form-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
}
.input {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16rpx;
  padding: 24rpx;
  color: white;
  font-size: 30rpx;
  margin-bottom: 24rpx;
  transition: border-color 0.2s;
}
.input:focus { border-color: rgba(102, 126, 234, 0.6); }
.input:disabled { opacity: 0.6; }

.recognition-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 24rpx;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.1));
  border: 1rpx solid rgba(102, 126, 234, 0.35);
  border-radius: 12rpx;
  margin-bottom: 24rpx;
}
.recognition-icon { font-size: 28rpx; }
.recognition-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
  flex: 1;
}

.recall-fallback {
  padding: 12rpx 24rpx;
  background: rgba(255, 215, 0, 0.06);
  border: 1rpx dashed rgba(255, 215, 0, 0.3);
  border-radius: 12rpx;
  margin-bottom: 24rpx;
  text-align: center;
}
.recall-fallback-text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.5rpx;
}

.submit-btn {
  background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%);
  color: #0a0a2e;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 700;
  height: 96rpx;
  line-height: 96rpx;
  border: none;
  margin-top: 16rpx;
}
.submit-btn::after { border: none; }
.submit-btn:disabled { opacity: 0.5; }
.submit-btn:active:not(:disabled) { transform: scale(0.97); }

.back-to-scan {
  margin-top: 32rpx;
  text-align: center;
}
.back-to-scan-text {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 1rpx;
}

/* 签到成功 */
.checked-in {
  text-align: center;
  padding-top: 40rpx;
  animation: fadeInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.welcome-back {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  padding: 10rpx 28rpx;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.18), rgba(255, 107, 107, 0.12));
  border: 1rpx solid rgba(255, 215, 0, 0.4);
  border-radius: 999rpx;
  margin-bottom: 30rpx;
  animation: fade-in 0.4s ease;
}
.welcome-back-icon { font-size: 32rpx; }
.welcome-back-text {
  font-size: 26rpx;
  color: #ffd700;
  font-weight: 700;
  letter-spacing: 1rpx;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(-12rpx); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeInUp {
  0% { transform: translateY(40rpx); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 32rpx rgba(102, 126, 234, 0.4); }
  50% { box-shadow: 0 0 56rpx rgba(255, 215, 0, 0.5); }
}

.order-badge {
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  gap: 6rpx;
  padding: 10rpx 36rpx;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 107, 107, 0.1) 100%);
  border: 1rpx solid rgba(255, 215, 0, 0.35);
  border-radius: 999rpx;
  margin-bottom: 30rpx;
  font-variant-numeric: tabular-nums;
}
.order-num {
  font-size: 64rpx;
  font-weight: 900;
  color: #ffd700;
  line-height: 1;
  font-feature-settings: 'tnum';
  text-shadow: 0 0 20rpx rgba(255, 215, 0, 0.5);
}
.order-suffix, .order-label {
  font-size: 26rpx;
  color: rgba(255, 215, 0, 0.8);
}

.success-icon-wrap {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  margin: 0 auto 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.success-icon {
  font-size: 100rpx;
  line-height: 1;
  animation: bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  z-index: 2;
}
.success-pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(74, 222, 128, 0.4), transparent 70%);
  animation: pulse-out 1.6s ease-out infinite;
}
@keyframes bounce-in {
  0% { transform: scale(0); }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
@keyframes pulse-out {
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(1.6); opacity: 0; }
}

.success-text {
  font-size: 40rpx;
  font-weight: 800;
  color: white;
  display: block;
  margin-bottom: 8rpx;
}
.event-title {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
  display: block;
  margin-bottom: 30rpx;
}

.save-tip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12rpx;
  margin: 0 20rpx 24rpx;
  padding: 18rpx 24rpx;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.12), rgba(255, 215, 0, 0.08));
  border: 1rpx solid rgba(102, 126, 234, 0.3);
  border-radius: 16rpx;
  text-align: left;
}
.save-tip-icon { font-size: 28rpx; }
.save-tip-text {
  flex: 1;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
  letter-spacing: 0.5rpx;
  min-width: 320rpx;
}
.save-tip-actions {
  display: flex;
  gap: 8rpx;
  margin-left: auto;
}
.save-tip-link {
  font-size: 24rpx;
  color: #ffd700;
  padding: 6rpx 18rpx;
  border: 1rpx solid rgba(255, 215, 0, 0.4);
  border-radius: 999rpx;
  letter-spacing: 1rpx;
}

.display-id-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  background: rgba(255, 255, 255, 0.06);
  border: 1rpx solid rgba(255, 215, 0, 0.25);
  border-radius: 24rpx;
  padding: 24rpx;
  margin: 30rpx 20rpx 0;
  text-align: left;
}
.display-id-meta { flex: 1; }
.display-id-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.55);
  display: block;
  margin-bottom: 4rpx;
}
.display-id-value {
  font-size: 32rpx;
  font-weight: 800;
  color: #ffd700;
  display: block;
}
.display-id-tag {
  padding: 6rpx 16rpx;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 107, 107, 0.2));
  border-radius: 999rpx;
}
.display-id-tag text {
  font-size: 22rpx;
  color: #ffd700;
  font-weight: 700;
}

.welcome-msg {
  margin: 30rpx 20rpx 0;
  padding: 24rpx;
  background: rgba(102, 126, 234, 0.1);
  border-left: 4rpx solid #667eea;
  border-radius: 12rpx;
}
.welcome-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
}

.hint {
  display: block;
  margin: 24rpx 0;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
}

.next-steps {
  margin: 30rpx 0;
}
</style>
