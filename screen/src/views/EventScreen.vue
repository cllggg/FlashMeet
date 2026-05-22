<template>
  <div class="event-screen">
    <!-- FPS Warning -->
    <div v-if="showFpsWarning" class="fps-warning">
      检测到设备性能较低，已自动切换为2D模式
    </div>

    <!-- State: STANDBY -->
    <StandbyScene v-if="currentState === EventStatus.STANDBY" :event="event" />

    <!-- State: CHECKIN -->
    <CheckinScene
      v-else-if="currentState === EventStatus.CHECKIN"
      :event="event"
      :checkin-users="checkinUsers"
      :use-3-d="use3D"
      @update:checkin-users="onNewCheckin"
    />

    <!-- State: LOTTERY_READY -->
    <LotteryReadyScene v-else-if="currentState === EventStatus.LOTTERY_READY" :event="event" />

    <!-- State: LOTTERY_RUNNING -->
    <LotteryRunningScene
      v-else-if="currentState === EventStatus.LOTTERY_RUNNING"
      :winners="winners"
    />

    <!-- State: GAME_SHAKE -->
    <ShakeGameScene v-else-if="currentState === EventStatus.GAME_SHAKE" :leaderboard="shakeLeaderboard" />

    <!-- State: ENDED -->
    <EndedScene v-else-if="currentState === EventStatus.ENDED" :event="event" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { EventStatus, WsEvent } from '../types/enums';
import { socketService } from '../services/socket';
import { FpsDetector } from '../utils/fps-detector';
import api from '../services/api';
import StandbyScene from '../components/StandbyScene.vue';
import CheckinScene from '../components/CheckinScene.vue';
import LotteryReadyScene from '../components/LotteryReadyScene.vue';
import LotteryRunningScene from '../components/LotteryRunningScene.vue';
import ShakeGameScene from '../components/ShakeGameScene.vue';
import EndedScene from '../components/EndedScene.vue';

const route = useRoute();
const eventId = route.params.eventId as string;

const currentState = ref<EventStatus>(EventStatus.STANDBY);
const event = ref<any>({});
const checkinUsers = ref<any[]>([]);
const winners = ref<any[]>([]);
const shakeLeaderboard = ref<any[]>([]);
const use3D = ref(true);
const showFpsWarning = ref(false);
let pollTimer: ReturnType<typeof setInterval> | null = null;

const onSceneUpdated = (data: { state: EventStatus; event_id: string }) => {
  currentState.value = data.state;
  console.log('Scene updated:', data.state);
};

const onNewCheckin = (data: any) => {
  checkinUsers.value.push(data.user);
};

const onShakeLeaderboard = (data: any) => {
  shakeLeaderboard.value = data.leaderboard;
};

const onLotteryWinner = (data: any) => {
  winners.value.push(data.winner);
};

const loadInitialData = async () => {
  try {
    const { data } = await api.get(`/screen/event/${eventId}`);
    if (!data) {
      console.error('Event not found');
      return;
    }
    event.value = data;
    currentState.value = data.current_state;

    const { data: checkins } = await api.get(`/screen/event/${eventId}/checkins`);
    checkinUsers.value = checkins || [];

    const { data: wonRecords } = await api.get(`/screen/event/${eventId}/winners`);
    winners.value = wonRecords || [];
  } catch (err) {
    console.error('Failed to load event:', err);
  }
};

const pollCheckins = async () => {
  try {
    const { data } = await api.get(`/screen/event/${eventId}/checkins`);
    if (data && data.length !== checkinUsers.value.length) {
      checkinUsers.value = data;
    }
  } catch {}
};

onMounted(async () => {
  await loadInitialData();

  const detector = new FpsDetector();
  const canUse3D = await detector.startDetection();
  if (!canUse3D) {
    use3D.value = false;
    showFpsWarning.value = true;
    setTimeout(() => (showFpsWarning.value = false), 3000);
  }

  socketService.connect(eventId);
  socketService.onSceneUpdated(onSceneUpdated);
  socketService.onUserCheckedIn(onNewCheckin);
  socketService.onShakeLeaderboard(onShakeLeaderboard);
  socketService.onLotteryWinner(onLotteryWinner);

  pollTimer = setInterval(pollCheckins, 5000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
  socketService.off(WsEvent.SCENE_UPDATED);
  socketService.off(WsEvent.USER_CHECKED_IN);
  socketService.off(WsEvent.SHAKE_LEADERBOARD_TICK);
  socketService.off(WsEvent.LOTTERY_WINNER_ANNOUNCE);
  socketService.disconnect();
});
</script>

<style scoped>
.event-screen {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.fps-warning {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 152, 0, 0.9);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  z-index: 9999;
  font-size: 16px;
}
</style>
