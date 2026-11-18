mod db;
mod geo;
mod models;

use axum::{
    extract::State,
    http::{header::AUTHORIZATION, HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use db::Db;
use models::*;
use rand::Rng;
use rusqlite::params;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tracing::info;

type AppState = Arc<Db>;
type AppResult<T> = Result<T, AppError>;

enum AppError {
    Unauthorized,
    Forbidden,
    BadRequest(String),
    NotFound(String),
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "请先登录".to_string()),
            AppError::Forbidden => (StatusCode::FORBIDDEN, "无权限操作".to_string()),
            AppError::BadRequest(m) => (StatusCode::BAD_REQUEST, m),
            AppError::NotFound(m) => (StatusCode::NOT_FOUND, m),
            AppError::Internal(m) => (StatusCode::INTERNAL_SERVER_ERROR, m),
        };
        (status, Json(ApiError { message })).into_response()
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let host = std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let db_path = std::env::var("DB_PATH").unwrap_or_else(|_| "./data/checkin.db".to_string());

    let db = Db::open(&db_path)?;
    let state: AppState = Arc::new(db);

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/health", get(health))
        .route("/api/login", post(login))
        .route("/api/logout", post(logout))
        .route("/api/point", get(get_point).put(put_point))
        .route("/api/checkin", post(checkin))
        .route(
            "/api/records",
            get(list_records).delete(clear_records),
        )
        .with_state(state)
        .layer(cors);

    let addr = format!("{}:{}", host, port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    info!("checkin-server listening on http://{}", addr);
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health() -> &'static str {
    "ok"
}

fn generate_token() -> String {
    let mut rng = rand::thread_rng();
    let bytes: [u8; 32] = rng.gen();
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

fn bearer_token(headers: &HeaderMap) -> AppResult<String> {
    let value = headers.get(AUTHORIZATION).ok_or(AppError::Unauthorized)?;
    let value = value.to_str().map_err(|_| AppError::Unauthorized)?;
    let token = value.strip_prefix("Bearer ").ok_or(AppError::Unauthorized)?;
    Ok(token.to_string())
}

fn authenticate(headers: &HeaderMap, db: &Db) -> AppResult<AuthUser> {
    let token = bearer_token(headers)?;
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let (username, role): (String, String) = conn
        .query_row(
            "SELECT username, role FROM sessions WHERE token = ?1",
            params![token],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|_| AppError::Unauthorized)?;
    Ok(AuthUser { username, role })
}

async fn login(
    State(db): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> AppResult<Json<LoginResponse>> {
    if req.role != "admin" && req.role != "employee" {
        return Err(AppError::BadRequest("角色无效".into()));
    }

    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let password: String = conn
        .query_row(
            "SELECT password FROM users WHERE username = ?1 AND role = ?2",
            params![req.username, req.role],
            |row| row.get(0),
        )
        .map_err(|_| AppError::BadRequest("账号或密码错误".into()))?;
    if password != req.password {
        return Err(AppError::BadRequest("账号或密码错误".into()));
    }

    let token = generate_token();
    let now = chrono::Utc::now().timestamp();
    conn.execute(
        "INSERT INTO sessions (token, username, role, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![token, req.username, req.role, now],
    )
    .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(Json(LoginResponse {
        token,
        role: req.role,
        username: req.username,
    }))
}

async fn logout(
    headers: HeaderMap,
    State(db): State<AppState>,
) -> AppResult<StatusCode> {
    let token = bearer_token(&headers)?;
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    conn.execute("DELETE FROM sessions WHERE token = ?1", params![token])
        .map_err(|e| AppError::Internal(e.to_string()))?;
    Ok(StatusCode::NO_CONTENT)
}

async fn get_point(
    headers: HeaderMap,
    State(db): State<AppState>,
) -> AppResult<Json<PointResponse>> {
    authenticate(&headers, &db)?;
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let point = conn.query_row(
        "SELECT name, address, latitude, longitude, radius, updated_at FROM checkin_point WHERE id = 1",
        [],
        |row| {
            Ok(PointResponse {
                name: row.get(0)?,
                address: row.get(1)?,
                latitude: row.get(2)?,
                longitude: row.get(3)?,
                radius: row.get(4)?,
                updated_at: row.get(5)?,
            })
        },
    );

    match point {
        Ok(p) => Ok(Json(p)),
        Err(rusqlite::Error::QueryReturnedNoRows) => {
            Err(AppError::NotFound("尚未设置打卡点".into()))
        }
        Err(e) => Err(AppError::Internal(e.to_string())),
    }
}

async fn put_point(
    headers: HeaderMap,
    State(db): State<AppState>,
    Json(req): Json<PointRequest>,
) -> AppResult<Json<PointResponse>> {
    let user = authenticate(&headers, &db)?;
    if user.role != "admin" {
        return Err(AppError::Forbidden);
    }
    if req.radius <= 0.0 || !req.latitude.is_finite() || !req.longitude.is_finite() {
        return Err(AppError::BadRequest("坐标或半径参数无效".into()));
    }

    let now = chrono::Utc::now().timestamp();
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    conn.execute(
        "INSERT INTO checkin_point (id, name, address, latitude, longitude, radius, updated_at)
         VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             address = excluded.address,
             latitude = excluded.latitude,
             longitude = excluded.longitude,
             radius = excluded.radius,
             updated_at = excluded.updated_at",
        params![
            req.name,
            req.address,
            req.latitude,
            req.longitude,
            req.radius,
            now
        ],
    )
    .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(Json(PointResponse {
        name: req.name,
        address: req.address,
        latitude: req.latitude,
        longitude: req.longitude,
        radius: req.radius,
        updated_at: now,
    }))
}

async fn checkin(
    headers: HeaderMap,
    State(db): State<AppState>,
    Json(req): Json<CheckinRequest>,
) -> AppResult<Json<RecordResponse>> {
    let user = authenticate(&headers, &db)?;
    if user.role != "employee" {
        return Err(AppError::Forbidden);
    }
    if !req.latitude.is_finite() || !req.longitude.is_finite() {
        return Err(AppError::BadRequest("定位参数无效".into()));
    }

    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let (point_name, point_lat, point_lng, radius): (String, f64, f64, f64) = conn
        .query_row(
            "SELECT name, latitude, longitude, radius FROM checkin_point WHERE id = 1",
            [],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
        )
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::BadRequest("尚未设置打卡点".into())
            }
            other => AppError::Internal(other.to_string()),
        })?;

    let distance = geo::distance_meters(req.latitude, req.longitude, point_lat, point_lng);
    if distance > radius {
        return Err(AppError::BadRequest(format!(
            "不在打卡范围内，当前距离 {:.0} 米",
            distance
        )));
    }

    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM records
             WHERE username = ?1 AND date(created_at, 'unixepoch', 'localtime') = ?2",
            params![user.username, today],
            |row| row.get(0),
        )
        .map_err(|e| AppError::Internal(e.to_string()))?;
    if count > 0 {
        return Err(AppError::BadRequest("今日已打卡".into()));
    }

    let now = chrono::Utc::now().timestamp();
    conn.execute(
        "INSERT INTO records (username, point_name, latitude, longitude, distance, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            user.username,
            point_name,
            req.latitude,
            req.longitude,
            distance,
            now
        ],
    )
    .map_err(|e| AppError::Internal(e.to_string()))?;
    let id = conn.last_insert_rowid();

    Ok(Json(RecordResponse {
        id,
        username: user.username,
        point_name,
        latitude: req.latitude,
        longitude: req.longitude,
        distance,
        created_at: now,
    }))
}

