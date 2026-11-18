/**
 * 后端 API 客户端
 *
 * 当前（备案审核中）：走本地 SSH 隧道，局域网 IP 192.168.31.10:13100 → 服务器 3100。
 * 隧道命令：ssh -N -L 0.0.0.0:13100:127.0.0.1:3100 cjq.tencent
 * 手机需与电脑同一 WiFi，真机调试弹窗勾选「局域网模式」。
 *
 * 备案通过、微信后台加好 request合法域名 https://jacquin.top 后，
 * 再切回：'https://jacquin.top/checkin-api'（nginx 已配好反代，证书就绪）。
 */

const BASE_URL = 'http://192.168.31.10:13100'

const storage = require('./storage')

function request(path, method, data) {
  return new Promise((resolve, reject) => {
    const token = storage.getToken()
    const header = {
      'content-type': 'application/json',
    }
    if (token) {
      header.Authorization = 'Bearer ' + token
    }

    wx.request({
      url: BASE_URL + path,
      method: method,
      data: data || {},
      header: header,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          const message =
            res.data && res.data.message ? res.data.message : '请求失败（' + res.statusCode + '）'
          reject({ statusCode: res.statusCode, message })
        }
      },
      fail(err) {
        const detail = err && err.errMsg ? err.errMsg : '未知错误'
        reject({ message: '请求失败：' + detail })
      },
    })
  })
}

const api = {
  BASE_URL,

  health() {
    return request('/api/health', 'GET')
  },

  login(data) {
    return request('/api/login', 'POST', data)
  },

  logout() {
    return request('/api/logout', 'POST')
  },

  getPoint() {
    return request('/api/point', 'GET')
  },

  setPoint(data) {
    return request('/api/point', 'PUT', data)
  },

  checkin(data) {
    return request('/api/checkin', 'POST', data)
  },

  getRecords() {
    return request('/api/records', 'GET')
  },

  clearRecords() {
    return request('/api/records', 'DELETE')
  },
}

module.exports = api
