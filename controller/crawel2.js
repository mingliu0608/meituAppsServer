const Crawler = require('crawler')
const { HuaSheng, PicContent } = require('../db/models')
const fs = require('fs')
const mongoose = require('../db/db')
const request = require('request')
const { resolve } = require('path')
//generator a id
const generatorId = () => {
  const timeStamp = new Date().getTime()
  let randInt = Math.floor(Math.random() * 100000)
  return randInt + parseInt(timeStamp)
}
const c = new Crawler({
  rateLimit: 30,
  maxConnections: 2,
  //控制最大并发，default is 10
})
const c4 = new Crawler({
  //控制最大并发，default is 10
  rateLimit: 30,
  maxConnections: 2,
})
//get data
const getPicData = (page = 1) => {
  return new Promise((resolve, reject) => {
    try {
      //妹子网的爬取逻辑
      c.queue([
        {
          uri: `http://bbs.voc.com.cn/forum-50-${i}.html`,

          //传递参数

          // agentClass: Agent,
          // proxy: 'http://112.85.45.187:4517',
          retries: 1, //adding socks5 https agent
          // referer: 'https://www.mzitu.com/taiwan/',
          userAgent: randAgent(),
          callback: async (error, res, done) => {
            if (error) {
              Promise.reject(error)
            } else {
              var $ = res.$
              // $ 默认为 Cheerio 解析器
              // 它是核心jQuery的精简实现，可以按照jQuery选择器语法快速提取DOM元素
              //返回每个图片的href
              //cherrio正确获取attr的方式

              let rawData = $('a.a1')
              for (let i = 0; i < rawData.length; i++) {
                let attr = rawData.eq(i).attr()
                let { href, title } = attr
                let urls = 'http://bbs.voc.com.cn/' + href
                const id = generatorId()
                const _id = mongoose.Types.ObjectId()

                let newPIcCon = new PicContent({
                  _id,
                  title,
                  pageUrl: urls,
                  id,
                  type: '美女',
                })
                newPIcCon.save((err) => {
                  if (err) {
                    console.log(err)
                  }
                })
              }

              resolve(res)
              // console.log(picsData)
            }
            done()
          },
        },
      ])
    } catch (error) {
      reject(error)
    }
  })
}
function wait(timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout)
  })
}
//获取首页信息，得到每页的url
async function getAllPage(startPage = 1, endPage) {
  // let datas = {}
  try {
    for (i = startPage; i < endPage; i++) {
      await getPicData(i).then((res) => {
        // console.log(res)
        // Object.assign(datas, ...res)
        console.log(`第${i}页url数据保存完毕`)
      })
    }
  } catch (err) {
    console.log(err.message)
    // } finally {
    //   fs.appendFileSync(fileName, JSON.stringify(datas, null, '\t'))
    //   console.log(res)
    // }
  }
}
// getAllPage(1, 10)

const getpicsDetailPage = (url) => {
  return new Promise((resolve, reject) => {
    try {
      c.queue([
        {
          uri: url,

          callback: (error, res, done) => {
            if (error) {
              Promise.reject(error)
            } else {
              try {
                const $ = res.$
                //css选择器获取页面的总页面数
                let totalpage = $('.pagenavi a:nth-last-child(2) span')[0]
                  .children[0].data

                resolve(totalpage)
              } catch (error) {
                console.log(error)
              }
            }
            done()
          },
        },
      ])
    } catch (error) {
      reject(error)
    }
  })
}
//获取页面的uri并且保存文件进数据库且写入文件
const getPicUrl = (page, url, sourceid, cat = '') => {
  const c2 = new Crawler({
    maxConnections: 2,
    // agentClass: Agent,
    // proxy: 'http://112.85.45.187:4517',
    retries: 1, //adding socks5 https agent
    rateLimit: 20,
    referer: 'https://www.mzitu.com/' + cat,
    //控制最大并发，default is 10
    callback: (error, res, done) => {
      if (error) {
        throw new Error(error)
      } else {
        try {
          const $ = res.$
          let rawData = $('.main-image img')
          console.log($('.main-image img').attr('src'))
          if (rawData) {
            let { src, width, height, alt } = rawData[0].attribs
            const id = generatorId()
            let result = {
              src,
              width,
              height,
              alt,
              id,
              detailPage: sourceid,
              source: `/img/${id}.png`,
            }
            let fileName = `${result.id}.png`
            request({
              host: '122.239.165.235',
              port: 25040,
              url: result.src,
              method: 'GET',
              headers: {
                Referer: 'https://www.mzitu.com/' + cat,
                'User-Agent': randAgent(),
              },
            })
              //批量写入数据监听close时间触发回调，保存source，等信息到数据库
              .pipe(fs.createWriteStream('./img/' + fileName))
              .on('close', () => {
                let newPic = new detailPage(result)
                newPic.save((err) => {
                  if (err) {
                    console.log(`保存detailPage失败`)
                  }
                })
              })
          }
        } catch (error) {
          console.log(`请求出错:` + error.message)
        }
      }
      done()
    },
  })
  let urls = []
  for (i = 1; i <= page; i++) {
    try {
      urls.push({ uri: url + '/' + i, userAgent: randAgent() })
    } catch (error) {
      console.log(error)
      continue
    }
  }
  c2.queue(urls)
}

