// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss'],
  app: {
    head: {
      title: '聚闪耀 FlashMeet - 计算相遇的概率，渲染心动的瞬间',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '聚闪耀 - 线下聚会互动大屏系统，让每一场聚会都闪耀' },
      ],
    },
  },
});
