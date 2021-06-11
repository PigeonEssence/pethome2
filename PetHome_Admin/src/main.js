
/*================================================导入公共资源===============================================*/
import Vue from 'vue'
import App from './App'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import VueRouter from 'vue-router'
import store from './vuex/store'
import Vuex from 'vuex'
import routes from './routes'

/*========================================我们有自己的后台，不用Mock，注释掉===================================*/
import 'font-awesome/css/font-awesome.min.css'
Vue.use(ElementUI)
Vue.use(VueRouter)
Vue.use(Vuex)

/*==================================================路由配饰===============================================*/
const router = new VueRouter({
  routes
})
/*========================================axios全局基本路径----------------------------============*/
import axios from 'axios'
axios.defaults.baseURL='/api'
Vue.prototype.$http = axios


/*路由前置拦截，拦截所有的URL，登陆判断*/
/*router.beforeEach((to, from, next) => {
  //NProgress.start();
  if (to.path == '/login') {
    sessionStorage.removeItem('user');
  }
  let user = JSON.parse(sessionStorage.getItem('user'));
  if (!user && to.path != '/login') {
    next({ path: '/login' })
  } else {
    next()
  }
})*/

//router.afterEach(transition => {
//NProgress.done();
//});
/*================================================Vue的绑定======================================================*/
new Vue({
  //el: '#app',
  //template: '<App/>',
  router,
  store,
  //components: { App }
  render: h => h(App)
}).$mount('#app')

