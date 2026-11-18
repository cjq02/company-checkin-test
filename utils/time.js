/**
 * 时间格式化工具
 */

function padZero(value) {
  return value < 10 ? '0' + value : '' + value
}

function formatDate(date) {
  return (
    date.getFullYear() +
    '-' +
    padZero(date.getMonth() + 1) +
    '-' +
    padZero(date.getDate())
  )
}

function formatDateTime(date) {
  return (
    formatDate(date) +
    ' ' +
    padZero(date.getHours()) +
    ':' +
    padZero(date.getMinutes()) +
    ':' +
    padZero(date.getSeconds())
  )
}

function formatClock(date) {
  return (
    padZero(date.getHours()) +
    ':' +
    padZero(date.getMinutes()) +
    ':' +
    padZero(date.getSeconds())
  )
}

function formatDateCn(date) {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return formatDate(date) + ' ' + weekdays[date.getDay()]
}

module.exports = {
  padZero,
  formatDate,
  formatDateTime,
  formatClock,
  formatDateCn,
}