//查找并且新增数据url字段
const findSourceId = (pageUrl) => {
  return new Promise((resolve, reject) => {
    PicContent.findOne({ pageUrl }, (err, res) => {
      if (err) {
        console.log(`查找$src:{pageUrl}`)
        reject(`查找$src:{pageUrl}`)
      } else {
        resolve(res._id)
      }
    })
  })
}

function Run(type = '') {
  Pics.find({ type }, null, null, async (err, res) => {
    if (err) {
      console.log(err)
    } else {
      for (i in res) {
        try {
          //获取首页图的详情首页
          let firstPageUrl = res[i].pageUrl
          await getpicsDetailPage(firstPageUrl).then((pagenum) => {
            //
            console.log(`地址为${firstPageUrl}的图片共有${pagenum}张数据`)
            //暂时设置为5,防止封ip
            findSourceId(firstPageUrl).then((id) => {
              getPicUrl(pagenum, firstPageUrl, id)
            })
          })
        } catch (error) {
          console.log(error)
        }
      }
    }
  })
}
//填充子文档
PicContent.find({}).exec(async (err, datas) => {
  if (err) {
    console.log(err)
  } else {
    for (let i of datas) {
      HuaSheng.find({ source: i._id }, null, null, (err, res) => {
        if (err) {
          console.log(err)
        } else {
          const data = []
          for (let ele of res) {
            // i.content.push(ele)
            data.push(ele)
          }
          console.log(data)
          PicContent.update(
            { _id: i._id },
            { $set: { content: data } },
            (err, res) => {
              if (err) {
                console.log(err)
              } else {
                console.log(i._id)
                // console.log(res)
              }
            }
          )
        }
      })

      // console.log(i.content)
    }
  }
})

function downLoadandSava(uri, title) {
  return new Promise((resolve, reject) => {
    // 处理每页的数据img selector{div a img }
    c4.queue({
      uri,
      callback: async (error, res, done) => {
        if (error) {
          reject(error)
        } else {
          var $ = res.$

          //cherrio正确获取attr的方式
          let imgsUrl = $('td img[alt="按此在新窗口浏览图片"]')
          let rand = generatorId()
          console.log(imgsUrl.length)
          await findSourceId(uri).then(async (_id) => {
            // async (err, _id) => {
            // if (err) {
            //   console.log(err)
            // } else {
            for (let i = 0; i < imgsUrl.length; i++) {
              let attr = imgsUrl.eq(i).attr()

              let { src } = attr

              let result = {
                source: _id,
                src,
                id: rand,
                alt: title,
                path: `${_id}.jpg`,
              }
              let fileName = result.path
              await request(
                {
                  timeout: 3000,
                  url: src,
                  method: 'GET',
                  headers: {
                    'User-Agent': randAgent(),
                  },
                },
                () => {
                  let newPic = new HuaSheng(result)
                  newPic.save((err) => {
                    if (err) {
                      console.log(`保存detailPage失败`)
                    }
                    console.log(`保存${title}_${i}成功`)
                    resolve('ok')
                  })
                }
              )
              //批量写入数据监听close时间触发回调，保存source，等信息到数据库
            }
            // }
            // }
          })
        }
        done()
      },
    })
    // }
    // })
  })
}
function runIt() {
  PicContent.find(null, null, null, (err, res) => {
    if (err) {
      console.log(err)
    } else {
      console.log(res.length)
      for (i = 0; i < res.length; i++) {
        let { title, pageUrl } = res[i]
        downLoadandSava(pageUrl, title)
      }
    }
  })
}

