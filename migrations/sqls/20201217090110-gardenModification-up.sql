/* Replace with your SQL commands */
ALTER TABLE
  garden
ADD
  COLUMN pic_profil VARCHAR(150) NOT NULL,
ADD
  COLUMN description VARCHAR(500) NOT NULL,
ADD
  COLUMN exposition VARCHAR(150) NOT NULL,
ADD
  COLUMN address VARCHAR(150) NOT NULL,
ADD
  COLUMN pic_plan VARCHAR(150) NOT NULL,
ADD
  COLUMN zone_number INT NOT NULL;