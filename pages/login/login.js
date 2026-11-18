const storage = require('../../utils/storage')

Page({
  data: {
    role: storage.ROLE.EMPLOYEE,
    username: 'employee',
    password: '',
    defaultPassword: storage.DEFAULT_PASSWORD,
  },

  onLoad() {
    // 已登录则直接跳转到对应首页
    const user = storage.getCurrentUser()
    if (user) {
      this.redirectByRole(user.role)
    }
  },

  onSelectRole(e) {
    const role = e.currentTarget.dataset.role
    const patch = { role }
    const current = this.data.username
    if (!current || current === 'admin' || current === 'employee') {
      patch.username = role === storage.ROLE.ADMIN ? 'admin' : 'employee'
    }
    this.setData(patch)
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value })
  },

  onLogin() {
    const password = this.data.password
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' })
      return
    }
    if (password !== storage.DEFAULT_PASSWORD) {
      wx.showToast({ title: '密码错误', icon: 'none' })
      return
    }

    const role = this.data.role
    const name = this.data.username.trim() || role
    storage.setCurrentUser({ role, name, loginAt: Date.now() })
    this.redirectByRole(role)
  },

  redirectByRole(role) {
    const url =
      role === storage.ROLE.ADMIN
        ? '/pages/admin/admin'
        : '/pages/index/index'
    wx.redirectTo({ url })
  },
})
