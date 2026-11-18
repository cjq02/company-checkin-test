const storage = require('../../utils/storage')
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
  },

  onLoad() {
    const user = storage.getCurrentUser()
    if (!user || user.role !== storage.ROLE.EMPLOYEE) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    this.setData({ point: storage.getCheckinPoint() })
    this.startTimer()
    this.refreshLocation()
  },

  onShow() {
    this.setData({ point: storage.getCheckinPoint() })
    this.startTimer()
    this.refreshLocation()
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
          distance,
          distanceText: locationUtil.formatDistance(distance),
          inRange,
          locationError: '',
        })
        this.refreshCheckStatus()
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
    const user = storage.getCurrentUser()
    if (!user) {
      return
    }
    const today = timeUtil.formatDate(new Date())
    const checkedToday = storage.getRecords().some((record) => {
      return (
        record.userName === user.name &&
        timeUtil.formatDate(new Date(record.timestamp)) === today
      )
    })
    this.setData({ checkedToday })
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

    const user = storage.getCurrentUser()
    storage.addRecord({
      id: Date.now().toString(),
      userName: user.name,
      timestamp: Date.now(),
      pointName: this.data.point.name,
      distance: Math.round(this.data.distance || 0),
    })
    wx.showToast({ title: '打卡成功', icon: 'success' })
    this.refreshCheckStatus()
    this.updateCanCheckIn()
  },

  onRefreshLocation() {
    this.refreshLocation()
  },

  onViewRecords() {
    wx.navigateTo({ url: '/pages/records/records' })
  },

  onLogout() {
    storage.clearCurrentUser()
    wx.redirectTo({ url: '/pages/login/login' })
  },
})
