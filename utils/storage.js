/**
 * 本地缓存存储层
 * 说明：微信小程序无原生 SQLite，本演示用 wx.setStorageSync 模拟持久化。
 * 所有 key / 角色 / 默认值集中为常量，避免魔法值。
 */

const STORAGE_KEYS = {
  CURRENT_USER: 'checkin_current_user',
  CHECKIN_POINT: 'checkin_point',
  RECORDS: 'checkin_records',
}

const ROLE = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
}

const DEFAULT_PASSWORD = '123456'
const DEFAULT_RADIUS_METERS = 200

function get(key, defaultValue) {
  try {
    const value = wx.getStorageSync(key)
    if (value === '' || value === undefined || value === null) {
      return defaultValue
    }
    return value
  } catch (e) {
    return defaultValue
  }
}

function set(key, value) {
  try {
    wx.setStorageSync(key, value)
  } catch (e) {
    // 忽略存储异常
  }
}

function remove(key) {
  try {
    wx.removeStorageSync(key)
  } catch (e) {
    // 忽略存储异常
  }
}

function getCurrentUser() {
  return get(STORAGE_KEYS.CURRENT_USER, null)
}

function setCurrentUser(user) {
  set(STORAGE_KEYS.CURRENT_USER, user)
}

function clearCurrentUser() {
  remove(STORAGE_KEYS.CURRENT_USER)
}

function getCheckinPoint() {
  return get(STORAGE_KEYS.CHECKIN_POINT, null)
}

function setCheckinPoint(point) {
  set(STORAGE_KEYS.CHECKIN_POINT, point)
}

function getRecords() {
  return get(STORAGE_KEYS.RECORDS, [])
}

function addRecord(record) {
  const records = getRecords()
  records.unshift(record)
  set(STORAGE_KEYS.RECORDS, records)
}

function clearRecords() {
  set(STORAGE_KEYS.RECORDS, [])
}

module.exports = {
  STORAGE_KEYS,
  ROLE,
  DEFAULT_PASSWORD,
  DEFAULT_RADIUS_METERS,
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  getCheckinPoint,
  setCheckinPoint,
  getRecords,
  addRecord,
  clearRecords,
}
