/**
 * 后端 API 客户端
 *
 * 当前（备案审核中）：走本地 SSH 隧道 127.0.0.1:13100 → 服务器 3100 端口。
 * 隧道命令：ssh -N -L 13100:127.0.0.1:3100 cjq.tencent
 *
 * 备案通过、微信后台添加 request合法域名 https://jacquin.top 后，
 * 将 BASE_URL 改为：'https://jacquin.top/checkin-api'
 * （nginx 已配置该路径反代到后端 3100 端口，HTTPS 证书已就绪）
 *
 * 开发者工具需勾选「详情 → 本地设置 → 不校验合法域名...」。
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
