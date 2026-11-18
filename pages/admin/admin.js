const storage = require('../../utils/storage')
const api = require('../../utils/api')

Page({
  data: {
    point: null,
    radius: storage.DEFAULT_RADIUS_METERS,
  },

  onLoad() {
    const user = storage.getUser()
    if (!storage.getToken() || !user || user.role !== storage.ROLE.ADMIN) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }
  },

  onShow() {
    this.loadPoint()
  },

  loadPoint() {
    api
      .getPoint()
      .then((point) => {
        this.setData({ point, radius: point.radius })
      })
      .catch((err) => {
        if (err.statusCode === 404) {
          this.setData({ point: null })
        } else {
          wx.showToast({ title: err.message || '加载打卡点失败', icon: 'none' })
        }
      })
  },

  onChooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        const radius = this.data.point
          ? this.data.point.radius
          : storage.DEFAULT_RADIUS_METERS
        api
          .setPoint({
            name: res.name || '未命名地点',
            address: res.address || '',
            latitude: res.latitude,
            longitude: res.longitude,
            radius,
          })
          .then((point) => {
            this.setData({ point, radius: point.radius })
            wx.showToast({ title: '打卡点已保存', icon: 'success' })
          })
          .catch((err) => {
            wx.showToast({ title: err.message || '保存失败', icon: 'none' })
          })
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

    api
      .setPoint({
        name: point.name,
        address: point.address,
        latitude: point.latitude,
        longitude: point.longitude,
        radius,
      })
      .then((updated) => {
        this.setData({ point: updated, radius: updated.radius })
        wx.showToast({ title: '半径已保存', icon: 'success' })
      })
      .catch((err) => {
        wx.showToast({ title: err.message || '保存失败', icon: 'none' })
      })
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
          api
            .clearRecords()
            .then(() => {
              wx.showToast({ title: '已清空', icon: 'success' })
            })
            .catch((err) => {
              wx.showToast({ title: err.message || '清空失败', icon: 'none' })
            })
        }
      },
    })
  },

  onLogout() {
    api.logout().catch(() => {})
    storage.clearToken()
    storage.clearUser()
    wx.redirectTo({ url: '/pages/login/login' })
  },
})
