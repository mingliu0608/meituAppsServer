const axios = require('axios')
function getPicData(params) {
  const url = 'http://api.tianapi.com/meinv/'
  const key = 'f365deb2d1df822317734ca2303a333d'
  const { num, page, rand, word } = params
  return new Promise((resolve, reject) => {
    try {
      // 发送 POST 请求
      axios({
        method: 'get',
        url: url,
        params: {
          key,
          num,
          rand,
          page,
          word,
        },
      }).then((res) => {
        resolve(res.data)
      })
    } catch (error) {
      console.log(error)
      reject(error)
    }
  })
}

module.exports = {
  getPics: async (ctx) => {
    let { num = 10, page = 1 } = ctx.request.body
    await getPicData({ num, page }).then((res) => {
      ctx.body = res
    })
  },
  randPics: async (ctx) => {
    let { rand = 1, num = 10 } = ctx.request.body
    await getPicData({ num, rand, page }).then((res) => {
      ctx.body = res
    })
  },
  searchPics: async (ctx) => {
    let { num = 10, page = 1, word } = ctx.request.body
    await getPicData({ num, page, word }).then((res) => {
      ctx.body = res
    })
  },
}
