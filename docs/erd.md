# ER Diagram specification (ERDPlus)

Create this in ERDPlus using the instructor's Chen-style slide pattern: entities are rectangles, relationships are diamonds, attributes are ovals, and primary key attributes are underlined. Create two entities and connect them with a 1:N relationship.

## Entity: Customer

Primary key: `customer_id`

Attributes: `first_name` (VARCHAR 100), `last_name` (VARCHAR 100), `phone` (VARCHAR 30), `address` (VARCHAR 255), `email` (VARCHAR 255), `latitude` (DECIMAL 9,6), `longitude` (DECIMAL 9,6), `created_at` (DATETIME).

## Entity: Order

Primary key: `order_id`

Attributes: `order_date` (DATETIME), `box_quantity` (INT, positive), `status` (VARCHAR 30), `simulated` (BOOLEAN). The `customer_id` foreign key is introduced by the 1:N relationship in the relational mapping.

## Relationship: places

Customer `0..N` -- places -- Order `1..1`. Every order must refer to one customer; a customer may have no orders or many orders. In the ERDPlus relational conversion, `customer_id` appears as a foreign key in `Order`.

## Relational schema

```sql
CREATE TABLE customer (
  customer_id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `order` (
  order_id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  box_quantity INT NOT NULL CHECK (box_quantity > 0),
  order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  simulated BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);
```

The API runs the MySQL schema in `database.sql`. In ERDPlus, draw Customer and Order entities with Chen notation and a 1:N `Places Order` relationship; map that relationship to `customer_id` in the Order table. The SQL above is the matching relational model.
