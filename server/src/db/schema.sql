-- Jbalna database schema (MySQL 8).
-- "npm run db:setup" drops and recreates the jbalna database, then loads the demo data.

CREATE TABLE users (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(80)  NOT NULL,
  email            VARCHAR(160) NOT NULL UNIQUE,
  password_hash    CHAR(60)     NOT NULL,
  role             ENUM('hiker', 'guide', 'admin') NOT NULL DEFAULT 'hiker',
  -- Guide profile (empty for hikers)
  bio              TEXT NULL,
  region           VARCHAR(80) NULL,
  languages        VARCHAR(160) NULL,          -- comma-separated, e.g. "Arabic, French"
  experience_years TINYINT UNSIGNED NULL,
  verified         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- A trail created by a guide
CREATE TABLE routes (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  guide_id       INT UNSIGNED NOT NULL,
  title          VARCHAR(120) NOT NULL,
  mountain       VARCHAR(80)  NOT NULL,
  region         VARCHAR(80)  NOT NULL,
  description    TEXT NOT NULL,
  level          ENUM('Easy', 'Medium', 'Hard') NOT NULL,
  distance_km    DECIMAL(4,1) UNSIGNED NOT NULL,
  elevation_m    SMALLINT UNSIGNED NOT NULL,
  duration_hours DECIMAL(3,1) UNSIGNED NOT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (guide_id) REFERENCES users(id) ON DELETE CASCADE
);

-- A dated outing on a route
CREATE TABLE hikes (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  route_id      INT UNSIGNED NOT NULL,
  date          DATE NOT NULL,
  price_dt      DECIMAL(6,2) UNSIGNED NOT NULL,
  spots         TINYINT UNSIGNED NOT NULL,
  meeting_point VARCHAR(160) NOT NULL,
  status        ENUM('open', 'cancelled') NOT NULL DEFAULT 'open',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  INDEX idx_hikes_date (date),
  CHECK (spots > 0)
);

-- A hiker on a hike
CREATE TABLE bookings (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hike_id    INT UNSIGNED NOT NULL,
  hiker_id   INT UNSIGNED NOT NULL,
  spots      TINYINT UNSIGNED NOT NULL,
  status     ENUM('confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hike_id) REFERENCES hikes(id) ON DELETE CASCADE,
  FOREIGN KEY (hiker_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (spots > 0)
);

-- A hiker rates a guide after a hike (one review per booking)
CREATE TABLE reviews (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL UNIQUE,
  hiker_id   INT UNSIGNED NOT NULL,
  guide_id   INT UNSIGNED NOT NULL,
  rating     TINYINT UNSIGNED NOT NULL,
  comment    TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (hiker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (guide_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (rating BETWEEN 1 AND 5)
);

CREATE TABLE contact_messages (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(80)  NOT NULL,
  email      VARCHAR(160) NOT NULL,
  subject    VARCHAR(120) NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
