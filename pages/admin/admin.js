const storage = require('../../utils/storage')

Page({
  data: {
    point: null,
    radius: storage.DEFAULT_RADIUS_METERS,
  },

  onLoad() {
    const user = storage.getCurrentUser()
    if (!user || user.role !== storage.ROLE.ADMIN) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
    this.loadPoint()
  },

  onShow() {
    this.loadPoint()
  },

  loadPoint() {
    const point = storage.getCheckinPoint()
    if (point) {
      this.setData({ point, radius: point.radius })
    } else {
      this.setData({ point: null })
    }
  },

  onChooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        const point = {
          latitude: res.latitude,
          longitude: res.longitude,
          name: res.name || '未命名地点',
          address: res.address || '',
          radius: this.data.point ? this.data.point.radius : storage.DEFAULT_RADIUS_METERS,
        }
        storage.setCheckinPoint(point)
        this.setData({ point, radius: point.radius })
        wx.showToast({ title: '打卡点已保存', icon: 'success' })
      },
      fail: (err) => {
        const msg = err && err.errMsg ? err.errMsg : ''
        if (msg.indexOf('cancel') === -1) {
          wx.showToast({ title: '选点失败，请检查定位权限', icon: 'none' })
        }
      },
    })
  },

  onRadiusInput(e) {
    this.setData({ radius: e.detail.value })
  },

  onSaveRadius() {
    const radius = Number(this.data.radius)
    if (!Number.isFinite(radius) || radius <= 0) {
      wx.showToast({ title: '半径须为正数', icon: 'none' })
      return
    }
    const point = this.data.point
    if (!point) {
      wx.showToast({ title: '请先选择打卡点', icon: 'none' })
      return
    }
    point.radius = radius
    storage.setCheckinPoint(point)
    this.setData({ point, radius })
    wx.showToast({ title: '半径已保存', icon: 'success' })
  },

  onViewRecords() {
    wx.navigateTo({ url: '/pages/records/records' })
  },

  onClearRecords() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有打卡记录吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          storage.clearRecords()
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      },
    })
  },

  onLogout() {
    storage.clearCurrentUser()
    wx.redirectTo({ url: '/pages/login/login' })
  },
})
