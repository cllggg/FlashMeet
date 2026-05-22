/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module 'qrcode.vue' {
  import type { DefineComponent } from 'vue';
  const QRCodeVue: DefineComponent<any, any, any>;
  export default QRCodeVue;
}
