# FlashMeet（聚闪耀）

> 一站式线下/线上活动互动平台。主持人一键创建活动，参与者扫码即可参与**签到 / 摇一摇 / 抽奖 / 破冰 / 匹配 / 匿名聊天**等环节，大屏端同步展示氛围，官网展示产品价值与品牌故事。

---

## 一、项目简介

FlashMeet 是一套面向 **酒吧、团建、年会、婚礼、线上沙龙** 等场景的**活动互动工具**。

- **四端协作**
  - `miniapp` — 参与者手机端（uni-app H5）
  - `screen` — 大屏投影端（Vue 3 + Three.js）
  - `backend` — NestJS API + WebSocket 网关
  - `website` — 官方品牌官网（Nuxt 3，营销/获客/产品介绍）
- **核心能力**
  - 一码签到：扫大屏二维码自动进入活动
  - 实时互动：抽奖、摇一摇、破冰、匹配、匿名聊天
  - 大屏展示：3D 粒子、WebGL 动画、扫码加入
  - 离线兜底：弱网环境下不丢签到、不丢互动
  - 品牌官网：投资人/客户友好的可交互产品介绍页

---

## 二、技术架构

```
┌──────────────┐    HTTP/WS     ┌────────────────────────────────┐
│  miniapp(H5) │ ─────────────► │                                │
│  Vue3+uniapp │  /api          │     Backend (NestJS :3000)     │
│  5174        │  /socket.io    │  ┌──────────────────────────┐  │
└──────────────┘                │  │ Modules:                  │  │
                                │  │  event/checkin/lottery    │  │
┌──────────────┐    HTTP/WS     │  │  icebreaker/match/chat    │  │
│  screen      │ ─────────────► │  │  report/screen/auth       │  │
│  Vue3+Three  │                │  │  gateway/telemetry        │  │
│  5173        │                │  └──────────────────────────┘  │
└──────────────┘                │   │                       │     │
                                │   ▼                       ▼     │
                                │ TypeORM               Socket.IO  │
                                │ (SQLite/Postgres)  (Redis可选用)│
                                └────────────────────────────────┘
```

### 模块清单

| 模块 | 路径 | 职责 |
|---|---|---|
| event | `backend/src/modules/event` | 活动生命周期（创建/状态机/在场用户） |
| checkin | `backend/src/modules/checkin` | 签到 / 标签画像 |
| lottery | `backend/src/modules/lottery` | 抽奖池（Lua 脚本原子扣库存） |
| icebreaker | `backend/src/modules/icebreaker` | 破冰问题发布与答题 |
| match | `backend/src/modules/match` | 匹配 / 社交池 |
| chat | `backend/src/modules/match/chat` | 匿名聊天 |
| screen | `backend/src/modules/screen` | 大屏只读视图接口 |
| report | `backend/src/modules/report` | 活动复盘数据 |
| auth | `backend/src/modules/auth` | 微信/JWT 认证 |
| gateway | `backend/src/modules/gateway` | Socket.IO 房间分发 |
| telemetry | `backend/src/modules/telemetry` | 客户端错误与指标上报 |

### 通信约定

- **REST**：`/api/*`（除 `/e/:event_id` 外都带 `api` 前缀），统一返回 `{ code, message, data }`
- **WebSocket**：`/socket.io`，`event.gateway` 按 `event_id` 分房间
- **JWT**：参与者用 `user_token`（带 display_id），主持人用 `host_token`
- **限流**：默认 `RateLimitGuard` 全局生效，超限返回 `429`

---

## 三、依赖清单

### 运行环境
- Node.js ≥ 20
- npm ≥ 9（或 pnpm/yarn 自选）
- 现代浏览器（Chrome/Edge/Safari，含 WebKit）

### 端口
| 服务 | 端口 | 用途 |
|---|---|---|
| backend | 3000 | API + WebSocket |
| screen | 5173 | 大屏前端 |
| miniapp | 5174 | 参与者 H5 |
| website | 5180 | 官方品牌官网（默认 dev 端口，可改） |

### 后端关键依赖
- NestJS 11
- TypeORM 0.3 + sql.js（SQLite）/ pg（PostgreSQL）
- @nestjs/websockets + socket.io 4
- ioredis 5（可选；`REDIS_ENABLED=false` 时退化为内存）
- class-validator / class-transformer
- JWT（@nestjs/jwt + passport-jwt）
- uuid

