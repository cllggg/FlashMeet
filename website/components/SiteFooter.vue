<template>
  <footer class="border-t border-white/5 py-12">
    <div class="max-w-6xl mx-auto px-6">
      <div class="grid md:grid-cols-4 gap-8 mb-10">
        <div class="md:col-span-2">
          <div class="text-2xl font-bold mb-3">
            <span class="fm-text-gradient">聚闪耀</span>
            <span class="text-white/80 ml-2">FlashMeet</span>
          </div>
          <p class="text-white/40 text-sm leading-relaxed max-w-md">
            线下聚会互动大屏系统。让 30 秒破冰不再只是传说，让每一场聚会都闪耀。
          </p>
        </div>
        <div>
          <h4 class="text-sm font-semibold text-white/70 mb-3">产品</h4>
          <ul class="space-y-2 text-sm text-white/40">
            <li><a class="hover:text-white/80 transition" href="#playground">核心玩法</a></li>
            <li><a class="hover:text-white/80 transition" href="#scenarios">应用场景</a></li>
            <li><a class="hover:text-white/80 transition" href="https://github.com/flashmeet">开源仓库</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-sm font-semibold text-white/70 mb-3">公司</h4>
          <ul class="space-y-2 text-sm text-white/40">
            <li><a class="hover:text-white/80 transition" href="mailto:hi@flashmeet.example.com">联系我们</a></li>
            <li><a class="hover:text-white/80 transition" href="#">加入团队</a></li>
            <li><a class="hover:text-white/80 transition" href="#">媒体资料</a></li>
          </ul>
        </div>
      </div>
      <div class="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-white/30">
        <div>© 2026 FlashMeet. 让每一场聚会都闪耀。</div>
        <div class="fm-tabular">Built with Nuxt 3 · Vue 3 · Tailwind CSS</div>
      </div>
    </div>
  </footer>
</template>
