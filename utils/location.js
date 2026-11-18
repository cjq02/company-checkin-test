/**
 * 定位相关工具：Haversine 距离计算
 * 微信小程序 getLocation / chooseLocation 返回 GCJ-02（火星坐标系），保持一致即可。
 */

const EARTH_RADIUS_METERS = 6371000

function toRadians(degrees) {
  return (degrees * Math.PI) / 180
}

/**
 * 计算两点之间的球面距离（单位：米）
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_METERS * c
}

/**
 * 距离格式化：小于 1000 米显示米，否则显示公里
 */
function formatDistance(meters) {
  if (meters === null || meters === undefined) {
    return '未知'
  }
  if (meters >= 1000) {
    return (meters / 1000).toFixed(2) + ' km'
  }
  return Math.round(meters) + ' m'
}

module.exports = {
  EARTH_RADIUS_METERS,
  calculateDistance,
  formatDistance,
}