### miniapp 关键依赖
- @dcloudio/uni-app 3.x（H5 端）
- Vue 3 + TypeScript
- socket.io-client
- vue-i18n

### screen 关键依赖
- Vue 3 + Vite
- Three.js（3D 粒子背景）
- GSAP（动画）
- qrcode.vue（二维码生成）
- socket.io-client

### website 关键依赖
- Nuxt 3.16+（Vue 3 + Vite + Nitro）
- @nuxtjs/tailwindcss 6
- TypeScript 5.8（strict）
- 零运行时 UI 库：所有动效用 Canvas 2D + CSS 3 自行实现

---

## 四、系统部署

### 1. 同机内测（推荐 / 局域网）

> 适合：演示、酒吧、临时活动现场。

```bash
# 后端
cd backend
npm install
npm run start:dev          # 监听 0.0.0.0:3000，自动打印 LAN IP

# 大屏端
cd screen
npm install
# 修改 .env 中的 VITE_SERVER_URL 为后端 LAN IP
echo 'VITE_SERVER_URL=http://192.168.x.x:3000' > .env
npm run dev                # 监听 0.0.0.0:5173

# 参与者端
cd miniapp
npm install
# 默认走 /api 代理，无需配置
npm run dev:h5             # 监听 0.0.0.0:5174，allowedHosts: true

# 官网（可选，纯营销/演示页，与业务无强耦合）
cd website
npm install
npm run dev -- --port 5180 # 监听 0.0.0.0:5180
```

启动成功后：
- 大屏端：访问 `http://<LAN_IP>:5173`
- 手机扫码：自动进入 `http://<LAN_IP>:5174/#/pages/user/checkin?event_id=xxx`
- 官网：访问 `http://<LAN_IP>:5180`

### 2. 生产环境

```bash
# 1. 编译
cd backend && npm run build        # 产物 dist/
cd screen && npm run build         # 产物 dist/
cd miniapp && npm run build:h5     # 产物 dist/build/h5/
cd website && npm run generate     # 产物 .output/public/（纯静态站）

# 2. 部署后端（建议 systemd/pm2）
NODE_ENV=production \
DB_TYPE=postgres \
DB_HOST=... DB_PORT=5432 \
DB_USERNAME=... DB_PASSWORD=... \
REDIS_ENABLED=true \
REDIS_URL=redis://... \
JWT_SECRET=<强随机> \
node dist/main.js

# 3. 部署大屏端（nginx 静态托管）
server {
  listen 80;
  root /www/screen/dist;
  try_files $uri $uri/ /index.html;
}

# 4. 部署 miniapp H5（同上）
server {
  listen 80;
  root /www/miniapp/dist/build/h5;
  try_files $uri $uri/ /index.html;
}

# 5. 部署官网（同上，产物在 .output/public）
server {
  listen 80;
  root /www/website/.output/public;
  try_files $uri $uri/ /index.html;
}
```

> **官网推荐托管**：Vercel / Cloudflare Pages / 阿里云 OSS + CDN，零运维。
> GitHub Action 一行 `pnpm generate && wrangler pages deploy .output/public` 即可。

### 3. 数据库选型

| 类型 | 适用 | 配置 |
|---|---|---|
| SQLite (sql.js) | 内测 / 单机 | `DB_TYPE=sqlite` `DB_NAME=flashmeet.sqlite` |
| PostgreSQL | 生产 / 多机 | `DB_TYPE=postgres` + DB_HOST/PORT/USERNAME/PASSWORD |
| Redis | 生产 / 分布式抽奖库存 | `REDIS_ENABLED=true` `REDIS_URL=redis://...` |

---

## 五、程序启动

### 启动顺序

1. **后端先启** — screen / miniapp 启动后要连 3000
2. **screen / miniapp 任意顺序** — 都连后端
3. **website 完全独立** — 纯静态站，可独立部署，与业务无耦合

### 常用命令

