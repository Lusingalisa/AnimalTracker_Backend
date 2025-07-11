CREATE DATABASE cattle_tracking;
USE cattle_tracking;


CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  branch_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
ADD COLUMN password VARCHAR(255) NOT NULL AFTER phone;
CREATE TABLE cattle (
  cattle_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  gps_location POINT,
  status ENUM('safe', 'alerted', 'stolen') DEFAULT 'safe',
  rfid_tag VARCHAR(50),
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE branches (
  branch_id INT AUTO_INCREMENT PRIMARY KEY,
  location VARCHAR(100),
  gateway_id VARCHAR(50)
);

CREATE TABLE alerts (
  alert_id INT AUTO_INCREMENT PRIMARY KEY,
  cattle_id INT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  message TEXT,
  status ENUM('sent', 'pending') DEFAULT 'pending',
  FOREIGN KEY (cattle_id) REFERENCES cattle(cattle_id)
);

CREATE TABLE notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  message TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);


INSERT INTO cattle (user_id, gps_location, status, rfid_tag, last_updated) VALUES
(1, POINT(40.7128, -74.0060), 'safe', 'RFID12345', '2025-07-07 10:00:00'),
(1, POINT(51.5074, -0.1278), 'alerted', 'RFID67890', '2025-07-07 10:15:00'),
(1, POINT(48.8566, 2.3522), 'stolen', 'RFID24680', '2025-07-07 10:30:00');

INSERT INTO alerts (cattle_id, message, status, timestamp) VALUES
(1, 'Cattle moved out of safe zone', 'pending', '2025-07-07 10:05:00');
select * from alerts;

ALTER TABLE cattle ADD COLUMN name VARCHAR(100) AFTER user_id;

INSERT INTO cattle (user_id, name, gps_location, status, rfid_tag, last_updated) VALUES
(1, 'Cow 004', POINT(3.2190, 31.7588), 'safe', 'RFID-004-N', '2025-07-10 09:30:00'),
(1, 'Cow 005', POINT(2.2346, 31.1870), 'alerted', 'RFID-005-N', '2025-07-10 08:50:00');

INSERT INTO alerts (cattle_id, message, status, timestamp) VALUES
(2, 'Cattle moved out of safe zone', 'pending', '2025-07-10 08:50:00');

ALTER TABLE cattle ADD COLUMN health_status ENUM('excellent', 'good', 'fair', 'poor') DEFAULT 'good';
CREATE TABLE health_metrics (
  metric_id INT AUTO_INCREMENT PRIMARY KEY,
  cattle_id INT NOT NULL,
  heart_rate INT,
  body_temp DECIMAL(5,2),
  respiration_rate INT,
  activity_level INT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cattle_id) REFERENCES cattle(cattle_id)
);

CREATE TABLE health_alerts (
  alert_id INT AUTO_INCREMENT PRIMARY KEY,
  cattle_id INT NOT NULL,
  metric_id INT,
  alert_type ENUM('heart_rate', 'temperature', 'respiration', 'activity'),
  severity ENUM('warning', 'critical'),
  message TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('new', 'acknowledged', 'resolved') DEFAULT 'new',
  FOREIGN KEY (cattle_id) REFERENCES cattle(cattle_id),
  FOREIGN KEY (metric_id) REFERENCES health_metrics(metric_id)
);

CREATE TABLE geofence_zones (
  zone_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  zone_name VARCHAR(100) NOT NULL,
  zone_type ENUM('pasture', 'danger', 'restricted', 'custom') NOT NULL,
  zone_color VARCHAR(7) DEFAULT '#FF0000',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE geofence_coordinates (
  coord_id INT AUTO_INCREMENT PRIMARY KEY,
  zone_id INT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  sequence INT NOT NULL,
  FOREIGN KEY (zone_id) REFERENCES geofence_zones(zone_id)
);

CREATE TABLE geofence_alerts (
  alert_id INT AUTO_INCREMENT PRIMARY KEY,
  cattle_id INT NOT NULL,
  zone_id INT NOT NULL,
  alert_type ENUM('exit', 'entry', 'proximity') NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active', 'acknowledged', 'resolved') DEFAULT 'active',
  FOREIGN KEY (cattle_id) REFERENCES cattle(cattle_id),
  FOREIGN KEY (zone_id) REFERENCES geofence_zones(zone_id)
);

-- Add geofence alert preferences to users table
ALTER TABLE users ADD COLUMN geofence_alerts_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN geofence_alert_method ENUM('app', 'sms', 'both') DEFAULT 'app';

