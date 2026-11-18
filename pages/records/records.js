const storage = require('../../utils/storage')
const api = require('../../utils/api')
const locationUtil = require('../../utils/location')
const timeUtil = require('../../utils/time')

Page({
  data: {
    records: [],
    isAdmin: false,
  },

  onShow() {
    const user = storage.getUser()
    if (!storage.getToken() || !user) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }

    api
      .getRecords()
      .then((records) => {
        const list = records.map((record) => {
          return Object.assign({}, record, {
            timeText: timeUtil.formatDateTime(new Date(record.created_at * 1000)),
            distanceText: locationUtil.formatDistance(record.distance),
            userName: record.username,
            pointName: record.point_name,
          })
        })
        this.setData({
          records: list,
          isAdmin: user.role === storage.ROLE.ADMIN,
        })
      })
      .catch((err) => {
        wx.showToast({ title: err.message || '加载记录失败', icon: 'none' })
      })
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
              this.onShow()
              wx.showToast({ title: '已清空', icon: 'success' })
            })
            .catch((err) => {
              wx.showToast({ title: err.message || '清空失败', icon: 'none' })
            })
        }
      },
    })
  },
})
