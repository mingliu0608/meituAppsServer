const router = require('koa-router')()
const api = require('../../controller/picsController')
const { get } = require('mongoose')
const picsController = require('../../controller/picsController')
const getPicRouter = router.get('/getpics', picsController.getPics)

module.exports = getPicRouter
