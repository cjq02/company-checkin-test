/**
 * 后端 API 客户端
 *
 * 当前：走公网 HTTPS https://jacquin.top/checkin-api → nginx 反代到后端 3100 端口。
 * 手机在任何网络都能访问（无需 SSH 隧道 / 内网穿透）。
 *
 * 备案审核中：真机调试需勾选「详情 → 本地设置 → 不校验合法域名...」。
 * 备案通过后：在微信后台把 https://jacquin.top 加到 request合法域名，
 * 即可发布体验版，无需再改代码。
 */

const BASE_URL = 'https://jacquin.top/checkin-api'

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
