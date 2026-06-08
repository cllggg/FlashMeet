<template>
  <view class="lottery-manage-page">
    <text class="title">抽奖管理</text>

    <view class="section" v-if="eventId">
      <text class="section-title">创建奖池</text>
      <view class="form-item">
        <text class="label">奖池名称</text>
        <input
          class="input"
          v-model="poolForm.name"
          placeholder="如：一等奖"
          placeholder-style="color: rgba(255,255,255,0.3)"
        />
      </view>

      <view class="prizes">
        <view v-for="(prize, i) in poolForm.prizes" :key="i" class="prize-card">
          <view class="prize-row">
            <text class="prize-tier" :class="`tier-${tierOf(prize.value)}`">
              {{ tierLabel(prize.value) }}
            </text>
            <text class="prize-remove" @tap="removePrize(i)" v-if="poolForm.prizes.length > 1">×</text>
          </view>
          <view class="prize-row prize-inputs">
            <input
              class="input small"
              v-model="prize.name"
              placeholder="奖品名（如：iPad）"
              placeholder-style="color: rgba(255,255,255,0.3)"
            />
            <input
              class="input tiny"
              v-model.number="prize.total_count"
              type="number"
              placeholder="数量"
              placeholder-style="color: rgba(255,255,255,0.3)"
            />
            <input
              class="input tiny"
              v-model.number="prize.value"
              type="number"
              placeholder="价值"
              placeholder-style="color: rgba(255,255,255,0.3)"
            />
          </view>
          <view class="prize-hint">
            <text class="hint-text">
              价值 ≥ 100 视为大奖（彩带 + 特殊动效）
            </text>
          </view>
        </view>
        <button class="add-prize-btn" @tap="addPrize">+ 添加奖品</button>
      </view>

      <button class="submit-btn" @tap="createPool" :disabled="creating">
        {{ creating ? '创建中...' : '创建奖池' }}
      </button>
    </view>

    <view class="section">
      <text class="section-title">奖池列表</text>
      <RetryBar
        :visible="!!loadError"
        :message="loadError + '请检查网络后重试'"
        :loading="loadingPools"
        @retry="retryLoad"
      />
      <view v-if="pools.length === 0 && !loadError" class="empty-tip">
        <text class="empty-emoji">🎁</text>
        <text class="empty-text">还没有奖池，先创建一个吧</text>
      </view>
      <view v-for="pool in pools" :key="pool.id" class="pool-item">
        <view class="pool-header">
          <text class="pool-name">{{ pool.name }}</text>
          <view class="pool-actions">
            <button
              class="prepick-btn"
              size="mini"
              :disabled="pool.is_completed"
              @tap="openPrePicker(pool)"
            >
              {{ (prePickedMap[pool.id]?.length || 0) > 0 ? t('host.lottery.prepicked', { n: prePickedMap[pool.id].length }) : t('host.lottery.prepick') }}
            </button>
            <button
              class="draw-btn"
              size="mini"
              :disabled="pool.is_completed || drawingId === pool.id"
              @tap="confirmDraw(pool)"
            >
              {{ drawingId === pool.id ? t('host.lottery.drawing') : pool.is_completed ? t('host.lottery.drawDone') : t('host.lottery.draw') }}
            </button>
          </view>
        </view>
        <view v-for="prize in pool.prizes" :key="prize.id" class="prize-info">
          <text
            class="prize-tier-dot"
            :class="`tier-${tierOf(prize.value)}`"
          />
          <text class="prize-info-name">{{ prize.name }}</text>
          <text class="prize-info-count">
            {{ prize.remaining_count }}/{{ prize.total_count }}
          </text>
        </view>
        <view v-if="pool.is_completed" class="pool-done-tag">已派完</view>
      </view>
    </view>

    <!-- 内顶选择器 -->
    <view v-if="prePickerOpen" class="prepicker-mask" @tap="closePrePicker">
      <view class="prepicker-card" @tap.stop>
        <view class="prepicker-header">
          <text class="prepicker-title">🎯 内定中奖人</text>
          <text class="prepicker-subtitle">
            优先从「{{ activePool?.name }}」中按顺序抽出。已中过本奖池的人会自动跳过。
          </text>
        </view>
        <view class="prepicker-search">
          <input
            v-model="prePickerKeyword"
            class="prepicker-input"
            placeholder="搜索 display_id / 昵称"
            placeholder-style="color: rgba(255,255,255,0.35)"
          />
        </view>
        <scroll-view scroll-y class="prepicker-list">
          <view
            v-for="c in filteredCheckins"
            :key="c.user_id"
            class="prepicker-row"
            :class="{
              selected: (prePickedMap[activePool.id] || []).includes(c.user_id),
              disabled: (winnersByPool[activePool.id] || []).some(w => w.user_id === c.user_id),
            }"
            @tap="togglePrePick(c.user_id)"
          >
            <Avatar
              :name="c.display_id || c.user?.nickname"
              size="sm"
            />
            <view class="prepicker-info">
              <text class="prepicker-name">
                {{ c.display_id || c.user?.nickname || '?' }}
              </text>
              <text v-if="c.user?.nickname && c.display_id" class="prepicker-sub">
                {{ c.user.nickname }}
              </text>
            </view>
            <text
              v-if="(winnersByPool[activePool.id] || []).some(w => w.user_id === c.user_id)"
              class="prepicker-tag-disabled"
            >已中过</text>
            <text
              v-else-if="(prePickedMap[activePool.id] || []).includes(c.user_id)"
              class="prepicker-tag-on"
            >✓ 已选 #{{ prePickedMap[activePool.id].indexOf(c.user_id) + 1 }}</text>
            <text v-else class="prepicker-tag-off">+ 选为内定</text>
          </view>
        </scroll-view>
        <view class="prepicker-footer">
          <view class="prepicker-count">
            已选 {{ prePickedMap[activePool.id]?.length || 0 }} 人
          </view>
          <view class="prepicker-clear" @tap="clearPrePick">清空</view>
          <view class="prepicker-confirm" @tap="closePrePicker">完成</view>
        </view>
      </view>
    </view>

    <view class="section" v-if="winners.length > 0">
      <view class="section-header">
        <text class="section-title">中奖名单 ({{ winners.length }})</text>
        <view class="export-btn" :class="{ disabled: exporting }" @tap="exportCsv">
          <text class="export-btn-text">
            {{ exporting ? t('host.lottery.exporting') : t('host.lottery.exportCsv') }}
          </text>
        </view>
      </view>
      <view v-for="w in winners" :key="w.id" class="winner-item">
        <view class="winner-left">
          <Avatar
            :name="w.display_id || w.user?.nickname"
            :tier="(w.prize_value ?? 0) >= 100 ? 'big' : 'normal'"
            size="md"
          />
          <view class="winner-meta">
            <view class="winner-name-row">
              <text
                v-if="w.prize_value >= 100"
                class="winner-tier-badge"
              >🌟 大奖</text>
              <text class="winner-name">
                {{ w.display_id || w.user?.nickname || '幸运儿' }}
              </text>
            </view>
            <text class="winner-prize-line">{{ w.prize_name }}</text>
          </view>
        </view>
        <text class="winner-prize">×1</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { lotteryApi, checkinApi } from '../../services/api';
