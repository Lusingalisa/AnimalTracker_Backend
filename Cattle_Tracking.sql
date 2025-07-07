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
