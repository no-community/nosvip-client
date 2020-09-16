import { createRouter, createWebHashHistory } from 'vue-router'

const routerHistory = createWebHashHistory()

const router = createRouter({
    history: routerHistory,
    routes: [
        {
            path: '/',
            component: () => import("../views/Send.vue")
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