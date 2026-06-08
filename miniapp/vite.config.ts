import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

export default defineConfig({
  plugins: [uni()],
  server: {
    host: '0.0.0.0',
    // 局域网内测需要：手机用 IP 直接访问 dev server（如 192.168.x.x:5174）
    // Vite 5+ 默认对未知 Host 返回 403，必须显式放行
    // @ts-ignore - uni-app plugin 的 ServerOptions 类型不暴露 allowedHosts，但 Vite 本身支持
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