```bash
# 一次性清掉旧进程
pkill -f "nest start" ; pkill -f "vite" ; pkill -f "nuxt dev"

# 启动后端
cd backend && nohup npm run start:dev > /tmp/backend.log 2>&1 &

# 启动大屏
cd screen && nohup npm run dev > /tmp/screen.log 2>&1 &

# 启动 miniapp
cd miniapp && nohup npm run dev:h5 > /tmp/miniapp.log 2>&1 &

# 启动官网（可选）
cd website && nohup npm run dev -- --port 5180 > /tmp/website.log 2>&1 &

# 健康检查
curl http://localhost:3000/api/health
curl -sI http://localhost:5180 | head -1
```

### 验证清单

- [ ] `http://<LAN_IP>:3000/api/health` 返回 `{"status":"ok"}`
- [ ] `http://<LAN_IP>:5173/` 返回 200
- [ ] `http://<LAN_IP>:5174/` 返回 200
- [ ] `http://<LAN_IP>:5180/` 返回 200（官网，可选）
- [ ] 大屏端创建活动 → 显示二维码
- [ ] 手机扫码 → 自动进入 checkin 页 → 签到成功

### 类型检查 & 测试

```bash
# backend
cd backend && npm run lint && npm test

# miniapp
cd miniapp && npm run type-check && npm test

# screen
cd screen && npx vue-tsc --noEmit && npx vitest run

# website
cd website && npx nuxt typecheck
```

---

## 六、项目运维

### 1. 日常巡检

| 项 | 频率 | 命令 |
|---|---|---|
| 后端进程 | 实时 | `curl http://localhost:3000/api/health` |
| 端口占用 | 实时 | `lsof -i:3000,5173,5174` |
| 后端日志 | 实时 | `tail -f /tmp/backend.log` |
| 数据库体积 | 每日 | `du -sh backend/flashmeet.sqlite` |
| WebSocket 连接数 | 每日 | 查 backend 日志 `[EventGateway] room_size` |

### 2. 常见故障

| 现象 | 排查 |
|---|---|
| 手机扫码进不去 | 1. 手机和大屏是否同 Wi-Fi；2. 后端 LAN IP 是否变；3. screen `.env` 中 `VITE_SERVER_URL` 是否更新 |
| 抽奖库存不扣 | 检查 Redis 状态：`REDIS_ENABLED` 开关；`iostat` 看是否有 LOCK |
| WebSocket 频繁断连 | 看 `[EventGateway]` 日志；网络状态走 `NetBanner` 提示 |
| input 输入框无法输入 | 检查 `miniapp/src/styles/design-tokens.css` 中 `uni-input` 修复 CSS 是否被覆盖 |
| 401 反复出现 | JWT_SECRET 是否变更；`user_token` 是否过期（默认 7d） |

### 3. 关键配置

| 文件 | 关键变量 |
|---|---|
| `backend/.env` | `DB_TYPE` / `DB_NAME` / `REDIS_ENABLED` / `JWT_SECRET` / `APP_PORT` |
| `screen/.env` | `VITE_SERVER_URL` |
| `miniapp/.env` | `VITE_API_BASE`（默认 `/api` 走 vite 代理） |
| `backend/src/modules/screen/screen.controller.ts` | `SCREEN_JOIN_URL`（可选，强制后端生成完整 URL） |

### 4. 数据备份

```bash
# SQLite 备份（停服后拷贝最稳）
cp backend/flashmeet.sqlite backup/flashmeet-$(date +%F).sqlite

# PostgreSQL 备份
pg_dump -U postgres flashmeet > backup/flashmeet-$(date +%F).sql
```

### 5. 升级流程

```bash
# 拉代码
git pull

# 重新装依赖
(cd backend && npm install)
(cd screen && npm install)
(cd miniapp && npm install)
(cd website && npm install)

# 重启服务
pkill -f "nest start" ; pkill -f "vite" ; pkill -f "nuxt dev"
# 然后按「程序启动」一节再启一次
```

### 6. 监控指标（轻量）

- `GET /api/health` — 进程存活 + DB / Redis 健康
- `GET /api/telemetry/summary?event_id=...` — 单场活动的客户端错误 / 操作量
- `GET /api/telemetry/errors?event_id=...` — 错误明细
- `GET /api/report/event/:event_id` — 活动复盘（签到率、互动率、抽奖分布、匹配成功率）

### 7. 应急开关

