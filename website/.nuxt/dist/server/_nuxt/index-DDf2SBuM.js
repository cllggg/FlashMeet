import { defineComponent, ref, mergeProps, useSSRContext, unref, reactive } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderStyle, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrIncludeBooleanAttr } from "vue/server-renderer";
import "/Users/liyijia/Create/FlashMeet/website/node_modules/hookable/dist/index.mjs";
import { _ as _export_sfc } from "../server.mjs";
import "/Users/liyijia/Create/FlashMeet/website/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/Users/liyijia/Create/FlashMeet/website/node_modules/unctx/dist/index.mjs";
import "/Users/liyijia/Create/FlashMeet/website/node_modules/h3/dist/index.mjs";
import "vue-router";
import "/Users/liyijia/Create/FlashMeet/website/node_modules/defu/dist/defu.mjs";
import "/Users/liyijia/Create/FlashMeet/website/node_modules/ufo/dist/index.mjs";
const _sfc_main$a = /* @__PURE__ */ defineComponent({
  __name: "StarField",
  __ssrInlineRender: true,
  setup(__props) {
    const canvasRef = ref(null);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<canvas${ssrRenderAttrs(mergeProps({
        ref_key: "canvasRef",
        ref: canvasRef,
        class: "absolute inset-0 w-full h-full",
        style: { pointerEvents: "auto" },
        "aria-hidden": "true"
      }, _attrs))}></canvas>`);
    };
  }
});
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/StarField.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
const _sfc_main$9 = /* @__PURE__ */ defineComponent({
  __name: "HeroSection",
  __ssrInlineRender: true,
  setup(__props) {
    const liveEvents = ref(38);
    const quickStats = [
      { value: "30s", label: "扫码即用" },
      { value: "10K+", label: "并发互动" },
      { value: "50+", label: "覆盖城市" },
      { value: "4.9/5", label: "用户评分" }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_StarField = _sfc_main$a;
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "relative min-h-screen flex items-center justify-center overflow-hidden" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_StarField, { class: "absolute inset-0" }, null, _parent));
      _push(`<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-30 blur-3xl pointer-events-none" style="${ssrRenderStyle({ "background": "radial-gradient(circle, rgba(102, 126, 234, 0.5) 0%, transparent 60%)" })}"></div><div class="relative z-10 max-w-6xl mx-auto px-6 py-24 text-center"><div data-reveal class="fm-reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur mb-8 text-sm text-white/70"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 fm-pulse-glow"></span> 正在为 <span class="text-emerald-300 fm-tabular">${ssrInterpolate(unref(liveEvents))}</span> 场活动提供支持 </div><h1 data-reveal class="fm-reveal fm-reveal-delay-1 text-6xl md:text-8xl font-bold tracking-tight leading-[1.05] mb-6"><span class="fm-text-gradient-rainbow">聚闪耀</span><span class="text-white/90 ml-3">FlashMeet</span></h1><p data-reveal class="fm-reveal fm-reveal-delay-2 text-xl md:text-2xl text-white/60 mb-3"> 计算相遇的概率，渲染心动的瞬间 </p><p data-reveal class="fm-reveal fm-reveal-delay-3 text-base md:text-lg text-white/40 max-w-2xl mx-auto mb-12"> 线下聚会互动大屏系统：扫码签到、星系上墙、实时互动游戏、智能匹配。 <br class="hidden md:block"> 让 30 秒破冰不再只是传说，让每一场聚会都闪耀。 </p><div data-reveal class="fm-reveal fm-reveal-delay-4 flex flex-col sm:flex-row gap-4 justify-center items-center"><a class="fm-btn fm-btn-primary" href="#playground"> 立即体验 Demo <span class="ml-2">→</span></a><a class="fm-btn fm-btn-ghost" href="#scenarios"> 了解应用场景 </a></div><div data-reveal class="fm-reveal fm-reveal-delay-4 mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 text-left"><!--[-->`);
      ssrRenderList(quickStats, (m) => {
        _push(`<div class="border-l border-white/10 pl-4"><div class="text-2xl md:text-3xl font-bold fm-text-gradient fm-tabular">${ssrInterpolate(m.value)}</div><div class="text-xs text-white/40 mt-1">${ssrInterpolate(m.label)}</div></div>`);
      });
      _push(`<!--]--></div></div><div class="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-sm flex flex-col items-center gap-2 animate-bounce"><span>向下探索</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 13l5 5 5-5M7 6l5 5 5-5"></path></svg></div></section>`);
    };
  }
});
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/HeroSection.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const _sfc_main$8 = /* @__PURE__ */ defineComponent({
  __name: "ValueSection",
  __ssrInlineRender: true,
  setup(__props) {
    const values = [
      {
        icon: "⚡",
        title: "打破尴尬",
        desc: '30 秒破冰不再是传说。我们用游戏化机制把"破冰"从心理门槛变成视觉冲击。',
        bg: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
        bullets: [
          "扫码即参与，零下载",
          "渐进式画像，越玩越懂你",
          "大屏视觉冲击，让冷场变爆点"
        ]
      },
      {
        icon: "🚀",
        title: "激活参与",
        desc: '从"低头族"到"全场焦点"。让每一个参与者都有戏，让主持人不再尬场。',
        bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        bullets: [
          "万人并发不卡",
          "实时排行，激发竞争心",
          "副场控无缝接管，不怕断网"
        ]
      },
      {
        icon: "💎",
        title: "沉淀资产",
        desc: "不只是娱乐，更是用户画像与社交关系。活动结束，资产留得住。",
        bg: "linear-gradient(135deg, #4fc3f7 0%, #66bb6a 100%)",
        bullets: [
          "数字成就卡裂变传播",
          "延时社交池，活动后仍可破冰",
          "复盘数据看板，量化活动 ROI"
        ]
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "relative py-32" }, _attrs))}><div class="max-w-6xl mx-auto px-6"><div data-reveal class="fm-reveal text-center mb-20"><p class="text-sm text-white/40 tracking-[0.3em] uppercase mb-4">Why FlashMeet</p><h2 class="text-5xl md:text-6xl font-bold mb-6"> 为什么主办方选择 <span class="fm-text-gradient">我们</span></h2><p class="text-white/50 text-lg max-w-2xl mx-auto"> 不止是娱乐工具，更是用户增长与社交资产沉淀的操作系统。 </p></div><div class="grid md:grid-cols-3 gap-6"><!--[-->`);
      ssrRenderList(values, (v, i) => {
        _push(`<div data-reveal class="${ssrRenderClass([`fm-reveal-delay-${i + 1}`, "fm-reveal fm-glass p-8 group"])}"><div class="text-xs text-white/30 fm-tabular mb-4">0${ssrInterpolate(i + 1)}</div><div class="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3" style="${ssrRenderStyle({
          background: v.bg,
          boxShadow: "0 8px 24px -8px rgba(0,0,0,0.4)"
        })}">${ssrInterpolate(v.icon)}</div><h3 class="text-2xl font-bold mb-3">${ssrInterpolate(v.title)}</h3><p class="text-white/55 leading-relaxed mb-6">${ssrInterpolate(v.desc)}</p><ul class="space-y-2"><!--[-->`);
        ssrRenderList(v.bullets, (b) => {
          _push(`<li class="flex items-start gap-2 text-sm text-white/60"><span class="text-emerald-400 mt-0.5">✓</span><span>${ssrInterpolate(b)}</span></li>`);
        });
        _push(`<!--]--></ul></div>`);
      });
      _push(`<!--]--></div></div></section>`);
    };
  }
});
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ValueSection.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const _sfc_main$7 = /* @__PURE__ */ defineComponent({
  __name: "PlaygroundSection",
  __ssrInlineRender: true,
  setup(__props) {
    const lotteryWinner = ref(null);
    const lotterySpinning = ref(false);
    const lotteryHint = ref("点击下方按钮抽一次");
    ref(0);
    const shakeScore = ref(0);
    const matching = ref(false);
    const matchMatched = ref(false);
    const matchStyle = reactive({ left: "", right: "" });
    const signinDots = ref([]);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({
        id: "playground",
        class: "relative py-32 overflow-hidden"
      }, _attrs))} data-v-c312d3a1><div class="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 pointer-events-none" style="${ssrRenderStyle({ "background": "radial-gradient(circle, #764ba2 0%, transparent 60%)" })}" data-v-c312d3a1></div><div class="max-w-6xl mx-auto px-6" data-v-c312d3a1><div data-reveal class="fm-reveal text-center mb-20" data-v-c312d3a1><p class="text-sm text-white/40 tracking-[0.3em] uppercase mb-4" data-v-c312d3a1>Core Playgrounds</p><h2 class="text-5xl md:text-6xl font-bold mb-6" data-v-c312d3a1><span class="fm-text-gradient" data-v-c312d3a1>四大核心玩法</span></h2><p class="text-white/50 text-lg max-w-2xl mx-auto" data-v-c312d3a1> 点击下方任意一个 demo，立即体验。每一个都已经在数千场真实活动中跑通。 </p></div><div class="grid md:grid-cols-2 gap-6" data-v-c312d3a1><div data-reveal class="fm-reveal fm-glass p-8 cursor-pointer" data-v-c312d3a1><div class="flex items-center gap-3 mb-4" data-v-c312d3a1><span class="text-3xl" data-v-c312d3a1>🎰</span><h3 class="text-xl font-bold" data-v-c312d3a1>互动抽奖</h3></div><p class="text-white/50 text-sm mb-6" data-v-c312d3a1>原子性库存扣减，防超发防刷票。手机震动反馈，大屏实时滚动。</p><div class="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-white/5 flex items-center justify-center" data-v-c312d3a1>`);
      if (unref(lotteryWinner)) {
        _push(`<div class="text-3xl font-bold fm-text-gradient-rainbow" data-v-c312d3a1>${ssrInterpolate(unref(lotteryWinner))}</div>`);
      } else {
        _push(`<div class="text-white/40 text-sm" data-v-c312d3a1>${ssrInterpolate(unref(lotteryHint))}</div>`);
      }
      _push(`</div><button class="${ssrRenderClass([unref(lotterySpinning) ? "bg-white/5 text-white/40 cursor-not-allowed" : "bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white", "mt-4 w-full py-2 rounded-lg text-sm font-semibold transition"])}"${ssrIncludeBooleanAttr(unref(lotterySpinning)) ? " disabled" : ""} data-v-c312d3a1>${ssrInterpolate(unref(lotterySpinning) ? "抽奖中…" : "点我抽一次")}</button></div><div data-reveal class="fm-reveal fm-reveal-delay-1 fm-glass p-8 cursor-pointer" data-v-c312d3a1><div class="flex items-center gap-3 mb-4" data-v-c312d3a1><span class="text-3xl" data-v-c312d3a1>📱</span><h3 class="text-xl font-bold" data-v-c312d3a1>摇一摇大赛</h3></div><p class="text-white/50 text-sm mb-6" data-v-c312d3a1>全场同频竞技，500ms 实时排行。突破社交冷场，瞬间点燃全场。</p><div class="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-cyan-900/40 to-emerald-900/40 border border-white/5 flex flex-col items-center justify-center" data-v-c312d3a1><div class="text-5xl font-bold fm-text-gradient-cool fm-tabular" data-v-c312d3a1>${ssrInterpolate(unref(shakeScore))}</div><div class="text-white/40 text-xs mt-2" data-v-c312d3a1>点击累积分数（模拟加速度计）</div></div><button class="mt-4 w-full py-2 rounded-lg text-sm font-semibold transition bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-90 text-white" data-v-c312d3a1> 点击摇一下 </button></div><div data-reveal class="fm-reveal fm-reveal-delay-2 fm-glass p-8 cursor-pointer" data-v-c312d3a1><div class="flex items-center gap-3 mb-4" data-v-c312d3a1><span class="text-3xl" data-v-c312d3a1>💫</span><h3 class="text-xl font-bold" data-v-c312d3a1>CP 盲盒匹配</h3></div><p class="text-white/50 text-sm mb-6" data-v-c312d3a1>基于标签雷达的智能匹配，双盲破冰保护隐私。</p><div class="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-rose-900/40 to-orange-900/40 border border-white/5 flex items-center justify-center" data-v-c312d3a1><div class="flex items-center gap-4" data-v-c312d3a1><div class="${ssrRenderClass([unref(matchMatched) ? "bg-rose-500/30" : "bg-white/10", "w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-700"])}" style="${ssrRenderStyle(unref(matchStyle).left)}" data-v-c312d3a1> 👩 </div>`);
      if (unref(matchMatched)) {
        _push(`<div class="text-rose-400 text-2xl" data-v-c312d3a1>💕</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="${ssrRenderClass([unref(matchMatched) ? "bg-rose-500/30" : "bg-white/10", "w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-700"])}" style="${ssrRenderStyle(unref(matchStyle).right)}" data-v-c312d3a1> 🧑 </div></div></div><button class="${ssrRenderClass([unref(matching) ? "bg-white/5 text-white/40 cursor-not-allowed" : "bg-gradient-to-r from-rose-500 to-orange-500 hover:opacity-90 text-white", "mt-4 w-full py-2 rounded-lg text-sm font-semibold transition"])}"${ssrIncludeBooleanAttr(unref(matching)) ? " disabled" : ""} data-v-c312d3a1>${ssrInterpolate(unref(matching) ? "匹配中…" : unref(matchMatched) ? "再来一组" : "开始匹配")}</button></div><div data-reveal class="fm-reveal fm-reveal-delay-3 fm-glass p-8 cursor-pointer" data-v-c312d3a1><div class="flex items-center gap-3 mb-4" data-v-c312d3a1><span class="text-3xl" data-v-c312d3a1>🌌</span><h3 class="text-xl font-bold" data-v-c312d3a1>星系签到</h3></div><p class="text-white/50 text-sm mb-6" data-v-c312d3a1>扫码秒级上墙，化作暗星飞入星系。渐进式画像游戏化收集标签。</p><div class="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-900/60 to-violet-900/60 border border-white/5" data-v-c312d3a1><!--[-->`);
      ssrRenderList(unref(signinDots), (p, i) => {
        _push(`<div class="absolute w-2 h-2 rounded-full bg-cyan-300" style="${ssrRenderStyle({
          left: `${p.x}%`,
          top: `${p.y}%`,
          opacity: p.o,
          transform: `scale(${p.s})`,
          transition: "all 0.4s",
          boxShadow: "0 0 8px rgba(79, 195, 247, 0.8)"
        })}" data-v-c312d3a1></div>`);
      });
      _push(`<!--]--><div class="absolute bottom-2 right-3 text-xs text-white/40" data-v-c312d3a1>${ssrInterpolate(unref(signinDots).length)} 颗星已点亮 </div></div><button class="mt-4 w-full py-2 rounded-lg text-sm font-semibold transition bg-gradient-to-r from-indigo-500 to-violet-500 hover:opacity-90 text-white" data-v-c312d3a1> 点亮我的星 </button></div></div></div></section>`);
    };
  }
});
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PlaygroundSection.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["__scopeId", "data-v-c312d3a1"]]);
function useCountUp(getTarget, durationMs = 1800) {
  const value = ref(0);
  return value;
}
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "MetricsSection",
  __ssrInlineRender: true,
  setup(__props) {
    const metrics = [
      { value: 1280, suffix: "+", label: "累计活动场次", note: "覆盖 50+ 城市" },
      { value: 48, suffix: "K+", label: "累计签到用户", note: "内测期数据" },
      { value: 1e4, suffix: "+", label: "单场并发互动", note: "WebSocket 压测峰值" },
      { value: 99, suffix: "%", label: "签到成功率", note: "弱网 5s 兜底" }
    ];
    const m0 = useCountUp();
    const m1 = useCountUp();
    const m2 = useCountUp();
    const m3 = useCountUp();
    const live = [m0, m1, m2, m3];
    const displayValue = (_, i) => {
      const v = live[i].value;
      if (v >= 1e3) return v.toLocaleString();
      return v;
    };
    const perfBars = [
      { label: "签到响应 P99", value: "< 80ms", w: 92, color: "linear-gradient(90deg, #66bb6a, #4fc3f7)" },
      { label: "WebSocket 消息延迟", value: "< 120ms", w: 88, color: "linear-gradient(90deg, #4fc3f7, #667eea)" },
      { label: "抽奖并发吞吐", value: "5K QPS", w: 96, color: "linear-gradient(90deg, #667eea, #764ba2)" },
      { label: "大屏 FPS（3D 模式）", value: "60 FPS", w: 100, color: "linear-gradient(90deg, #764ba2, #f093fb)" }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "relative py-32" }, _attrs))}><div class="max-w-6xl mx-auto px-6"><div data-reveal class="fm-reveal text-center mb-20"><p class="text-sm text-white/40 tracking-[0.3em] uppercase mb-4">By the Numbers</p><h2 class="text-5xl md:text-6xl font-bold mb-6"> 数据 <span class="fm-text-gradient-cool">不说谎</span></h2><p class="text-white/50 text-lg max-w-2xl mx-auto"> 从内测到生产环境，每一个数字都来自真实运行。 </p></div><div class="grid grid-cols-2 md:grid-cols-4 gap-6" data-countup><!--[-->`);
      ssrRenderList(metrics, (m, i) => {
        _push(`<div data-reveal class="${ssrRenderClass([`fm-reveal-delay-${i % 4 + 1}`, "fm-reveal fm-glass p-6 text-center"])}"><div class="text-4xl md:text-5xl font-bold fm-text-gradient fm-tabular mb-2">${ssrInterpolate(displayValue(m, i))}${ssrInterpolate(m.suffix)}</div><div class="text-sm text-white/55">${ssrInterpolate(m.label)}</div><div class="text-xs text-white/30 mt-2">${ssrInterpolate(m.note)}</div></div>`);
      });
      _push(`<!--]--></div><div data-reveal class="fm-reveal mt-16 fm-glass p-8"><h3 class="text-lg font-bold mb-6 text-white/80">⚡ 性能基线（生产环境）</h3><div class="space-y-5"><!--[-->`);
      ssrRenderList(perfBars, (bar) => {
        _push(`<div><div class="flex justify-between text-sm mb-2"><span class="text-white/70">${ssrInterpolate(bar.label)}</span><span class="text-white/90 fm-tabular font-semibold">${ssrInterpolate(bar.value)}</span></div><div class="h-2 rounded-full bg-white/5 overflow-hidden"><div class="h-full rounded-full transition-all duration-1000" style="${ssrRenderStyle({
          width: bar.w + "%",
          background: bar.color,
          boxShadow: `0 0 12px ${bar.color}`
        })}"></div></div></div>`);
      });
      _push(`<!--]--></div></div></div></section>`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/MetricsSection.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "ScenarioSection",
  __ssrInlineRender: true,
  setup(__props) {
    const scenarios = [
      {
        icon: "🎓",
        title: "校园迎新",
        desc: "让新生不再社恐，从入学的第一晚就找到归属感。",
        tag: "Edu",
        glow: "rgba(102, 126, 234, 0.4)",
        tags: ["破冰", "破圈", "校园"]
      },
      {
        icon: "🏢",
        title: "企业团建",
        desc: "让 HR 头疼的破冰游戏终于有解，团建效果可量化。",
        tag: "Corp",
        glow: "rgba(102, 126, 234, 0.4)",
        tags: ["破冰", "数据", "ROI"]
      },
      {
        icon: "💼",
        title: "行业峰会",
        desc: '精准人脉匹配，让"加微信"变成"聊得来"。',
        tag: "Biz",
        glow: "rgba(79, 195, 247, 0.4)",
        tags: ["匹配", "人脉", "沉淀"]
      },
      {
        icon: "🎉",
        title: "私人派对",
        desc: "让派对燃到爆，宾客参与度拉满，朋友圈素材管够。",
        tag: "Party",
        glow: "rgba(255, 107, 107, 0.4)",
        tags: ["娱乐", "氛围", "传播"]
      },
      {
        icon: "🛍️",
        title: "商场开业",
        desc: "吸睛引流转化一体，把路人变成粉丝。",
        tag: "Retail",
        glow: "rgba(255, 215, 0, 0.4)",
        tags: ["引流", "转化", "品牌"]
      },
      {
        icon: "💒",
        title: "婚礼互动",
        desc: "宾客不再只顾低头吃饭，参与感拉满，祝福更走心。",
        tag: "Wedding",
        glow: "rgba(240, 147, 251, 0.4)",
        tags: ["祝福", "互动", "温情"]
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({
        id: "scenarios",
        class: "relative py-32 overflow-hidden"
      }, _attrs))}><div class="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-15 pointer-events-none" style="${ssrRenderStyle({ "background": "radial-gradient(circle, #ff6b6b 0%, transparent 60%)" })}"></div><div class="max-w-6xl mx-auto px-6"><div data-reveal class="fm-reveal text-center mb-20"><p class="text-sm text-white/40 tracking-[0.3em] uppercase mb-4">Scenarios</p><h2 class="text-5xl md:text-6xl font-bold mb-6"><span class="fm-text-gradient-warm">六大落地场景</span></h2><p class="text-white/50 text-lg max-w-2xl mx-auto"> 从校园迎新到企业团建，从行业沙龙到私人派对，每一场聚会都能被重新定义。 </p></div><div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6"><!--[-->`);
      ssrRenderList(scenarios, (s, i) => {
        _push(`<div data-reveal class="${ssrRenderClass([`fm-reveal-delay-${i % 4 + 1}`, "fm-reveal fm-glass p-7 group relative overflow-hidden"])}"><div class="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style="${ssrRenderStyle({ background: `radial-gradient(circle at 50% 0%, ${s.glow} 0%, transparent 70%)` })}"></div><div class="relative"><div class="flex items-start justify-between mb-4"><div class="text-5xl group-hover:scale-110 transition-transform">${ssrInterpolate(s.icon)}</div><span class="text-xs text-white/30 fm-tabular">${ssrInterpolate(s.tag)}</span></div><h3 class="text-xl font-bold mb-2">${ssrInterpolate(s.title)}</h3><p class="text-white/50 text-sm leading-relaxed">${ssrInterpolate(s.desc)}</p><div class="mt-5 flex flex-wrap gap-2"><!--[-->`);
        ssrRenderList(s.tags, (t) => {
          _push(`<span class="px-2.5 py-0.5 rounded-full text-xs bg-white/5 text-white/60 border border-white/5">${ssrInterpolate(t)}</span>`);
        });
        _push(`<!--]--></div></div></div>`);
      });
      _push(`<!--]--></div></div></section>`);
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ScenarioSection.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "HighlightsSection",
  __ssrInlineRender: true,
  setup(__props) {
    const highlights = [
      {
        icon: "🚀",
        title: "三端协同",
        desc: "miniapp / screen / backend 单一仓库，端到端类型安全，毫秒级联调。"
      },
      {
        icon: "🔒",
        title: "Lua 原子扣库存",
        desc: "抽奖库存走 Redis Lua 脚本，杜绝超发与并发穿透。",
        code: "EVAL deduct-prize.lua KEYS[1] ARGV[1]"
      },
      {
        icon: "📡",
        title: "WebSocket 重连 + 幂等",
        desc: "断网重连自动恢复，现场去重 seqId，绝不丢消息。"
      },
      {
        icon: "📶",
        title: "弱网 5s 兜底",
        desc: "签到/答题本地缓存，恢复网络后自动补发，弱网不掉线。"
      },
      {
        icon: "🎮",
        title: "3D / 2D 自适应",
        desc: "大屏自动检测 WebGL 能力，无 3D 降级 CSS 动画。"
      },
      {
        icon: "🛠️",
        title: "可观测内置",
        desc: "客户端错误实时上报，活动复盘一键导出。"
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "relative py-32" }, _attrs))}><div class="max-w-6xl mx-auto px-6"><div data-reveal class="fm-reveal text-center mb-20"><p class="text-sm text-white/40 tracking-[0.3em] uppercase mb-4">Under the Hood</p><h2 class="text-5xl md:text-6xl font-bold mb-6"><span class="fm-text-gradient">技术护城河</span></h2><p class="text-white/50 text-lg max-w-2xl mx-auto"> 不只是看起来酷炫。我们把稳定性、易用性、扩展性都做到了生产级。 </p></div><div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5"><!--[-->`);
      ssrRenderList(highlights, (h, i) => {
        _push(`<div data-reveal class="${ssrRenderClass([`fm-reveal-delay-${i % 4 + 1}`, "fm-reveal fm-glass p-6"])}"><div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xl">${ssrInterpolate(h.icon)}</div><h3 class="text-lg font-bold">${ssrInterpolate(h.title)}</h3></div><p class="text-white/55 text-sm leading-relaxed">${ssrInterpolate(h.desc)}</p>`);
        if (h.code) {
          _push(`<div class="mt-3 text-xs text-emerald-300 font-mono">${ssrInterpolate(h.code)}</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      });
      _push(`<!--]--></div></div></section>`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/HighlightsSection.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "TrustSection",
  __ssrInlineRender: true,
  setup(__props) {
    const partners = [
      { name: "某高校学生会", type: "校园活动", icon: "🎓", bg: "rgba(102, 126, 234, 0.2)" },
      { name: "某互联网公司", type: "企业团建", icon: "🏢", bg: "rgba(79, 195, 247, 0.2)" },
      { name: "某 Live House", type: "线下派对", icon: "🎤", bg: "rgba(255, 107, 107, 0.2)" },
      { name: "某行业沙龙", type: "B 端峰会", icon: "💼", bg: "rgba(255, 215, 0, 0.2)" }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "relative py-24" }, _attrs))}><div class="max-w-6xl mx-auto px-6"><div data-reveal class="fm-reveal text-center mb-12"><p class="text-sm text-white/40 tracking-[0.3em] uppercase mb-4">Trusted By</p><h2 class="text-3xl md:text-4xl font-bold text-white/80"> 已被 <span class="fm-text-gradient">内测合作伙伴</span> 选择 </h2></div><div data-reveal class="fm-reveal fm-glass p-10 grid grid-cols-2 md:grid-cols-4 gap-8 items-center"><!--[-->`);
      ssrRenderList(partners, (p, i) => {
        _push(`<div class="flex flex-col items-center gap-2 group"><div class="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110" style="${ssrRenderStyle({ background: p.bg })}">${ssrInterpolate(p.icon)}</div><div class="text-sm text-white/50 group-hover:text-white/90 transition">${ssrInterpolate(p.name)}</div><div class="text-xs text-white/30">${ssrInterpolate(p.type)}</div></div>`);
      });
      _push(`<!--]--></div><p class="text-center text-white/30 text-xs mt-6"> * 合作伙伴占位，实际合作请联系我们补充。 </p></div></section>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/TrustSection.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const _sfc_main$2 = {};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs) {
  _push(`<section${ssrRenderAttrs(mergeProps({ class: "relative py-32 overflow-hidden" }, _attrs))}><div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] rounded-full blur-3xl opacity-25 pointer-events-none" style="${ssrRenderStyle({ "background": "radial-gradient(circle, #667eea 0%, transparent 60%)" })}"></div><div class="max-w-4xl mx-auto px-6 text-center"><div data-reveal class="fm-reveal"><p class="text-sm text-white/40 tracking-[0.3em] uppercase mb-6">Get Started</p><h2 class="text-5xl md:text-7xl font-bold mb-6 leading-tight"><span class="fm-text-gradient-rainbow">让下一场聚会</span><br> 闪耀起来 </h2><p class="text-white/55 text-lg md:text-xl max-w-2xl mx-auto mb-10"> 不论你是想办一场破冰活动，还是为你的产品增加社交属性， 我们的团队都准备好和你聊聊了。 </p></div><div data-reveal class="fm-reveal fm-reveal-delay-1 flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"><a class="fm-btn fm-btn-primary text-lg px-10 py-5" href="mailto:hi@flashmeet.example.com"> 📩 预约产品演示 </a><a class="fm-btn fm-btn-ghost text-lg px-10 py-5" href="#playground"> 再次体验 Demo </a></div><div data-reveal class="fm-reveal fm-reveal-delay-2 flex flex-wrap gap-x-8 gap-y-3 justify-center text-sm text-white/50"><span>📧 hi@flashmeet.example.com</span><span>🐦 @FlashMeetApp</span><span>📱 扫码加入内测群</span></div></div></section>`);
}
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/CtaSection.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_7 = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["ssrRender", _sfc_ssrRender$1]]);
const _sfc_main$1 = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<footer${ssrRenderAttrs(mergeProps({ class: "border-t border-white/5 py-12" }, _attrs))}><div class="max-w-6xl mx-auto px-6"><div class="grid md:grid-cols-4 gap-8 mb-10"><div class="md:col-span-2"><div class="text-2xl font-bold mb-3"><span class="fm-text-gradient">聚闪耀</span><span class="text-white/80 ml-2">FlashMeet</span></div><p class="text-white/40 text-sm leading-relaxed max-w-md"> 线下聚会互动大屏系统。让 30 秒破冰不再只是传说，让每一场聚会都闪耀。 </p></div><div><h4 class="text-sm font-semibold text-white/70 mb-3">产品</h4><ul class="space-y-2 text-sm text-white/40"><li><a class="hover:text-white/80 transition" href="#playground">核心玩法</a></li><li><a class="hover:text-white/80 transition" href="#scenarios">应用场景</a></li><li><a class="hover:text-white/80 transition" href="https://github.com/flashmeet">开源仓库</a></li></ul></div><div><h4 class="text-sm font-semibold text-white/70 mb-3">公司</h4><ul class="space-y-2 text-sm text-white/40"><li><a class="hover:text-white/80 transition" href="mailto:hi@flashmeet.example.com">联系我们</a></li><li><a class="hover:text-white/80 transition" href="#">加入团队</a></li><li><a class="hover:text-white/80 transition" href="#">媒体资料</a></li></ul></div></div><div class="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-white/30"><div>© 2026 FlashMeet. 让每一场聚会都闪耀。</div><div class="fm-tabular">Built with Nuxt 3 · Vue 3 · Tailwind CSS</div></div></div></footer>`);
}
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/SiteFooter.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_8 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["ssrRender", _sfc_ssrRender]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_HeroSection = _sfc_main$9;
      const _component_ValueSection = _sfc_main$8;
      const _component_PlaygroundSection = __nuxt_component_2;
      const _component_MetricsSection = _sfc_main$6;
      const _component_ScenarioSection = _sfc_main$5;
      const _component_HighlightsSection = _sfc_main$4;
      const _component_TrustSection = _sfc_main$3;
      const _component_CtaSection = __nuxt_component_7;
      const _component_SiteFooter = __nuxt_component_8;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-[#050516] text-white" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_HeroSection, null, null, _parent));
      _push(ssrRenderComponent(_component_ValueSection, null, null, _parent));
      _push(ssrRenderComponent(_component_PlaygroundSection, null, null, _parent));
      _push(ssrRenderComponent(_component_MetricsSection, null, null, _parent));
      _push(ssrRenderComponent(_component_ScenarioSection, null, null, _parent));
      _push(ssrRenderComponent(_component_HighlightsSection, null, null, _parent));
      _push(ssrRenderComponent(_component_TrustSection, null, null, _parent));
      _push(ssrRenderComponent(_component_CtaSection, null, null, _parent));
      _push(ssrRenderComponent(_component_SiteFooter, null, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=index-DDf2SBuM.js.map