import { httpErrorToMessage } from '../../services/request';
import { useI18n } from '../../utils/i18n';

const { t, locale } = useI18n();

// 与 services/request.ts 同步：API base（带 /api 前缀）
const BASE = (
  (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000/api'
).toString();
import { isRetryable } from '../../utils/error-message';
import Avatar from '../../components/Avatar.vue';
import RetryBar from '../../components/RetryBar.vue';

const eventId = ref('');
const pools = ref<any[]>([]);
const winners = ref<any[]>([]);
const checkins = ref<any[]>([]);
const creating = ref(false);
const drawingId = ref<string>('');
const exporting = ref(false);
const loadError = ref('');
const loadingPools = ref(false);
/** 全局抽奖锁：防止用户在 showActionSheet 期间反复点击触发多次抽奖 */
let drawLockUntil = 0;
// 内顶：按 pool_id 维护一组 user_id；以及内顶面板自身状态
const prePickedMap = ref<Record<string, string[]>>({});
const prePickerOpen = ref(false);
const activePool = ref<any>(null);
const prePickerKeyword = ref('');

interface PrizeForm {
  name: string;
  total_count: number;
  value: number;
}

const poolForm = ref<{ name: string; prizes: PrizeForm[] }>({
  name: '',
  prizes: [{ name: '', total_count: 1, value: 0 }],
});

/** 价值 → 档位 */
const tierOf = (value: number | undefined): 'big' | 'normal' => {
  return (value ?? 0) >= 100 ? 'big' : 'normal';
};
const tierLabel = (value: number | undefined): string => {
  return tierOf(value) === 'big' ? '🌟 大奖' : '🎁 普通';
};

onLoad((options: any) => {
  if (options?.eventId) {
    eventId.value = options.eventId;
    uni.setStorageSync('flashmeet_current_event', options.eventId);
    loadPools();
    loadWinners();
  }
});

const addPrize = () => {
  if (poolForm.value.prizes.length >= 6) {
    uni.showToast({ title: '最多 6 个奖品', icon: 'none' });
    return;
  }
  poolForm.value.prizes.push({ name: '', total_count: 1, value: 0 });
};

const removePrize = (i: number) => {
  poolForm.value.prizes.splice(i, 1);
};

const createPool = async () => {
  if (!eventId.value || !poolForm.value.name.trim()) {
    uni.showToast({ title: '请填写奖池名称', icon: 'none' });
    return;
  }
  const validOpts = poolForm.value.prizes.filter(
    (p) => p.name.trim() && p.total_count > 0,
  );
  if (validOpts.length < 1) {
    uni.showToast({ title: '请至少添加一项奖品，并填写名称和数量', icon: 'none' });
    return;
  }
  // 校验奖品名称不重复
  const prizeNames = validOpts.map((p: any) => p.name.trim());
  const dupNames = prizeNames.filter((n: string, i: number) => prizeNames.indexOf(n) !== i);
  if (dupNames.length > 0) {
    uni.showToast({ title: `奖品名称「${dupNames.join('、')}」重复，请修改`, icon: 'none' });
    return;
  }
  creating.value = true;
  try {
    await lotteryApi.createPool({
      event_id: eventId.value,
      name: poolForm.value.name.trim(),
      prizes: validOpts.map((p) => ({
        name: p.name.trim(),
        total_count: p.total_count,
        value: p.value || 0,
      })),
    });
    uni.showToast({ title: '创建成功', icon: 'success' });
    poolForm.value = { name: '', prizes: [{ name: '', total_count: 1, value: 0 }] };
    loadPools();
  } catch (err) {
    uni.showToast({ title: httpErrorToMessage(err), icon: 'none' });
  } finally {
    creating.value = false;
  }
};

const confirmDraw = (pool: any) => {
  if (Date.now() < drawLockUntil) return;
  drawLockUntil = Date.now() + 1500; // 1.5s 内不允许再次进入
  const remaining = pool.prizes.reduce(
    (s: number, p: any) => s + (p.remaining_count || 0),
    0,
  );
  if (remaining <= 0) {
    uni.showToast({ title: '奖池已派完', icon: 'none' });
    return;
  }
  // 单抽 / 连抽 选择弹窗
  uni.showActionSheet({
    itemList: [
      t('host.lottery.drawOne'),
      t('host.lottery.drawFive'),
      t('host.lottery.drawTen'),
    ],
    success: (r) => {
      const map: Record<number, number> = { 0: 1, 1: 5, 2: 10 };
      const n = map[r.tapIndex] || 1;
      const finalN = Math.min(n, remaining);
      if (finalN > 1) {
        confirmBatchDraw(pool, finalN);
      } else {
        drawLottery(pool.id, 1);
      }
    },
  });
};

const confirmBatchDraw = (pool: any, n: number) => {
  uni.showModal({
    title: '确认批量抽取',
    content: `将从「${pool.name}」中连抽 ${n} 名幸运儿，库存不足时自动停止。`,
    confirmText: `连抽 ${n}`,
    cancelText: '再想想',
    success: (r) => {
      if (r.confirm) drawLottery(pool.id, n);
    },
  });
};

const drawLottery = async (poolId: string, count: number = 1) => {
  if (!eventId.value) return;
  drawingId.value = poolId;
  // 抽取前把已中过 / 已不在签到名单的内顶剔除，避免后端把名额耗光
  const preList = (prePickedMap.value[poolId] || []).filter((uid) => {
    const won = (winnersByPool.value[poolId] || []).some(
      (w) => w.user_id === uid,
    );
    const inCheckin = checkins.value.some((c) => c.user_id === uid);
    return !won && inCheckin;
  });
  // 内顶人数超过 count 时截断；不足时剩余走随机
  const prePicked = preList.slice(0, count);
  // request_id 用 crypto.randomUUID（不可重放），旧设备无 crypto 时回退
  const requestId =
    (typeof crypto !== 'undefined' && (crypto as any).randomUUID?.()) ||
    `draw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    const res: any = await lotteryApi.draw(
      eventId.value,
      poolId,
      requestId,
      count,
      prePicked,
    );
    // 批量返回数组；单抽返回单条
    const winnersArr: any[] = Array.isArray(res) ? res : res ? [res] : [];
    if (winnersArr.length === 0) {
      uni.showToast({ title: '暂无可抽取用户', icon: 'none' });
    } else if (winnersArr.length === 1) {
      const w = winnersArr[0];
      const winnerName = pickName(w);
      const isPre = prePicked.includes(w?.user_id);
      showWinnerDialog(
        winnerName,
        w?.prize_name || '神秘奖品',
        (w?.prize_value ?? 0) >= 100,
        isPre,
      );
    } else {
      showBatchWinnersDialog(winnersArr, prePicked);
    }
    loadWinners();
    loadPools();
  } catch (err) {
    uni.showToast({ title: httpErrorToMessage(err), icon: 'none' });
  } finally {
    drawingId.value = '';
  }
};

const pickName = (w: any): string =>
  w?.display_id || w?.user?.nickname || w?.name || w?.user_name || '幸运儿';

const showWinnerDialog = (
  name: string,
  prize: string,
  isBig: boolean,
  isPre: boolean = false,
) => {
  // 奖池抽奖 dialog 内容
  const tags: string[] = [];
  if (isPre) tags.push('🎯 内定');
  if (isBig) tags.push('🌟 大奖');
  const banner = tags.length ? `${tags.join(' · ')} · ` : '';
  const fullTitle = `${banner}恭喜 ${name}`;
  const content = `抽中：${prize}`;
  uni.showModal({
    title: fullTitle,
    content,
    confirmText: '复制 ID',
    cancelText: '知道啦',
    success: (r) => {
      if (r.confirm) {
        uni.setClipboardData({
          data: name,
          showToast: true,
          success: () => {
            uni.showToast({ title: '已复制 display_id', icon: 'none' });
          },
        });
      }
    },
  });
};

/**
 * 批量中奖 dialog：显示全部中奖人 + 一键复制所有 display_id
 */
const exportCsv = async () => {
  if (!eventId.value || winners.value.length === 0) {
    uni.showToast({ title: '暂无可导出名单', icon: 'none' });
    return;
  }
  exporting.value = true;
  try {
    const authToken = uni.getStorageSync('flashmeet_token');
    // 直接走原始请求以接收 text/csv
    const res = await new Promise<{ statusCode: number; data: string }>(
      (resolve, reject) => {
        uni.request({
          url: `${BASE}/lottery/${eventId.value}/winners/export.csv`,
          method: 'GET',
          header: { Authorization: `Bearer ${authToken}` },
          responseType: 'text',
          success: (r) =>
            resolve({
              statusCode: r.statusCode,
              data: (r.data as string) || '',
            }),
          fail: (e) => reject(e),
        });
      },
    );
    if (res.statusCode !== 200) {
      uni.showToast({ title: '导出失败', icon: 'none' });
      return;
    }
    // 小程序端用文件系统落地
    const fsm = uni.getFileSystemManager();
    const path = `${(uni as any).env?.USER_DATA_PATH || ''}/winners_${eventId.value}_${Date.now()}.csv`;
    await new Promise<void>((resolve, reject) => {
      fsm.writeFile({
        filePath: path,
        data: res.data,
        encoding: 'utf8',
        success: () => resolve(),
        fail: (e) => reject(e),
      });
    });
    uni.openDocument({
      filePath: path,
      showMenu: true,
      success: () => {
        uni.showToast({ title: '已生成 CSV（可转发/另存）', icon: 'none' });
      },
      fail: () => {
        uni.showToast({ title: '已保存到本地', icon: 'none' });
      },
    });
  } catch (err: any) {
    uni.showToast({ title: httpErrorToMessage(err), icon: 'none' });
  } finally {
    exporting.value = false;
  }
};

/**
 * 批量中奖 dialog：显示全部中奖人 + 一键复制所有 display_id
 */
const showBatchWinnersDialog = (winners: any[], prePicked: string[] = []) => {
  const bigCount = winners.filter((w) => (w?.prize_value ?? 0) >= 100).length;
  const lines = winners
    .map((w, i) => {
      const tags: string[] = [];
      if (prePicked.includes(w?.user_id)) tags.push('🎯');
      if ((w?.prize_value ?? 0) >= 100) tags.push('🌟');
      const prefix = tags.length ? `${tags.join('')} ` : '🎁 ';
      return `${i + 1}. ${prefix}${pickName(w)} → ${w?.prize_name || '奖品'}`;
    })
    .join('\n');
  uni.showModal({
    title: `🎉 一次性连中 ${winners.length} 名${bigCount > 0 ? `（含 ${bigCount} 位大奖）` : ''}`,
    content: lines,
    confirmText: '复制名单',
    cancelText: '关闭',
    success: (r) => {
      if (r.confirm) {
        const ids = winners.map(pickName).join('\n');
        uni.setClipboardData({
          data: ids,
          success: () =>
            uni.showToast({ title: `已复制 ${winners.length} 个 ID`, icon: 'none' }),
        });
      }
    },
  });
};

const loadPools = async () => {
  if (!eventId.value) return;
  loadingPools.value = true;
  loadError.value = '';
  try {
    const res: any = await lotteryApi.getPools(eventId.value);
    pools.value = res;
  } catch (err) {
    if (isRetryable(err)) {
      loadError.value = '奖池数据加载失败，';
    }
  } finally {
    loadingPools.value = false;
  }
};

const retryLoad = () => {
  loadError.value = '';
  loadPools();
};

const loadWinners = async () => {
  if (!eventId.value) return;
  try {
    const res: any = await lotteryApi.getWinners(eventId.value);
    winners.value = res;
  } catch {}
};

// 加载本场签到名单（用于内顶面板）
const loadCheckins = async () => {
  if (!eventId.value) return;
  try {
    const res: any = await checkinApi.getCheckins(eventId.value);
    checkins.value = res;
  } catch {}
};

// 把中奖名单按 pool_id 归组，方便内顶面板过滤
const winnersByPool = computed(() => {
  const m: Record<string, any[]> = {};
  for (const w of winners.value) {
    (m[w.pool_id] ||= []).push(w);
  }
  return m;
});

// 内顶面板：搜索过滤
const filteredCheckins = computed(() => {
  const kw = prePickerKeyword.value.trim().toLowerCase();
  if (!kw) return checkins.value;
  return checkins.value.filter((c) => {
    const a = (c.display_id || '').toLowerCase();
    const b = (c.user?.nickname || '').toLowerCase();
    return a.includes(kw) || b.includes(kw);
  });
});

const openPrePicker = (pool: any) => {
  activePool.value = pool;
  prePickerKeyword.value = '';
  prePickerOpen.value = true;
  if (checkins.value.length === 0) loadCheckins();
};

const closePrePicker = () => {
  prePickerOpen.value = false;
  activePool.value = null;
};

const togglePrePick = (userId: string) => {
  if (!activePool.value) return;
  const pid = activePool.value.id;
  // 已中过 → 不可再选
  const isAlreadyWon = (winnersByPool.value[pid] || []).some(
    (w) => w.user_id === userId,
  );
  if (isAlreadyWon) return;
  const list = prePickedMap.value[pid] ? [...prePickedMap.value[pid]] : [];
  const idx = list.indexOf(userId);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(userId); // 顺序就是抽取顺序
  prePickedMap.value = { ...prePickedMap.value, [pid]: list };
};

const clearPrePick = () => {
  if (!activePool.value) return;
  prePickedMap.value = { ...prePickedMap.value, [activePool.value.id]: [] };
};

onMounted(() => {
  // Get current event ID from storage
  const stored = uni.getStorageSync('flashmeet_current_event');
  if (stored) {
    eventId.value = stored;
    loadPools();
    loadWinners();
  }
});
</script>

<style scoped>
.lottery-manage-page {
  min-height: 100vh;
  padding: calc(40rpx + env(safe-area-inset-top)) 40rpx
    calc(60rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 100%);
}

.title {
  font-size: 48rpx;
  font-weight: 800;
  background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 50%, #667eea 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: block;
  margin-bottom: 32rpx;
  letter-spacing: 4rpx;
}

.section {
  margin-bottom: 40rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.75);
  display: block;
  margin-bottom: 20rpx;
  letter-spacing: 1rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}
.section-header .section-title {
  margin-bottom: 0;
}

.export-btn {
  padding: 10rpx 22rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 4rpx 14rpx rgba(99, 102, 241, 0.35);
  transition: transform 0.15s ease, opacity 0.2s ease;
}
.export-btn:active {
  transform: scale(0.96);
}
.export-btn.disabled {
  opacity: 0.5;
  pointer-events: none;
}
.export-btn-text {
  font-size: 24rpx;
  color: #fff;
  font-weight: 500;
  letter-spacing: 1rpx;
}

.form-item {
  margin-bottom: 20rpx;
}

.label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
  display: block;
  margin-bottom: 12rpx;
  letter-spacing: 1rpx;
  font-weight: 600;
}

.input {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.03));
  border: 2rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 14rpx;
  padding: 22rpx;
  color: white;
  font-size: 28rpx;
  letter-spacing: 0.5rpx;
  transition: border-color 0.2s;
}
.input:focus {
  border-color: rgba(102, 126, 234, 0.5);
}

.input.small {
  flex: 1;
  min-width: 0;
}

.input.tiny {
  width: 130rpx;
  flex-shrink: 0;
}

.prize-card {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 18rpx;
  padding: 22rpx;
  margin-bottom: 18rpx;
}

.prize-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 10rpx;
}

.prize-row.prize-inputs {
  margin-bottom: 0;
}

.prize-tier {
  font-size: 22rpx;
  font-weight: bold;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  flex-shrink: 0;
}

.prize-tier.tier-big {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
}

.prize-tier.tier-normal {
  background: rgba(102, 126, 234, 0.15);
  color: #8ea2ff;
}

.prize-tier-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.prize-tier-dot.tier-big {
  background: #ffd700;
  box-shadow: 0 0 8rpx #ffd700;
}

.prize-tier-dot.tier-normal {
  background: #667eea;
}

.prize-remove {
  margin-left: auto;
  width: 40rpx;
  height: 40rpx;
  line-height: 36rpx;
  text-align: center;
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  flex-shrink: 0;
}

.prize-hint {
  margin-top: 8rpx;
}

.hint-text {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.35);
}

.add-prize-btn {
  background: rgba(255, 255, 255, 0.05);
  color: #667eea;
  font-size: 26rpx;
  border: 2rpx dashed rgba(102, 126, 234, 0.3);
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.submit-btn {
  background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%);
  color: #0a0a2e;
  border-radius: 46rpx;
  font-size: 30rpx;
  font-weight: 700;
  border: none;
  height: 88rpx;
  line-height: 88rpx;
  letter-spacing: 4rpx;
  box-shadow: 0 6rpx 20rpx rgba(255, 215, 0, 0.3);
  transition: transform 0.2s, opacity 0.2s;
}
.submit-btn::after { border: none; }
.submit-btn:active:not(:disabled) { transform: scale(0.98); opacity: 0.92; }

.submit-btn:disabled {
  opacity: 0.5;
  box-shadow: none;
}

.pool-item {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 18rpx;
  position: relative;
  transition: border-color 0.2s;
}
.pool-item:active { border-color: rgba(102, 126, 234, 0.3); }

.pool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.pool-name {
  font-size: 30rpx;
  font-weight: 700;
  color: white;
  letter-spacing: 1rpx;
}

.draw-btn {
  background: #667eea;
  color: white;
  border-radius: 30rpx;
  font-size: 24rpx;
  border: none;
}

.draw-btn:disabled {
  opacity: 0.4;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
}

.prize-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 6rpx;
}

.prize-info-name {
  flex: 1;
}

.prize-info-count {
  font-weight: 700;
  color: #ffd700;
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}

.pool-done-tag {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  font-size: 22rpx;
  color: #4ade80;
  background: rgba(74, 222, 128, 0.15);
  border: 1rpx solid rgba(74, 222, 128, 0.4);
  border-radius: 999rpx;
  padding: 2rpx 14rpx;
}

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 60rpx 0;
  background: rgba(255, 255, 255, 0.03);
  border: 1rpx dashed rgba(255, 255, 255, 0.15);
  border-radius: 16rpx;
}

.empty-emoji {
  font-size: 64rpx;
}

.empty-text {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.4);
}

.winner-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
}

.winner-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
  min-width: 0;
}

.winner-meta {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0;
}

.winner-name-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.winner-tier-badge {
  font-size: 20rpx;
  padding: 2rpx 10rpx;
  background: rgba(255, 215, 0, 0.15);
  color: #ffd700;
  border-radius: 999rpx;
  font-weight: bold;
  flex-shrink: 0;
}

.winner-name {
  font-size: 28rpx;
  color: white;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.winner-prize-line {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.winner-prize {
  font-size: 26rpx;
  color: #ffd700;
  font-weight: bold;
  flex-shrink: 0;
  margin-left: 12rpx;
}

/* ── 内顶（pre-pick）面板 ──────────── */
.prepick-btn {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: #fff;
  font-size: 24rpx;
  border-radius: 999rpx;
  margin-right: 12rpx;
  padding: 0 18rpx;
  line-height: 48rpx;
  box-shadow: 0 2rpx 8rpx rgba(245, 158, 11, 0.35);
}
.prepick-btn[disabled] {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.4);
  box-shadow: none;
}

.prepicker-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}
.prepicker-card {
  width: 86vw;
  max-width: 720rpx;
  max-height: 80vh;
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.5);
}
.prepicker-header {
  padding: 28rpx 28rpx 12rpx;
}
.prepicker-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #fff;
  display: block;
}
.prepicker-subtitle {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.55);
  margin-top: 8rpx;
  line-height: 1.4;
  display: block;
}
.prepicker-search {
  padding: 12rpx 28rpx;
}
.prepicker-input {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999rpx;
  padding: 12rpx 24rpx;
  color: #fff;
  font-size: 26rpx;
}
.prepicker-list {
  flex: 1;
  min-height: 200rpx;
  max-height: 60vh;
  padding: 0 12rpx;
}
.prepicker-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 18rpx 16rpx;
  border-radius: 16rpx;
  border: 1px solid transparent;
  margin-bottom: 6rpx;
  transition: background 0.15s ease;
}
.prepicker-row:active {
  background: rgba(255, 255, 255, 0.04);
}
.prepicker-row.selected {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.35);
}
.prepicker-row.disabled {
  opacity: 0.4;
  pointer-events: none;
}
.prepicker-info {
  flex: 1;
  min-width: 0;
}
.prepicker-name {
  font-size: 28rpx;
  color: #fff;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.prepicker-sub {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  margin-top: 2rpx;
}
.prepicker-tag-on,
.prepicker-tag-off,
.prepicker-tag-disabled {
  font-size: 22rpx;
  flex-shrink: 0;
}
.prepicker-tag-on {
  color: #f59e0b;
  font-weight: 600;
}
.prepicker-tag-off {
  color: rgba(255, 255, 255, 0.45);
}
.prepicker-tag-disabled {
  color: rgba(255, 255, 255, 0.3);
}
.prepicker-footer {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 18rpx 24rpx 24rpx;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.prepicker-count {
  flex: 1;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
}
.prepicker-clear {
  padding: 12rpx 22rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 999rpx;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.prepicker-confirm {
  padding: 12rpx 26rpx;
  font-size: 26rpx;
  color: #fff;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 999rpx;
  font-weight: 500;
}
</style>
