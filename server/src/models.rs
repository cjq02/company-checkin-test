use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub role: String,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub role: String,
    pub username: String,
}

#[derive(Debug, Deserialize)]
pub struct PointRequest {
    pub name: String,
    pub address: String,
    pub latitude: f64,
    pub longitude: f64,
    pub radius: f64,
}

#[derive(Debug, Serialize)]
pub struct PointResponse {
    pub name: String,
    pub address: String,
    pub latitude: f64,
    pub longitude: f64,
    pub radius: f64,
    pub updated_at: i64,
}

#[derive(Debug, Deserialize)]
pub struct CheckinRequest {
    pub latitude: f64,
    pub longitude: f64,
}

#[derive(Debug, Serialize)]
pub struct RecordResponse {
    pub id: i64,
    pub username: String,
    pub point_name: String,
    pub latitude: f64,
    pub longitude: f64,
    pub distance: f64,
    pub created_at: i64,
}

#[derive(Debug, Clone)]
pub struct AuthUser {
    pub username: String,
    pub role: String,
}

#[derive(Debug, Serialize)]
pub struct ApiError {
    pub message: String,
}
