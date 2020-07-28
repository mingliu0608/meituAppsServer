//封装网络请求模块
const axios = require('axios')
module.exports = {
  requests: function (option) {
    const instance = axios.create({
      //请求Ip
      // baseURL: 'http://192.168.0.111:8080',
      timeout: 50000,
    })
    //对请求相应做拦截器
    instance.interceptors.request.use((config) => {
      return config
    })
    instance.interceptors.response.use(
      (config) => {
        // console.log('----------------axios已拦截到返回的数据，将只展示data部分-------------------')
        return config.data
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    return instance(option)
  },
}
