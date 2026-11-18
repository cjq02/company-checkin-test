/**
 * 后端 API 客户端
 * 开发阶段使用 HTTP + 服务器公网 IP。
 * 注意：真机预览需要在微信公众平台配置 request 合法域名（HTTPS），
 * 或在开发者工具「详情 → 本地设置」勾选「不校验合法域名...」。
 */

const BASE_URL = 'http://127.0.0.1:13100'

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
      fail() {
        reject({ message: '无法连接服务器，请检查网络' })
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
