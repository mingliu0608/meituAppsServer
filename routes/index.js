// 汇总router
const PicRouter = require('./routers/pics')
const router = require('koa-router')()
/**
 * 引用picsrouter
 */
router.use(PicRouter.routes())

module.exports = router
