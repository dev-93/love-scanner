import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { inject } from '@vercel/analytics' // ⬅️ 추가

// 🔎 레퍼럴(유입경로) 추적 로직 추가
const urlParams = new URLSearchParams(window.location.search);
const referrer = urlParams.get('ref') || urlParams.get('utm_source');
if (referrer) {
  sessionStorage.setItem('ls_referrer', referrer);
  console.log(`[Referral Detected] Source: ${referrer}`);
}

// 📊 Vercel Analytics 활성화
inject(); 

createApp(App).mount('#app')