async fn list_records(
    headers: HeaderMap,
    State(db): State<AppState>,
) -> AppResult<Json<Vec<RecordResponse>>> {
    authenticate(&headers, &db)?;
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let mut stmt = conn
        .prepare(
            "SELECT id, username, point_name, latitude, longitude, distance, created_at
             FROM records ORDER BY created_at DESC",
        )
        .map_err(|e| AppError::Internal(e.to_string()))?;
    let rows = stmt
        .query_map([], |row| {
            Ok(RecordResponse {
                id: row.get(0)?,
                username: row.get(1)?,
                point_name: row.get(2)?,
                latitude: row.get(3)?,
                longitude: row.get(4)?,
                distance: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| AppError::Internal(e.to_string()))?;

    let mut records = Vec::new();
    for row in rows {
        records.push(row.map_err(|e| AppError::Internal(e.to_string()))?);
    }
    Ok(Json(records))
}

async fn clear_records(
    headers: HeaderMap,
    State(db): State<AppState>,
) -> AppResult<StatusCode> {
    let user = authenticate(&headers, &db)?;
    if user.role != "admin" {
        return Err(AppError::Forbidden);
    }
    let conn = db.conn.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    conn.execute("DELETE FROM records", [])
        .map_err(|e| AppError::Internal(e.to_string()))?;
    Ok(StatusCode::NO_CONTENT)
}