| 场景 | 操作 |
|---|---|
| 主持人误开抽奖 | `POST /api/event/:id/scene` 切回 `STANDBY` |
| 房间被刷 | 提高 `RateLimitGuard` 阈值或临时开启 IP 白名单 |
| WebSocket 雪崩 | `pkill -SIGUSR2` 让 NestJS 重新分配端口 |

---

## 七、目录速查

```
FlashMeet/
├── backend/                NestJS API + WebSocket
│   ├── src/
│   │   ├── common/         中间件/守卫/拦截器/工具
│   │   ├── modules/        业务模块
│   │   ├── app.module.ts   根模块
│   │   └── main.ts         入口（自动打印 LAN IP）
│   └── .env
├── miniapp/                参与者 H5（uni-app）
│   ├── src/
│   │   ├── pages/host/     主持人：create-event / dashboard / lottery-manage / icebreaker-manage
│   │   ├── pages/user/     参与者：checkin / lottery / shake / match / chat / icebreaker / profile
│   │   ├── services/       request / socket / api
│   │   ├── styles/         design-tokens.css
│   │   └── App.vue
│   └── vite.config.ts      allowedHosts: true（局域网 IP 访问）
├── screen/                 大屏端
│   ├── src/
│   │   ├── views/          HomeView / EventScreen
│   │   ├── components/     场景组件（3D / 动画 / 二维码）
│   │   └── services/       api / socket
│   └── vite.config.ts
├── website/                官方品牌官网（Nuxt 3）
│   ├── app.vue             入口
│   ├── pages/index.vue     主页（Hero/Value/Playground/Metrics/Scenarios/Highlights/Trust/Cta/Footer）
│   ├── components/         各 section 组件 + StarField（Canvas 星空）
│   ├── composables/        useReveal / useCountUp
│   ├── assets/css/main.css 设计 token + 玻璃拟态 + 滚动揭示
│   ├── nuxt.config.ts      SEO meta + OG + components 自动导入
│   ├── tailwind.config.ts
│   └── package.json
└── README.md               本文件
```

---

## 八、官网（`website/`）专题

> 投资人/潜在客户友好型产品官网。与业务完全解耦，可独立部署到任何静态托管。

### 页面结构

| Section | 组件 | 作用 |
|---|---|---|
| Hero | `HeroSection` | 沉浸式 Canvas 星空 + 渐变大字 + 实时活动计数 |
| 核心价值 | `ValueSection` | 打破尴尬 / 激活参与 / 沉淀资产 三列 |
| 核心玩法 | `PlaygroundSection` | **4 个可交互 demo**（抽奖/摇一摇/匹配/签到） |
| 数据 | `MetricsSection` | 动态数字滚动 + 性能基线进度条 |
| 场景 | `ScenarioSection` | 校园/团建/峰会/派对/商场/婚礼 6 卡 |
| 技术护城河 | `HighlightsSection` | 三端协同 / Lua 原子 / WS 幂等 / 弱网兜底等 6 项 |
| 客户 | `TrustSection` | 合作伙伴占位 |
| CTA | `CtaSection` | 预约演示 / 联系 |
| Footer | `SiteFooter` | 链接 + 版权 |

### 关键文件

- `components/StarField.vue` — Canvas 2D 沉浸星空（350+ 粒子 + 鼠标交互 + 流星）
- `composables/useReveal.ts` — 滚动揭示动画（IntersectionObserver）
- `composables/useCountUp.ts` — 数字滚动动画
- `assets/css/main.css` — 设计 token + 渐变文字 + 玻璃拟态 + 工具类

### 启动 / 构建

```bash
cd website
npm install
npm run dev -- --port 5180  # 开发
npm run generate            # 静态站产物在 .output/public/
```

### 部署推荐

- **Cloudflare Pages**：仓库绑定后自动构建，0 成本
- **Vercel**：零配置，PR Preview
- **阿里云 OSS + CDN**：国内访问快
- **GitHub Pages**：免费但国内慢

### SEO / 分享

已内置：
- `<title>` / `<meta name="description">`
- OG 元信息（`og:title` / `og:description` / `og:type`）
- 移动端 viewport / theme-color
- `html lang="zh-CN"`

如需百度收录：单独建 `sitemap.xml` + `robots.txt`，提交到百度站长平台。

---

## 九、版权

- 项目当前阶段：**内测版**
- 开发者：[liyijia]
- 合作微信：【cllggg】
