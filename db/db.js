const mongoose = require('mongoose')
mongoose.connection.once('connected', () => {
  console.log('数据库已连接')
})
mongoose.connection.once('disconnected', () => {
  console.log('数据库已断开连接')
})
mongoose.connection.once('error', function (err) {
  console.log('Mongoose connection error: ' + err)
}) /** * 连接异常 */
module.exports = mongoose