runIt()
function randAgent() {
  const userAgents = [
    'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0',
    'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)',
    'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)',
    'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:2.0.1) Gecko/20100101 Firefox/4.0.1',
    'Mozilla/5.0 (Windows NT 6.1; rv:2.0.1) Gecko/20100101 Firefox/4.0.1',
    'Opera/9.80 (Macintosh; Intel Mac OS X 10.6.8; U; en) Presto/2.8.131 Version/11.11',
    'Opera/9.80 (Windows NT 6.1; U; en) Presto/2.8.131 Version/11.11',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_0) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.56 Safari/535.11',
    'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; Maxthon 2.0)',
    'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; TencentTraveler 4.0)',
    'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)',
    'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; The World)',
    'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; Trident/4.0; SE 2.X MetaSr 1.0; SE 2.X MetaSr 1.0; .NET CLR 2.0.50727; SE 2.X MetaSr 1.0)',
    'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; 360SE)',
    'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; Avant Browser)',
    'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)',
    'Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_3_3 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8J2 Safari/6533.18.5',
    'Mozilla/5.0 (iPod; U; CPU iPhone OS 4_3_3 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8J2 Safari/6533.18.5',
    'Mozilla/5.0 (iPad; U; CPU OS 4_3_3 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8J2 Safari/6533.18.5',
    'Mozilla/5.0 (Linux; U; Android 2.3.7; en-us; Nexus One Build/FRF91) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1',
    'MQQBrowser/26 Mozilla/5.0 (Linux; U; Android 2.3.7; zh-cn; MB200 Build/GRJ22; CyanogenMod-7) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1',
    'Opera/9.80 (Android 2.3.4; Linux; Opera Mobi/build-1107180945; U; en-GB) Presto/2.8.149 Version/11.10',
    'Mozilla/5.0 (Linux; U; Android 3.0; en-us; Xoom Build/HRI39) AppleWebKit/534.13 (KHTML, like Gecko) Version/4.0 Safari/534.13',
    'Mozilla/5.0 (BlackBerry; U; BlackBerry 9800; en) AppleWebKit/534.1+ (KHTML, like Gecko) Version/6.0.0.337 Mobile Safari/534.1+',
    'Mozilla/5.0 (hp-tablet; Linux; hpwOS/3.0.0; U; en-US) AppleWebKit/534.6 (KHTML, like Gecko) wOSBrowser/233.70 Safari/534.6 TouchPad/1.0',
    'Mozilla/5.0 (SymbianOS/9.4; Series60/5.0 NokiaN97-1/20.0.019; Profile/MIDP-2.1 Configuration/CLDC-1.1) AppleWebKit/525 (KHTML, like Gecko) BrowserNG/7.1.18124',
    'Mozilla/5.0 (compatible; MSIE 9.0; Windows Phone OS 7.5; Trident/5.0; IEMobile/9.0; HTC; Titan)',
    'UCWEB7.0.2.37/28/999',
    'NOKIA5700/ UCWEB7.0.2.37/28/999',
    'Openwave/ UCWEB7.0.2.37/28/999',
    'Mozilla/4.0 (compatible; MSIE 6.0; ) Opera/UCWEB7.0.2.37/28/999',
    'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0',
    'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; Trident/4.0; InfoPath.2; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; 360SE)',
    'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; Trident/4.0; SE 2.X MetaSr 1.0; SE 2.X MetaSr 1.0; .NET CLR 2.0.50727; SE 2.X MetaSr 1.0)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_0) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.56 Safari/535.11',
    'Mozilla/5.0 (Linux; U; Android 2.2.1; zh-cn; HTC_Wildfire_A3333 Build/FRG83D) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1',
    'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; en-us) AppleWebKit/534.50 (KHTML, like Gecko) Version/5.1 Safari/534.50',
    'Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_3_3 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8J2 Safari/6533.18.5',
    'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; Trident/4.0; TencentTraveler 4.0; .NET CLR 2.0.50727)',
    'MQQBrowser/26 Mozilla/5.0 (Linux; U; Android 2.3.7; zh-cn; MB200 Build/GRJ22; CyanogenMod-7) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1',
    'Mozilla/5.0 (Windows NT 6.1; rv:2.0.1) Gecko/20100101 Firefox/4.0.1',
    'Mozilla/5.0 (Androdi; Linux armv7l; rv:5.0) Gecko/ Firefox/5.0 fennec/5.0',
    'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; The World)',
    'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; Maxthon 2.0)',
    'Opera/9.80 (Windows NT 6.1; U; en) Presto/2.8.131 Version/11.11',
    'Opera/9.80 (Android 2.3.4; Linux; Opera mobi/adr-1107051709; U; zh-cn) Presto/2.8.149 Version/11.10',
    'UCWEB7.0.2.37/28/999',
    'NOKIA5700/ UCWEB7.0.2.37/28/999',
    'Openwave/ UCWEB7.0.2.37/28/999',
    'Mozilla/4.0 (compatible; MSIE 6.0; ) Opera/UCWEB7.0.2.37/28/999',
  ]

  let randInt = Math.floor(Math.random() * 48)
  return userAgents[randInt]
}

//请求url ,并且获取图片数量和urls

module.exports = {
  Run,
  getPicUrl,
  getpicsDetailPage,
  findSourceId,
  getAllPage,
}
