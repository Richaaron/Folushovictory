import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingView
    },
    {
      path: '/login/:portal?',
      name: 'login',
      component: LoginView,
      props: true
    },
    {
      path: '/report/:studentId',
      name: 'student-report',
      component: () => import('../views/common/StudentReportView.vue'),
      props: true
    },
    {
      path: '/admin',
      component: () => import('../layouts/AdminLayout.vue'),
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('../views/admin/AdminDashboard.vue')
        },
        {
          path: 'teachers',
          name: 'admin-teachers',
          component: () => import('../views/admin/TeacherManagement.vue')
        },
        {
          path: 'classes',
          name: 'admin-classes',
          component: () => import('../views/admin/ClassManagement.vue')
        },
        {
          path: 'students',
          name: 'admin-students',
          component: () => import('../views/admin/StudentManagement.vue')
        },
        {
          path: 'broadsheet',
          name: 'admin-broadsheet',
          component: () => import('../views/admin/MasterBroadsheet.vue')
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('../views/SettingsView.vue')
        }
      ]
    },
    {
      path: '/teacher',
      component: () => import('../layouts/TeacherLayout.vue'),
      children: [
        {
          path: '',
          name: 'teacher-dashboard',
          component: () => import('../views/teacher/TeacherDashboard.vue')
        },
        {
          path: 'scores/:id',
          name: 'teacher-scores',
          component: () => import('../views/teacher/ScoreEntryView.vue')
        }
      ]
    },
    {
      path: '/parent',
      component: () => import('../layouts/ParentLayout.vue'),
      children: [
        {
          path: '',
          name: 'parent-dashboard',
          component: () => import('../views/parent/ParentDashboard.vue')
        }
      ]
    }
  ]
})

export default router
