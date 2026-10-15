CREATE DATABASE IF NOT EXISTS customer_order_api
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE customer_order_api;

CREATE TABLE IF NOT EXISTS customer (
  customer_id INT NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_id),
  INDEX idx_customer_name (first_name, last_name),
  INDEX idx_customer_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order` (
  order_id INT NOT NULL AUTO_INCREMENT,
  customer_id INT NOT NULL,
  box_quantity INT NOT NULL,
  order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  simulated BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (order_id),
  INDEX idx_order_customer (customer_id),
  INDEX idx_order_simulated (simulated),
  CONSTRAINT chk_order_boxes CHECK (box_quantity > 0),
  CONSTRAINT fk_order_customer FOREIGN KEY (customer_id)
    REFERENCES customer(customer_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
