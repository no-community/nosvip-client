import { createRouter, createWebHistory } from 'vue-router'

const routerHistory = createWebHistory()

const router = createRouter({
    history: routerHistory,
    routes: [
        {
            path: '/',
            component: () => import("../views/Home.vue")
        },
        {
            path: '/s/:rid',
            component: () => import("../views/Send.vue")
        },
        {
            path: '/r/:rid',
            component: () => import('../views/Receive.vue'),
        }
    ]
})

export default router