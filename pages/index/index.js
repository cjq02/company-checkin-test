const storage = require('../../utils/storage')
const api = require('../../utils/api')
const locationUtil = require('../../utils/location')
const timeUtil = require('../../utils/time')

Page({
  data: {
    nowTime: '',
    nowDate: '',
    point: null,
    distance: null,
    distanceText: '获取中...',
    inRange: false,
    canCheckIn: false,
    checkedToday: false,
    locationError: '',
    currentLat: null,
    currentLng: null,
  },

  onLoad() {
    const user = storage.getUser()
    if (!storage.getToken() || !user || user.role !== storage.ROLE.EMPLOYEE) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    this.startTimer()
    this.loadPoint()
    this.refreshLocation()
  },

  onShow() {
    this.startTimer()
    this.loadPoint()
    this.refreshCheckStatus()
  },

  onHide() {
    this.stopTimer()
  },

  onUnload() {
    this.stopTimer()
  },

  startTimer() {
    this.stopTimer()
    this.updateClock()
    this._timer = setInterval(() => this.updateClock(), 1000)
  },

  stopTimer() {
    if (this._timer) {
      clearInterval(this._timer)
      this._timer = null
    }
  },

  updateClock() {
    const now = new Date()
    this.setData({
      nowTime: timeUtil.formatClock(now),
      nowDate: timeUtil.formatDateCn(now),
    })
  },

  loadPoint() {
    api
      .getPoint()
      .then((point) => {
        this.setData({ point })
        this.updateCanCheckIn()
        this.refreshLocation()
      })
      .catch((err) => {
        if (err.statusCode === 404) {
          this.setData({ point: null })
          this.updateCanCheckIn()
        } else {
          wx.showToast({ title: err.message || '加载打卡点失败', icon: 'none' })
        }
      })
  },

  refreshLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        const point = this.data.point
        let distance = null
        let inRange = false
        if (point) {
          distance = locationUtil.calculateDistance(
            res.latitude,
            res.longitude,
            point.latitude,
            point.longitude
          )
          inRange = distance <= point.radius
        }
        this.setData({
          currentLat: res.latitude,
          currentLng: res.longitude,
          distance,
          distanceText: locationUtil.formatDistance(distance),
          inRange,
          locationError: '',
        })
        this.updateCanCheckIn()
      },
      fail: () => {
        this.setData({
          inRange: false,
          locationError: '定位失败，请开启定位权限或检查网络',
        })
        this.updateCanCheckIn()
      },
    })
  },

  refreshCheckStatus() {
    const user = storage.getUser()
    if (!user) {
      return
    }
    api
      .getRecords()
      .then((records) => {
        const today = timeUtil.formatDate(new Date())
        const checkedToday = records.some((record) => {
          return (
            record.username === user.username &&
            timeUtil.formatDate(new Date(record.created_at * 1000)) === today
          )
        })
        this.setData({ checkedToday })
        this.updateCanCheckIn()
      })
      .catch(() => {})
  },

  updateCanCheckIn() {
    const canCheckIn =
      !!this.data.point && this.data.inRange && !this.data.checkedToday
    this.setData({ canCheckIn })
  },

  onCheckIn() {
    if (!this.data.point) {
      wx.showToast({ title: '管理员尚未设置打卡点', icon: 'none' })
      return
    }
    if (!this.data.inRange) {
      wx.showToast({ title: '不在打卡范围内', icon: 'none' })
      return
    }
    if (this.data.checkedToday) {
      wx.showToast({ title: '今日已打卡', icon: 'none' })
      return
    }
    if (this.data.currentLat === null || this.data.currentLng === null) {
      wx.showToast({ title: '定位尚未完成', icon: 'none' })
      return
    }

    api
      .checkin({
        latitude: this.data.currentLat,
        longitude: this.data.currentLng,
      })
      .then(() => {
        wx.showToast({ title: '打卡成功', icon: 'success' })
        this.refreshCheckStatus()
      })
      .catch((err) => {
        wx.showToast({ title: err.message || '打卡失败', icon: 'none' })
      })
  },

  onRefreshLocation() {
    this.refreshLocation()
  },

  onViewRecords() {
    wx.navigateTo({ url: '/pages/records/records' })
  },

  onLogout() {
    api.logout().catch(() => {})
    storage.clearToken()
    storage.clearUser()
    wx.redirectTo({ url: '/pages/login/login' })
  },
})
