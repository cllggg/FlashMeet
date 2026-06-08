<template>
  <section class="relative py-32 overflow-hidden">
    <!-- 背景光晕 -->
    <div
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] rounded-full blur-3xl opacity-25 pointer-events-none"
      style="background: radial-gradient(circle, #667eea 0%, transparent 60%);"
    />

    <div class="max-w-4xl mx-auto px-6 text-center">
      <div data-reveal class="fm-reveal">
        <p class="text-sm text-white/40 tracking-[0.3em] uppercase mb-6">Get Started</p>
        <h2 class="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          <span class="fm-text-gradient-rainbow">让下一场聚会</span>
          <br />
          闪耀起来
        </h2>
        <p class="text-white/55 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          不论你是想办一场破冰活动，还是为你的产品增加社交属性，
          我们的团队都准备好和你聊聊了。
        </p>
      </div>

      <div
        data-reveal
        class="fm-reveal fm-reveal-delay-1 flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
      >
        <a class="fm-btn fm-btn-primary text-lg px-10 py-5" href="mailto:hi@flashmeet.example.com">
          📩 预约产品演示
        </a>
        <a class="fm-btn fm-btn-ghost text-lg px-10 py-5" href="#playground">
          再次体验 Demo
        </a>
      </div>

      <div
        data-reveal
        class="fm-reveal fm-reveal-delay-2 flex flex-wrap gap-x-8 gap-y-3 justify-center text-sm text-white/50"
      >
        <span>📧 hi@flashmeet.example.com</span>
        <span>🐦 @FlashMeetApp</span>
        <span>📱 扫码加入内测群</span>
      </div>
    </div>
  </section>
</template>
