// Run this script from the v0 Scripts runner
import "dotenv/config";
import mysql from "mysql2/promise"

async function main() {
  const { MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD } = process.env

  if (!MYSQL_HOST || !MYSQL_DATABASE || !MYSQL_USER || !MYSQL_PASSWORD) {
    console.log("[setup-db] Missing MYSQL_* env vars.")
    process.exit(1)
  }

  const conn = await mysql.createConnection({
    host: MYSQL_HOST,
    port: MYSQL_PORT ? Number(MYSQL_PORT) : 3306,
    database: MYSQL_DATABASE,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    multipleStatements: true,
    timezone: "Z",
  })

  const schema = `
  CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(32),
    email VARCHAR(120),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    make VARCHAR(80) NOT NULL,
    model VARCHAR(80) NOT NULL,
    year INT,
    vin VARCHAR(32),
    plate VARCHAR(32),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS service_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    duration_minutes INT NOT NULL,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00
  );

  CREATE TABLE IF NOT EXISTS technicians (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    skill_level ENUM('junior','mid','senior') DEFAULT 'mid'
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    service_type_id INT NOT NULL,
    technician_id INT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('scheduled','in_progress','completed','canceled') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (service_type_id) REFERENCES service_types(id),
    FOREIGN KEY (technician_id) REFERENCES technicians(id)
  );

  CREATE TABLE IF NOT EXISTS status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    status ENUM('scheduled','in_progress','completed','canceled') NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
  );
  `

  await conn.query(schema)

  // --- Handle indexes safely ---
  async function ensureIndex(table: string, index: string, column: string) {
    const [rows] = await conn.query<any[]>(
      `SHOW INDEX FROM ${table} WHERE Key_name = ?`,
      [index]
    );
    if (rows.length === 0) {
      await conn.query(`CREATE INDEX ${index} ON ${table}(${column})`);
      console.log(`[setup-db] Created index ${index} on ${table}(${column})`);
    } else {
      console.log(`[setup-db] Index ${index} already exists on ${table}`);
    }
  }

  await ensureIndex("appointments", "idx_appt_start", "start_time");
  await ensureIndex("appointments", "idx_appt_status", "status");

  // --- Seed data ---
  const seed = `
  INSERT INTO service_types (name, duration_minutes, base_price)
  VALUES ('Oil Change', 30, 49.99),
         ('Brake Inspection', 45, 59.99),
         ('Full Service', 120, 199.99)
  ON DUPLICATE KEY UPDATE name = VALUES(name);

  INSERT INTO technicians (name, skill_level)
  VALUES ('Alex Johnson', 'senior'),
         ('Priya Singh', 'mid'),
         ('Diego Martinez', 'junior')
  ON DUPLICATE KEY UPDATE name = VALUES(name);
  `
  await conn.query(seed)

  console.log("[setup-db] Schema created and seed data inserted.")
  await conn.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
