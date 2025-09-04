CREATE DATABASE vehicle_services CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'appuser'@'localhost' IDENTIFIED BY 'apppass';
GRANT ALL PRIVILEGES ON vehicle_services.* TO 'appuser'@'localhost';
FLUSH PRIVILEGES;