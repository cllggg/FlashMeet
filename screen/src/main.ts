import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { initTheme } from './utils/theme';

// 在挂载前应用主题，避免页面 FOUC（无样式闪烁）
initTheme();

const app = createApp(App);
app.use(router);
app.mount('#app');
