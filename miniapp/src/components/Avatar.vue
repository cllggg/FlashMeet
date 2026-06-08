<template>
  <view
    class="avatar"
    :class="[`avatar--${size}`, { 'avatar--big': tier === 'big' }]"
    :style="bgStyle"
  >
    <text v-if="!src" class="avatar-text">{{ initial }}</text>
    <image
      v-else
      :src="src"
      class="avatar-img"
      mode="aspectFill"
      @error="onErr"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    /** 头像 URL */
    src?: string;
    /** 用于生成首字母占位的文字（昵称 / display_id） */
    name?: string;
    /** 档位：normal | big — 改变背景色 */
    tier?: 'normal' | 'big';
    /** 像素尺寸，单位 rpx */
    size?: 'sm' | 'md' | 'lg';
  }>(),
  { size: 'md', tier: 'normal' },
);

/** 拿不到图时回退到首字母 */
const broken = ref(false);

const onErr = () => {
  broken.value = true;
};

const initial = computed(() => {
  const n = (props.name || '?').trim();
  if (!n) return '?';
  // 中文：取首字；英文：取首字母
  const first = n.charAt(0);
  return first.toUpperCase();
});

const bgStyle = computed(() => {
  if (props.tier === 'big') {
    return {
      background:
        'linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%)',
      color: '#0a0a2e',
    };
  }
  // normal 档：用昵称 hash 出一致颜色
  const hue = hashHue(props.name || '');
  return {
    background: `hsl(${hue} 70% 55%)`,
    color: '#fff',
  };
});

const hashHue = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h % 360;
};
</script>

<style scoped>
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  font-weight: bold;
  overflow: hidden;
  box-shadow: 0 0 0 1rpx rgba(255, 255, 255, 0.1);
}

.avatar--sm {
  width: 48rpx;
  height: 48rpx;
  font-size: 24rpx;
}

.avatar--md {
  width: 72rpx;
  height: 72rpx;
  font-size: 32rpx;
}

.avatar--lg {
  width: 96rpx;
  height: 96rpx;
  font-size: 40rpx;
}

.avatar--big {
  box-shadow:
    0 0 0 1rpx rgba(255, 255, 255, 0.2),
    0 0 12rpx rgba(255, 215, 0, 0.6);
}

.avatar-img {
  width: 100%;
  height: 100%;
  display: block;
}

.avatar-text {
  font-family: 'PingFang SC', sans-serif;
  line-height: 1;
}
</style>
