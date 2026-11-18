/// Haversine 距离计算（单位：米）
const EARTH_RADIUS_METERS: f64 = 6_371_000.0;

fn to_radians(degrees: f64) -> f64 {
    degrees * std::f64::consts::PI / 180.0
}

pub fn distance_meters(lat1: f64, lng1: f64, lat2: f64, lng2: f64) -> f64 {
    let d_lat = to_radians(lat2 - lat1);
    let d_lng = to_radians(lng2 - lng1);
    let a = (d_lat / 2.0).sin().powi(2)
        + to_radians(lat1).cos() * to_radians(lat2).cos() * (d_lng / 2.0).sin().powi(2);
    let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());
    EARTH_RADIUS_METERS * c
}
