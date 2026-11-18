const storage = require('../../utils/storage')
const api = require('../../utils/api')

const app = getApp()

Page({
  data: {
    role: storage.ROLE.EMPLOYEE,
    username: 'employee',
    password: '',
    defaultPassword: storage.DEFAULT_PASSWORD,
    loading: false,
    version: app.globalData.VERSION,
  },

  onLoad() {
    if (storage.getToken() && storage.getUser()) {
      this.redirectByRole(storage.getUser().role)
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
    if (this.data.loading) {
      return
    }
    if (!this.data.password) {
      wx.showToast({ title: '请输入密码', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    api
      .login({
        role: this.data.role,
        username: this.data.username.trim() || this.data.role,
        password: this.data.password,
      })
      .then((res) => {
        storage.setToken(res.token)
        storage.setUser({ role: res.role, username: res.username })
        this.setData({ loading: false })
        this.redirectByRole(res.role)
      })
      .catch((err) => {
        this.setData({ loading: false })
        wx.showToast({ title: err.message || '登录失败', icon: 'none' })
      })
  },

  redirectByRole(role) {
    const url =
      role === storage.ROLE.ADMIN
        ? '/pages/admin/admin'
        : '/pages/index/index'
    wx.redirectTo({ url })
  },
})
