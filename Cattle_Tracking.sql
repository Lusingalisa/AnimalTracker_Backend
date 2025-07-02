CREATE DATABASE cattle_tracking;
USE cattle_tracking;


CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  branch_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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

