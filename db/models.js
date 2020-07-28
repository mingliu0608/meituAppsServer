const mongoose = require('./db')
const { dbPort } = require('../config')
const schema = mongoose.Schema
mongoose.connect(dbPort, { useUnifiedTopology: true, useNewUrlParser: true })
//构建图片类schema
var PicsSchema = schema({
  href: {
    type: String,
  },
  desrc: {
    type: String,
  },
  id: {
    type: Number,
  },
  pageUrl: {
    type: String,
  },
  dataOriginal: {
    type: String,
  },
  type: {
    type: String,
  },
  pageNums: {
    type: Number,
    default: 0,
  },
  pages: [{ type: schema.Types.ObjectId, ref: detailPage }],
})
var Pics = mongoose.model('Picture', PicsSchema)

var detailPageSchema = schema({
  _id: schema.Types.ObjectId,
  detailPage: [{ type: schema.Types.ObjectId, ref: Pics }],
  source: {
    type: String,
  },
  width: {
    type: String || Number,
  },
  src: {
    type: String,
  },
  id: {
    type: Number,
  },
  height: {
    type: String || Number,
  },
  alt: {
    type: String,
  },
})
var HuaShengSchema = schema({
  source: [{ type: schema.Types.ObjectId, ref: PicContent }],

  src: {
    type: String,
  },
  id: {
    type: Number,
  },
  path: {
    type: String,
  },
  alt: {
    type: String,
  },
})

var PicContentSchema = schema({
  title: {
    type: String,
  },
  type: {
    type: String,
  },
  pageUrl: {
    type: String,
  },
  id: {
    type: Number,
  },
  content: {
    type: Array,
  },
  // content: [{ type: schema.Types.ObjectId, ref: HuaSheng }],
})
var PicContent = mongoose.model('PicCntent', PicContentSchema)

var HuaSheng = mongoose.model('HuaSheng', HuaShengSchema)

var detailPage = mongoose.model('detailPage', detailPageSchema)

// Pics.find(null, null, {}).then((res) => {
//   console.log(res)
// })
//抛出图片类

module.exports = {
  Pics,
  detailPage,
  HuaSheng,
  PicContent,
}
