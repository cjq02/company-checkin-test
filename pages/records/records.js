const storage = require('../../utils/storage')
const locationUtil = require('../../utils/location')
const timeUtil = require('../../utils/time')

Page({
  data: {
    records: [],
    isAdmin: false,
  },

  onShow() {
    const user = storage.getCurrentUser()
    if (!user) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }

    const records = storage.getRecords().map((record) => {
      return Object.assign({}, record, {
        timeText: timeUtil.formatDateTime(new Date(record.timestamp)),
        distanceText: locationUtil.formatDistance(record.distance),
      })
    })

    this.setData({
      records,
      isAdmin: user.role === storage.ROLE.ADMIN,
    })
  },

  onClearRecords() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有打卡记录吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          storage.clearRecords()
          this.onShow()
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      },
    })
  },
})
