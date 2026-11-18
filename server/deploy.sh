#!/usr/bin/env bash
# 在服务器上执行：bash deploy.sh <repo-url>
set -euo pipefail

REPO_URL="${1:-git@github.com:cjq02/company-checkin-server.git}"
DIR="/opt/checkin-server"

# 1. 安装 Rust（若未安装）
if ! command -v cargo >/dev/null 2>&1; then
  echo ">>> 安装 rustup..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
  . "$HOME/.cargo/env"
fi

# 2. 拉取代码
if [ -d "$DIR/.git" ]; then
  echo ">>> 更新代码..."
  cd "$DIR"
  git pull --ff-only
else
  echo ">>> 克隆代码..."
  git clone "$REPO_URL" "$DIR"
  cd "$DIR"
fi

# 3. 编译
echo ">>> 编译 release..."
cargo build --release

# 4. 注册 systemd 服务
echo ">>> 注册 systemd..."
cat > /etc/systemd/system/checkin-server.service <<EOF
[Unit]
Description=Checkin Server (Rust)
After=network.target

[Service]
Type=simple
WorkingDirectory=$DIR
Environment=HOST=0.0.0.0
Environment=PORT=3000
Environment=DB_PATH=$DIR/data/checkin.db
ExecStart=$DIR/target/release/checkin-server
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

mkdir -p "$DIR/data"
systemctl daemon-reload
systemctl enable checkin-server
systemctl restart checkin-server

echo ">>> 完成。查看状态：systemctl status checkin-server"
echo ">>> 健康检查：curl http://127.0.0.1:3000/api/health"
