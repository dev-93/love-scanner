import { createRouter, createWebHistory } from 'vue-router';

const LoveScannerPage = () => import('../pages/LoveScannerPage.vue');
const StretchPage = () => import('../pages/StretchPage.vue');

const routes = [
    {
        path: '/',
        name: 'LoveScanner',
        component: LoveScannerPage,
    },
    {
        path: '/stretch',
        name: 'Stretch',
        component: StretchPage,
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/',
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
