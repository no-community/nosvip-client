import { createRouter, createWebHashHistory } from 'vue-router'

const routerHistory = createWebHashHistory()

const router = createRouter({
    history: routerHistory,
    routes: [
        {
            path: '/',
            component: () => import("../views/Home.vue")
        },
        {
            path: '/r/:rid/:mode?',
            component: () => import('../views/Send.vue')
        }
    ]
})

export default router