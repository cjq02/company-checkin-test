/**
 * 本地会话存储 + 常量定义
 * 说明：业务数据已改为走后端 API（utils/api.js），本地只保存 token 和当前用户信息。
 */

const ROLE = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
}

const DEFAULT_PASSWORD = '123456'
const DEFAULT_RADIUS_METERS = 200

const SESSION_KEYS = {
  TOKEN: 'checkin_token',
  USER: 'checkin_user',
}

function getToken() {
  return wx.getStorageSync(SESSION_KEYS.TOKEN) || ''
}

function setToken(token) {
  wx.setStorageSync(SESSION_KEYS.TOKEN, token)
}

function clearToken() {
  wx.removeStorageSync(SESSION_KEYS.TOKEN)
}

function getUser() {
  return wx.getStorageSync(SESSION_KEYS.USER) || null
}

function setUser(user) {
  wx.setStorageSync(SESSION_KEYS.USER, user)
}

function clearUser() {
  wx.removeStorageSync(SESSION_KEYS.USER)
}

module.exports = {
  ROLE,
  DEFAULT_PASSWORD,
  DEFAULT_RADIUS_METERS,
  getToken,
  setToken,
  clearToken,
  getUser,
  setUser,
  clearUser,
}
