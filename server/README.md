# 打卡后端（Rust / axum / SQLite）

微信小程序打卡功能的后端服务：管理员地图选点、员工按距离打卡，数据存 SQLite，多用户共享。

## 技术栈

- axum 0.7 + tokio
- rusqlite（bundled，自带 SQLite，无系统库依赖）
- serde / chrono / rand / tower-http

## API

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/health` | 健康检查 | 无 |
| POST | `/api/login` | 登录，返回 token | 无 |
| POST | `/api/logout` | 退出（删除 token） | 登录 |
| GET | `/api/point` | 获取打卡点 | 登录 |
| PUT | `/api/point` | 设置/修改打卡点 | admin |
| POST | `/api/checkin` | 打卡（服务端算距离、防重复） | employee |
| GET | `/api/records` | 打卡记录 | 登录 |
| DELETE | `/api/records` | 清空记录 | admin |

登录请求体：

```json
{ "role": "admin", "username": "admin", "password": "123456" }
```

后续请求带请求头：`Authorization: Bearer <token>`

设置打卡点请求体：

```json
{
  "name": "公司",
  "address": "北京市...",
  "latitude": 39.9087,
  "longitude": 116.3975,
  "radius": 200
}
```

打卡请求体：`{ "latitude": 39.9087, "longitude": 116.3975 }`

## 本地运行

```bash
cargo run --release
```

环境变量（可选）：

- `HOST` 默认 `0.0.0.0`
- `PORT` 默认 `3000`
- `DB_PATH` 默认 `./data/checkin.db`

## 服务器部署

见 `deploy.sh`：安装 rustup、拉代码、编译、注册 systemd。
