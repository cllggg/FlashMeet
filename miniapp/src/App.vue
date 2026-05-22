<script setup lang="ts">
import { onLaunch } from "@dcloudio/uni-app";

onLaunch(() => {
  console.log("FlashMeet MiniApp Launch");
  // Check if user is logged in
  const token = uni.getStorageSync('flashmeet_token');
  if (!token) {
    uni.reLaunch({ url: '/pages/login/index' });
  }
});
</script>

<style>
page {
  background-color: #0a0a2e;
  color: #ffffff;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
</style>
