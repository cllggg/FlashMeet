import { defineComponent, mergeProps, ref, unref, reactive, useSSRContext } from 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/vue/index.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderStyle, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrIncludeBooleanAttr } from 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/vue/server-renderer/index.mjs';
import { _ as _export_sfc } from './server.mjs';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/ofetch/dist/node.mjs';
import '../_/renderer.mjs';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/vue-bundle-renderer/dist/runtime.mjs';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/h3/dist/index.mjs';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/ufo/dist/index.mjs';
import '../nitro/nitro.mjs';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/destr/dist/index.mjs';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/hookable/dist/index.mjs';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/node-mock-http/dist/index.mjs';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/unstorage/dist/index.mjs';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/unstorage/drivers/fs.mjs';
import 'node:crypto';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/unstorage/drivers/fs-lite.mjs';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/unstorage/drivers/lru-cache.mjs';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/ohash/dist/index.mjs';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/klona/dist/index.mjs';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/defu/dist/defu.mjs';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/scule/dist/index.mjs';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/unctx/dist/index.mjs';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/radix3/dist/index.mjs';
import 'node:fs';
import 'node:url';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/pathe/dist/index.mjs';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/unhead/dist/server.mjs';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/devalue/index.js';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/unhead/dist/utils.mjs';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/unhead/dist/plugins.mjs';
import 'file:///Users/liyijia/Create/FlashMeet/website/node_modules/vue-router/vue-router.node.mjs';

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
      { value: "30s", label: "\u626B\u7801\u5373\u7528" },
      { value: "10K+", label: "\u5E76\u53D1\u4E92\u52A8" },
      { value: "50+", label: "\u8986\u76D6\u57CE\u5E02" },
      { value: "4.9/5", label: "\u7528\u6237\u8BC4\u5206" }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_StarField = _sfc_main$a;
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "relative min-h-screen flex items-center justify-center overflow-hidden" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_StarField, { class: "absolute inset-0" }, null, _parent));
      _push(`<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-30 blur-3xl pointer-events-none" style="${ssrRenderStyle({ "background": "radial-gradient(circle, rgba(102, 126, 234, 0.5) 0%, transparent 60%)" })}"></div><div class="relative z-10 max-w-6xl mx-auto px-6 py-24 text-center"><div data-reveal class="fm-reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur mb-8 text-sm text-white/70"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 fm-pulse-glow"></span> \u6B63\u5728\u4E3A <span class="text-emerald-300 fm-tabular">${ssrInterpolate(unref(liveEvents))}</span> \u573A\u6D3B\u52A8\u63D0\u4F9B\u652F\u6301 </div><h1 data-reveal class="fm-reveal fm-reveal-delay-1 text-6xl md:text-8xl font-bold tracking-tight leading-[1.05] mb-6"><span class="fm-text-gradient-rainbow">\u805A\u95EA\u8000</span><span class="text-white/90 ml-3">FlashMeet</span></h1><p data-reveal class="fm-reveal fm-reveal-delay-2 text-xl md:text-2xl text-white/60 mb-3"> \u8BA1\u7B97\u76F8\u9047\u7684\u6982\u7387\uFF0C\u6E32\u67D3\u5FC3\u52A8\u7684\u77AC\u95F4 </p><p data-reveal class="fm-reveal fm-reveal-delay-3 text-base md:text-lg text-white/40 max-w-2xl mx-auto mb-12"> \u7EBF\u4E0B\u805A\u4F1A\u4E92\u52A8\u5927\u5C4F\u7CFB\u7EDF\uFF1A\u626B\u7801\u7B7E\u5230\u3001\u661F\u7CFB\u4E0A\u5899\u3001\u5B9E\u65F6\u4E92\u52A8\u6E38\u620F\u3001\u667A\u80FD\u5339\u914D\u3002 <br class="hidden md:block"> \u8BA9 30 \u79D2\u7834\u51B0\u4E0D\u518D\u53EA\u662F\u4F20\u8BF4\uFF0C\u8BA9\u6BCF\u4E00\u573A\u805A\u4F1A\u90FD\u95EA\u8000\u3002 </p><div data-reveal class="fm-reveal fm-reveal-delay-4 flex flex-col sm:flex-row gap-4 justify-center items-center"><a class="fm-btn fm-btn-primary" href="#playground"> \u7ACB\u5373\u4F53\u9A8C Demo <span class="ml-2">\u2192</span></a><a class="fm-btn fm-btn-ghost" href="#scenarios"> \u4E86\u89E3\u5E94\u7528\u573A\u666F </a></div><div data-reveal class="fm-reveal fm-reveal-delay-4 mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 text-left"><!--[-->`);
      ssrRenderList(quickStats, (m) => {
        _push(`<div class="border-l border-white/10 pl-4"><div class="text-2xl md:text-3xl font-bold fm-text-gradient fm-tabular">${ssrInterpolate(m.value)}</div><div class="text-xs text-white/40 mt-1">${ssrInterpolate(m.label)}</div></div>`);
      });
      _push(`<!--]--></div></div><div class="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-sm flex flex-col items-center gap-2 animate-bounce"><span>\u5411\u4E0B\u63A2\u7D22</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 13l5 5 5-5M7 6l5 5 5-5"></path></svg></div></section>`);
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
        icon: "\u26A1",
        title: "\u6253\u7834\u5C34\u5C2C",
        desc: '30 \u79D2\u7834\u51B0\u4E0D\u518D\u662F\u4F20\u8BF4\u3002\u6211\u4EEC\u7528\u6E38\u620F\u5316\u673A\u5236\u628A"\u7834\u51B0"\u4ECE\u5FC3\u7406\u95E8\u69DB\u53D8\u6210\u89C6\u89C9\u51B2\u51FB\u3002',
        bg: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
        bullets: [
          "\u626B\u7801\u5373\u53C2\u4E0E\uFF0C\u96F6\u4E0B\u8F7D",
          "\u6E10\u8FDB\u5F0F\u753B\u50CF\uFF0C\u8D8A\u73A9\u8D8A\u61C2\u4F60",
          "\u5927\u5C4F\u89C6\u89C9\u51B2\u51FB\uFF0C\u8BA9\u51B7\u573A\u53D8\u7206\u70B9"
        ]
      },
      {
        icon: "\u{1F680}",
        title: "\u6FC0\u6D3B\u53C2\u4E0E",
        desc: '\u4ECE"\u4F4E\u5934\u65CF"\u5230"\u5168\u573A\u7126\u70B9"\u3002\u8BA9\u6BCF\u4E00\u4E2A\u53C2\u4E0E\u8005\u90FD\u6709\u620F\uFF0C\u8BA9\u4E3B\u6301\u4EBA\u4E0D\u518D\u5C2C\u573A\u3002',
        bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        bullets: [
          "\u4E07\u4EBA\u5E76\u53D1\u4E0D\u5361",
          "\u5B9E\u65F6\u6392\u884C\uFF0C\u6FC0\u53D1\u7ADE\u4E89\u5FC3",
          "\u526F\u573A\u63A7\u65E0\u7F1D\u63A5\u7BA1\uFF0C\u4E0D\u6015\u65AD\u7F51"
        ]
      },
      {
        icon: "\u{1F48E}",
        title: "\u6C89\u6DC0\u8D44\u4EA7",
        desc: "\u4E0D\u53EA\u662F\u5A31\u4E50\uFF0C\u66F4\u662F\u7528\u6237\u753B\u50CF\u4E0E\u793E\u4EA4\u5173\u7CFB\u3002\u6D3B\u52A8\u7ED3\u675F\uFF0C\u8D44\u4EA7\u7559\u5F97\u4F4F\u3002",
        bg: "linear-gradient(135deg, #4fc3f7 0%, #66bb6a 100%)",
        bullets: [
          "\u6570\u5B57\u6210\u5C31\u5361\u88C2\u53D8\u4F20\u64AD",
          "\u5EF6\u65F6\u793E\u4EA4\u6C60\uFF0C\u6D3B\u52A8\u540E\u4ECD\u53EF\u7834\u51B0",
          "\u590D\u76D8\u6570\u636E\u770B\u677F\uFF0C\u91CF\u5316\u6D3B\u52A8 ROI"
        ]
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "relative py-32" }, _attrs))}><div class="max-w-6xl mx-auto px-6"><div data-reveal class="fm-reveal text-center mb-20"><p class="text-sm text-white/40 tracking-[0.3em] uppercase mb-4">Why FlashMeet</p><h2 class="text-5xl md:text-6xl font-bold mb-6"> \u4E3A\u4EC0\u4E48\u4E3B\u529E\u65B9\u9009\u62E9 <span class="fm-text-gradient">\u6211\u4EEC</span></h2><p class="text-white/50 text-lg max-w-2xl mx-auto"> \u4E0D\u6B62\u662F\u5A31\u4E50\u5DE5\u5177\uFF0C\u66F4\u662F\u7528\u6237\u589E\u957F\u4E0E\u793E\u4EA4\u8D44\u4EA7\u6C89\u6DC0\u7684\u64CD\u4F5C\u7CFB\u7EDF\u3002 </p></div><div class="grid md:grid-cols-3 gap-6"><!--[-->`);
      ssrRenderList(values, (v, i) => {
        _push(`<div data-reveal class="${ssrRenderClass([`fm-reveal-delay-${i + 1}`, "fm-reveal fm-glass p-8 group"])}"><div class="text-xs text-white/30 fm-tabular mb-4">0${ssrInterpolate(i + 1)}</div><div class="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3" style="${ssrRenderStyle({
          background: v.bg,
          boxShadow: "0 8px 24px -8px rgba(0,0,0,0.4)"
        })}">${ssrInterpolate(v.icon)}</div><h3 class="text-2xl font-bold mb-3">${ssrInterpolate(v.title)}</h3><p class="text-white/55 leading-relaxed mb-6">${ssrInterpolate(v.desc)}</p><ul class="space-y-2"><!--[-->`);
        ssrRenderList(v.bullets, (b) => {
          _push(`<li class="flex items-start gap-2 text-sm text-white/60"><span class="text-emerald-400 mt-0.5">\u2713</span><span>${ssrInterpolate(b)}</span></li>`);
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
    const lotteryHint = ref("\u70B9\u51FB\u4E0B\u65B9\u6309\u94AE\u62BD\u4E00\u6B21");
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
      }, _attrs))} data-v-c312d3a1><div class="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 pointer-events-none" style="${ssrRenderStyle({ "background": "radial-gradient(circle, #764ba2 0%, transparent 60%)" })}" data-v-c312d3a1></div><div class="max-w-6xl mx-auto px-6" data-v-c312d3a1><div data-reveal class="fm-reveal text-center mb-20" data-v-c312d3a1><p class="text-sm text-white/40 tracking-[0.3em] uppercase mb-4" data-v-c312d3a1>Core Playgrounds</p><h2 class="text-5xl md:text-6xl font-bold mb-6" data-v-c312d3a1><span class="fm-text-gradient" data-v-c312d3a1>\u56DB\u5927\u6838\u5FC3\u73A9\u6CD5</span></h2><p class="text-white/50 text-lg max-w-2xl mx-auto" data-v-c312d3a1> \u70B9\u51FB\u4E0B\u65B9\u4EFB\u610F\u4E00\u4E2A demo\uFF0C\u7ACB\u5373\u4F53\u9A8C\u3002\u6BCF\u4E00\u4E2A\u90FD\u5DF2\u7ECF\u5728\u6570\u5343\u573A\u771F\u5B9E\u6D3B\u52A8\u4E2D\u8DD1\u901A\u3002 </p></div><div class="grid md:grid-cols-2 gap-6" data-v-c312d3a1><div data-reveal class="fm-reveal fm-glass p-8 cursor-pointer" data-v-c312d3a1><div class="flex items-center gap-3 mb-4" data-v-c312d3a1><span class="text-3xl" data-v-c312d3a1>\u{1F3B0}</span><h3 class="text-xl font-bold" data-v-c312d3a1>\u4E92\u52A8\u62BD\u5956</h3></div><p class="text-white/50 text-sm mb-6" data-v-c312d3a1>\u539F\u5B50\u6027\u5E93\u5B58\u6263\u51CF\uFF0C\u9632\u8D85\u53D1\u9632\u5237\u7968\u3002\u624B\u673A\u9707\u52A8\u53CD\u9988\uFF0C\u5927\u5C4F\u5B9E\u65F6\u6EDA\u52A8\u3002</p><div class="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-white/5 flex items-center justify-center" data-v-c312d3a1>`);
      if (unref(lotteryWinner)) {
        _push(`<div class="text-3xl font-bold fm-text-gradient-rainbow" data-v-c312d3a1>${ssrInterpolate(unref(lotteryWinner))}</div>`);
      } else {
        _push(`<div class="text-white/40 text-sm" data-v-c312d3a1>${ssrInterpolate(unref(lotteryHint))}</div>`);
      }
      _push(`</div><button class="${ssrRenderClass([unref(lotterySpinning) ? "bg-white/5 text-white/40 cursor-not-allowed" : "bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white", "mt-4 w-full py-2 rounded-lg text-sm font-semibold transition"])}"${ssrIncludeBooleanAttr(unref(lotterySpinning)) ? " disabled" : ""} data-v-c312d3a1>${ssrInterpolate(unref(lotterySpinning) ? "\u62BD\u5956\u4E2D\u2026" : "\u70B9\u6211\u62BD\u4E00\u6B21")}</button></div><div data-reveal class="fm-reveal fm-reveal-delay-1 fm-glass p-8 cursor-pointer" data-v-c312d3a1><div class="flex items-center gap-3 mb-4" data-v-c312d3a1><span class="text-3xl" data-v-c312d3a1>\u{1F4F1}</span><h3 class="text-xl font-bold" data-v-c312d3a1>\u6447\u4E00\u6447\u5927\u8D5B</h3></div><p class="text-white/50 text-sm mb-6" data-v-c312d3a1>\u5168\u573A\u540C\u9891\u7ADE\u6280\uFF0C500ms \u5B9E\u65F6\u6392\u884C\u3002\u7A81\u7834\u793E\u4EA4\u51B7\u573A\uFF0C\u77AC\u95F4\u70B9\u71C3\u5168\u573A\u3002</p><div class="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-cyan-900/40 to-emerald-900/40 border border-white/5 flex flex-col items-center justify-center" data-v-c312d3a1><div class="text-5xl font-bold fm-text-gradient-cool fm-tabular" data-v-c312d3a1>${ssrInterpolate(unref(shakeScore))}</div><div class="text-white/40 text-xs mt-2" data-v-c312d3a1>\u70B9\u51FB\u7D2F\u79EF\u5206\u6570\uFF08\u6A21\u62DF\u52A0\u901F\u5EA6\u8BA1\uFF09</div></div><button class="mt-4 w-full py-2 rounded-lg text-sm font-semibold transition bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-90 text-white" data-v-c312d3a1> \u70B9\u51FB\u6447\u4E00\u4E0B </button></div><div data-reveal class="fm-reveal fm-reveal-delay-2 fm-glass p-8 cursor-pointer" data-v-c312d3a1><div class="flex items-center gap-3 mb-4" data-v-c312d3a1><span class="text-3xl" data-v-c312d3a1>\u{1F4AB}</span><h3 class="text-xl font-bold" data-v-c312d3a1>CP \u76F2\u76D2\u5339\u914D</h3></div><p class="text-white/50 text-sm mb-6" data-v-c312d3a1>\u57FA\u4E8E\u6807\u7B7E\u96F7\u8FBE\u7684\u667A\u80FD\u5339\u914D\uFF0C\u53CC\u76F2\u7834\u51B0\u4FDD\u62A4\u9690\u79C1\u3002</p><div class="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-rose-900/40 to-orange-900/40 border border-white/5 flex items-center justify-center" data-v-c312d3a1><div class="flex items-center gap-4" data-v-c312d3a1><div class="${ssrRenderClass([unref(matchMatched) ? "bg-rose-500/30" : "bg-white/10", "w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-700"])}" style="${ssrRenderStyle(unref(matchStyle).left)}" data-v-c312d3a1> \u{1F469} </div>`);
      if (unref(matchMatched)) {
        _push(`<div class="text-rose-400 text-2xl" data-v-c312d3a1>\u{1F495}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="${ssrRenderClass([unref(matchMatched) ? "bg-rose-500/30" : "bg-white/10", "w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-700"])}" style="${ssrRenderStyle(unref(matchStyle).right)}" data-v-c312d3a1> \u{1F9D1} </div></div></div><button class="${ssrRenderClass([unref(matching) ? "bg-white/5 text-white/40 cursor-not-allowed" : "bg-gradient-to-r from-rose-500 to-orange-500 hover:opacity-90 text-white", "mt-4 w-full py-2 rounded-lg text-sm font-semibold transition"])}"${ssrIncludeBooleanAttr(unref(matching)) ? " disabled" : ""} data-v-c312d3a1>${ssrInterpolate(unref(matching) ? "\u5339\u914D\u4E2D\u2026" : unref(matchMatched) ? "\u518D\u6765\u4E00\u7EC4" : "\u5F00\u59CB\u5339\u914D")}</button></div><div data-reveal class="fm-reveal fm-reveal-delay-3 fm-glass p-8 cursor-pointer" data-v-c312d3a1><div class="flex items-center gap-3 mb-4" data-v-c312d3a1><span class="text-3xl" data-v-c312d3a1>\u{1F30C}</span><h3 class="text-xl font-bold" data-v-c312d3a1>\u661F\u7CFB\u7B7E\u5230</h3></div><p class="text-white/50 text-sm mb-6" data-v-c312d3a1>\u626B\u7801\u79D2\u7EA7\u4E0A\u5899\uFF0C\u5316\u4F5C\u6697\u661F\u98DE\u5165\u661F\u7CFB\u3002\u6E10\u8FDB\u5F0F\u753B\u50CF\u6E38\u620F\u5316\u6536\u96C6\u6807\u7B7E\u3002</p><div class="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-900/60 to-violet-900/60 border border-white/5" data-v-c312d3a1><!--[-->`);
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
      _push(`<!--]--><div class="absolute bottom-2 right-3 text-xs text-white/40" data-v-c312d3a1>${ssrInterpolate(unref(signinDots).length)} \u9897\u661F\u5DF2\u70B9\u4EAE </div></div><button class="mt-4 w-full py-2 rounded-lg text-sm font-semibold transition bg-gradient-to-r from-indigo-500 to-violet-500 hover:opacity-90 text-white" data-v-c312d3a1> \u70B9\u4EAE\u6211\u7684\u661F </button></div></div></div></section>`);
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
      { value: 1280, suffix: "+", label: "\u7D2F\u8BA1\u6D3B\u52A8\u573A\u6B21", note: "\u8986\u76D6 50+ \u57CE\u5E02" },
      { value: 48, suffix: "K+", label: "\u7D2F\u8BA1\u7B7E\u5230\u7528\u6237", note: "\u5185\u6D4B\u671F\u6570\u636E" },
      { value: 1e4, suffix: "+", label: "\u5355\u573A\u5E76\u53D1\u4E92\u52A8", note: "WebSocket \u538B\u6D4B\u5CF0\u503C" },
      { value: 99, suffix: "%", label: "\u7B7E\u5230\u6210\u529F\u7387", note: "\u5F31\u7F51 5s \u515C\u5E95" }
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
      { label: "\u7B7E\u5230\u54CD\u5E94 P99", value: "< 80ms", w: 92, color: "linear-gradient(90deg, #66bb6a, #4fc3f7)" },
      { label: "WebSocket \u6D88\u606F\u5EF6\u8FDF", value: "< 120ms", w: 88, color: "linear-gradient(90deg, #4fc3f7, #667eea)" },
      { label: "\u62BD\u5956\u5E76\u53D1\u541E\u5410", value: "5K QPS", w: 96, color: "linear-gradient(90deg, #667eea, #764ba2)" },
      { label: "\u5927\u5C4F FPS\uFF083D \u6A21\u5F0F\uFF09", value: "60 FPS", w: 100, color: "linear-gradient(90deg, #764ba2, #f093fb)" }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "relative py-32" }, _attrs))}><div class="max-w-6xl mx-auto px-6"><div data-reveal class="fm-reveal text-center mb-20"><p class="text-sm text-white/40 tracking-[0.3em] uppercase mb-4">By the Numbers</p><h2 class="text-5xl md:text-6xl font-bold mb-6"> \u6570\u636E <span class="fm-text-gradient-cool">\u4E0D\u8BF4\u8C0E</span></h2><p class="text-white/50 text-lg max-w-2xl mx-auto"> \u4ECE\u5185\u6D4B\u5230\u751F\u4EA7\u73AF\u5883\uFF0C\u6BCF\u4E00\u4E2A\u6570\u5B57\u90FD\u6765\u81EA\u771F\u5B9E\u8FD0\u884C\u3002 </p></div><div class="grid grid-cols-2 md:grid-cols-4 gap-6" data-countup><!--[-->`);
      ssrRenderList(metrics, (m, i) => {
        _push(`<div data-reveal class="${ssrRenderClass([`fm-reveal-delay-${i % 4 + 1}`, "fm-reveal fm-glass p-6 text-center"])}"><div class="text-4xl md:text-5xl font-bold fm-text-gradient fm-tabular mb-2">${ssrInterpolate(displayValue(m, i))}${ssrInterpolate(m.suffix)}</div><div class="text-sm text-white/55">${ssrInterpolate(m.label)}</div><div class="text-xs text-white/30 mt-2">${ssrInterpolate(m.note)}</div></div>`);
      });
      _push(`<!--]--></div><div data-reveal class="fm-reveal mt-16 fm-glass p-8"><h3 class="text-lg font-bold mb-6 text-white/80">\u26A1 \u6027\u80FD\u57FA\u7EBF\uFF08\u751F\u4EA7\u73AF\u5883\uFF09</h3><div class="space-y-5"><!--[-->`);
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
        icon: "\u{1F393}",
        title: "\u6821\u56ED\u8FCE\u65B0",
        desc: "\u8BA9\u65B0\u751F\u4E0D\u518D\u793E\u6050\uFF0C\u4ECE\u5165\u5B66\u7684\u7B2C\u4E00\u665A\u5C31\u627E\u5230\u5F52\u5C5E\u611F\u3002",
        tag: "Edu",
        glow: "rgba(102, 126, 234, 0.4)",
        tags: ["\u7834\u51B0", "\u7834\u5708", "\u6821\u56ED"]
      },
      {
        icon: "\u{1F3E2}",
        title: "\u4F01\u4E1A\u56E2\u5EFA",
        desc: "\u8BA9 HR \u5934\u75BC\u7684\u7834\u51B0\u6E38\u620F\u7EC8\u4E8E\u6709\u89E3\uFF0C\u56E2\u5EFA\u6548\u679C\u53EF\u91CF\u5316\u3002",
        tag: "Corp",
        glow: "rgba(102, 126, 234, 0.4)",
        tags: ["\u7834\u51B0", "\u6570\u636E", "ROI"]
      },
      {
        icon: "\u{1F4BC}",
        title: "\u884C\u4E1A\u5CF0\u4F1A",
        desc: '\u7CBE\u51C6\u4EBA\u8109\u5339\u914D\uFF0C\u8BA9"\u52A0\u5FAE\u4FE1"\u53D8\u6210"\u804A\u5F97\u6765"\u3002',
        tag: "Biz",
        glow: "rgba(79, 195, 247, 0.4)",
        tags: ["\u5339\u914D", "\u4EBA\u8109", "\u6C89\u6DC0"]
      },
      {
        icon: "\u{1F389}",
        title: "\u79C1\u4EBA\u6D3E\u5BF9",
        desc: "\u8BA9\u6D3E\u5BF9\u71C3\u5230\u7206\uFF0C\u5BBE\u5BA2\u53C2\u4E0E\u5EA6\u62C9\u6EE1\uFF0C\u670B\u53CB\u5708\u7D20\u6750\u7BA1\u591F\u3002",
        tag: "Party",
        glow: "rgba(255, 107, 107, 0.4)",
        tags: ["\u5A31\u4E50", "\u6C1B\u56F4", "\u4F20\u64AD"]
      },
      {
        icon: "\u{1F6CD}\uFE0F",
        title: "\u5546\u573A\u5F00\u4E1A",
        desc: "\u5438\u775B\u5F15\u6D41\u8F6C\u5316\u4E00\u4F53\uFF0C\u628A\u8DEF\u4EBA\u53D8\u6210\u7C89\u4E1D\u3002",
        tag: "Retail",
        glow: "rgba(255, 215, 0, 0.4)",
        tags: ["\u5F15\u6D41", "\u8F6C\u5316", "\u54C1\u724C"]
      },
      {
        icon: "\u{1F492}",
        title: "\u5A5A\u793C\u4E92\u52A8",
        desc: "\u5BBE\u5BA2\u4E0D\u518D\u53EA\u987E\u4F4E\u5934\u5403\u996D\uFF0C\u53C2\u4E0E\u611F\u62C9\u6EE1\uFF0C\u795D\u798F\u66F4\u8D70\u5FC3\u3002",
        tag: "Wedding",
        glow: "rgba(240, 147, 251, 0.4)",
        tags: ["\u795D\u798F", "\u4E92\u52A8", "\u6E29\u60C5"]
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({
        id: "scenarios",
        class: "relative py-32 overflow-hidden"
      }, _attrs))}><div class="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-15 pointer-events-none" style="${ssrRenderStyle({ "background": "radial-gradient(circle, #ff6b6b 0%, transparent 60%)" })}"></div><div class="max-w-6xl mx-auto px-6"><div data-reveal class="fm-reveal text-center mb-20"><p class="text-sm text-white/40 tracking-[0.3em] uppercase mb-4">Scenarios</p><h2 class="text-5xl md:text-6xl font-bold mb-6"><span class="fm-text-gradient-warm">\u516D\u5927\u843D\u5730\u573A\u666F</span></h2><p class="text-white/50 text-lg max-w-2xl mx-auto"> \u4ECE\u6821\u56ED\u8FCE\u65B0\u5230\u4F01\u4E1A\u56E2\u5EFA\uFF0C\u4ECE\u884C\u4E1A\u6C99\u9F99\u5230\u79C1\u4EBA\u6D3E\u5BF9\uFF0C\u6BCF\u4E00\u573A\u805A\u4F1A\u90FD\u80FD\u88AB\u91CD\u65B0\u5B9A\u4E49\u3002 </p></div><div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6"><!--[-->`);
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
        icon: "\u{1F680}",
        title: "\u4E09\u7AEF\u534F\u540C",
        desc: "miniapp / screen / backend \u5355\u4E00\u4ED3\u5E93\uFF0C\u7AEF\u5230\u7AEF\u7C7B\u578B\u5B89\u5168\uFF0C\u6BEB\u79D2\u7EA7\u8054\u8C03\u3002"
      },
      {
        icon: "\u{1F512}",
        title: "Lua \u539F\u5B50\u6263\u5E93\u5B58",
        desc: "\u62BD\u5956\u5E93\u5B58\u8D70 Redis Lua \u811A\u672C\uFF0C\u675C\u7EDD\u8D85\u53D1\u4E0E\u5E76\u53D1\u7A7F\u900F\u3002",
        code: "EVAL deduct-prize.lua KEYS[1] ARGV[1]"
      },
      {
        icon: "\u{1F4E1}",
        title: "WebSocket \u91CD\u8FDE + \u5E42\u7B49",
        desc: "\u65AD\u7F51\u91CD\u8FDE\u81EA\u52A8\u6062\u590D\uFF0C\u73B0\u573A\u53BB\u91CD seqId\uFF0C\u7EDD\u4E0D\u4E22\u6D88\u606F\u3002"
      },
      {
        icon: "\u{1F4F6}",
        title: "\u5F31\u7F51 5s \u515C\u5E95",
        desc: "\u7B7E\u5230/\u7B54\u9898\u672C\u5730\u7F13\u5B58\uFF0C\u6062\u590D\u7F51\u7EDC\u540E\u81EA\u52A8\u8865\u53D1\uFF0C\u5F31\u7F51\u4E0D\u6389\u7EBF\u3002"
      },
      {
        icon: "\u{1F3AE}",
        title: "3D / 2D \u81EA\u9002\u5E94",
        desc: "\u5927\u5C4F\u81EA\u52A8\u68C0\u6D4B WebGL \u80FD\u529B\uFF0C\u65E0 3D \u964D\u7EA7 CSS \u52A8\u753B\u3002"
      },
      {
        icon: "\u{1F6E0}\uFE0F",
        title: "\u53EF\u89C2\u6D4B\u5185\u7F6E",
        desc: "\u5BA2\u6237\u7AEF\u9519\u8BEF\u5B9E\u65F6\u4E0A\u62A5\uFF0C\u6D3B\u52A8\u590D\u76D8\u4E00\u952E\u5BFC\u51FA\u3002"
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "relative py-32" }, _attrs))}><div class="max-w-6xl mx-auto px-6"><div data-reveal class="fm-reveal text-center mb-20"><p class="text-sm text-white/40 tracking-[0.3em] uppercase mb-4">Under the Hood</p><h2 class="text-5xl md:text-6xl font-bold mb-6"><span class="fm-text-gradient">\u6280\u672F\u62A4\u57CE\u6CB3</span></h2><p class="text-white/50 text-lg max-w-2xl mx-auto"> \u4E0D\u53EA\u662F\u770B\u8D77\u6765\u9177\u70AB\u3002\u6211\u4EEC\u628A\u7A33\u5B9A\u6027\u3001\u6613\u7528\u6027\u3001\u6269\u5C55\u6027\u90FD\u505A\u5230\u4E86\u751F\u4EA7\u7EA7\u3002 </p></div><div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5"><!--[-->`);
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
      { name: "\u67D0\u9AD8\u6821\u5B66\u751F\u4F1A", type: "\u6821\u56ED\u6D3B\u52A8", icon: "\u{1F393}", bg: "rgba(102, 126, 234, 0.2)" },
      { name: "\u67D0\u4E92\u8054\u7F51\u516C\u53F8", type: "\u4F01\u4E1A\u56E2\u5EFA", icon: "\u{1F3E2}", bg: "rgba(79, 195, 247, 0.2)" },
      { name: "\u67D0 Live House", type: "\u7EBF\u4E0B\u6D3E\u5BF9", icon: "\u{1F3A4}", bg: "rgba(255, 107, 107, 0.2)" },
      { name: "\u67D0\u884C\u4E1A\u6C99\u9F99", type: "B \u7AEF\u5CF0\u4F1A", icon: "\u{1F4BC}", bg: "rgba(255, 215, 0, 0.2)" }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "relative py-24" }, _attrs))}><div class="max-w-6xl mx-auto px-6"><div data-reveal class="fm-reveal text-center mb-12"><p class="text-sm text-white/40 tracking-[0.3em] uppercase mb-4">Trusted By</p><h2 class="text-3xl md:text-4xl font-bold text-white/80"> \u5DF2\u88AB <span class="fm-text-gradient">\u5185\u6D4B\u5408\u4F5C\u4F19\u4F34</span> \u9009\u62E9 </h2></div><div data-reveal class="fm-reveal fm-glass p-10 grid grid-cols-2 md:grid-cols-4 gap-8 items-center"><!--[-->`);
      ssrRenderList(partners, (p, i) => {
        _push(`<div class="flex flex-col items-center gap-2 group"><div class="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110" style="${ssrRenderStyle({ background: p.bg })}">${ssrInterpolate(p.icon)}</div><div class="text-sm text-white/50 group-hover:text-white/90 transition">${ssrInterpolate(p.name)}</div><div class="text-xs text-white/30">${ssrInterpolate(p.type)}</div></div>`);
      });
      _push(`<!--]--></div><p class="text-center text-white/30 text-xs mt-6"> * \u5408\u4F5C\u4F19\u4F34\u5360\u4F4D\uFF0C\u5B9E\u9645\u5408\u4F5C\u8BF7\u8054\u7CFB\u6211\u4EEC\u8865\u5145\u3002 </p></div></section>`);
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
  _push(`<section${ssrRenderAttrs(mergeProps({ class: "relative py-32 overflow-hidden" }, _attrs))}><div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] rounded-full blur-3xl opacity-25 pointer-events-none" style="${ssrRenderStyle({ "background": "radial-gradient(circle, #667eea 0%, transparent 60%)" })}"></div><div class="max-w-4xl mx-auto px-6 text-center"><div data-reveal class="fm-reveal"><p class="text-sm text-white/40 tracking-[0.3em] uppercase mb-6">Get Started</p><h2 class="text-5xl md:text-7xl font-bold mb-6 leading-tight"><span class="fm-text-gradient-rainbow">\u8BA9\u4E0B\u4E00\u573A\u805A\u4F1A</span><br> \u95EA\u8000\u8D77\u6765 </h2><p class="text-white/55 text-lg md:text-xl max-w-2xl mx-auto mb-10"> \u4E0D\u8BBA\u4F60\u662F\u60F3\u529E\u4E00\u573A\u7834\u51B0\u6D3B\u52A8\uFF0C\u8FD8\u662F\u4E3A\u4F60\u7684\u4EA7\u54C1\u589E\u52A0\u793E\u4EA4\u5C5E\u6027\uFF0C \u6211\u4EEC\u7684\u56E2\u961F\u90FD\u51C6\u5907\u597D\u548C\u4F60\u804A\u804A\u4E86\u3002 </p></div><div data-reveal class="fm-reveal fm-reveal-delay-1 flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"><a class="fm-btn fm-btn-primary text-lg px-10 py-5" href="mailto:hi@flashmeet.example.com"> \u{1F4E9} \u9884\u7EA6\u4EA7\u54C1\u6F14\u793A </a><a class="fm-btn fm-btn-ghost text-lg px-10 py-5" href="#playground"> \u518D\u6B21\u4F53\u9A8C Demo </a></div><div data-reveal class="fm-reveal fm-reveal-delay-2 flex flex-wrap gap-x-8 gap-y-3 justify-center text-sm text-white/50"><span>\u{1F4E7} hi@flashmeet.example.com</span><span>\u{1F426} @FlashMeetApp</span><span>\u{1F4F1} \u626B\u7801\u52A0\u5165\u5185\u6D4B\u7FA4</span></div></div></section>`);
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
  _push(`<footer${ssrRenderAttrs(mergeProps({ class: "border-t border-white/5 py-12" }, _attrs))}><div class="max-w-6xl mx-auto px-6"><div class="grid md:grid-cols-4 gap-8 mb-10"><div class="md:col-span-2"><div class="text-2xl font-bold mb-3"><span class="fm-text-gradient">\u805A\u95EA\u8000</span><span class="text-white/80 ml-2">FlashMeet</span></div><p class="text-white/40 text-sm leading-relaxed max-w-md"> \u7EBF\u4E0B\u805A\u4F1A\u4E92\u52A8\u5927\u5C4F\u7CFB\u7EDF\u3002\u8BA9 30 \u79D2\u7834\u51B0\u4E0D\u518D\u53EA\u662F\u4F20\u8BF4\uFF0C\u8BA9\u6BCF\u4E00\u573A\u805A\u4F1A\u90FD\u95EA\u8000\u3002 </p></div><div><h4 class="text-sm font-semibold text-white/70 mb-3">\u4EA7\u54C1</h4><ul class="space-y-2 text-sm text-white/40"><li><a class="hover:text-white/80 transition" href="#playground">\u6838\u5FC3\u73A9\u6CD5</a></li><li><a class="hover:text-white/80 transition" href="#scenarios">\u5E94\u7528\u573A\u666F</a></li><li><a class="hover:text-white/80 transition" href="https://github.com/flashmeet">\u5F00\u6E90\u4ED3\u5E93</a></li></ul></div><div><h4 class="text-sm font-semibold text-white/70 mb-3">\u516C\u53F8</h4><ul class="space-y-2 text-sm text-white/40"><li><a class="hover:text-white/80 transition" href="mailto:hi@flashmeet.example.com">\u8054\u7CFB\u6211\u4EEC</a></li><li><a class="hover:text-white/80 transition" href="#">\u52A0\u5165\u56E2\u961F</a></li><li><a class="hover:text-white/80 transition" href="#">\u5A92\u4F53\u8D44\u6599</a></li></ul></div></div><div class="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-white/30"><div>\xA9 2026 FlashMeet. \u8BA9\u6BCF\u4E00\u573A\u805A\u4F1A\u90FD\u95EA\u8000\u3002</div><div class="fm-tabular">Built with Nuxt 3 \xB7 Vue 3 \xB7 Tailwind CSS</div></div></div></footer>`);
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

export { _sfc_main as default };
//# sourceMappingURL=index-DDf2SBuM.mjs.map
