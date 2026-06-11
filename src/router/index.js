import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'
import InterviewerView from '../views/InterviewerView.vue'
import CandidateView from '../views/CandidateView.vue'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/interviewer', name: 'interviewer', component: InterviewerView },
    { path: '/candidate', name: 'candidate', component: CandidateView }
  ]
})

export default router
