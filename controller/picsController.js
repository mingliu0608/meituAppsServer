const { PicContent } = require('../db/models')

module.exports = {
  //处理pics请求
  getPics: async (ctx) => {
    try {
      let { limit = 10, skip = 0, type = '美女' } = ctx.query
      await PicContent.find({ type }, null, { limit, skip }, (err, res) => {
        if (err) {
          console.log(err)
          ctx.body = {
            code: 400,
            msg: err.message,
          }
        } else {
          console.log(res)
          ctx.body = {
            code: 200,
            data: res,
          }
        }
      })
    } catch (err) {
      console.log(err)
      ctx.body = {
        code: 400,
        msg: err.message,
      }
    }
  },
}
