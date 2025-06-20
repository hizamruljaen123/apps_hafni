-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.30 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.6.0.6765
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table stunting_db.data_latih
CREATE TABLE IF NOT EXISTS `data_latih` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `usia` bigint NOT NULL,
  `jenis_kelamin` enum('Laki-laki','Perempuan') COLLATE utf8mb4_general_ci NOT NULL,
  `pendapatan` bigint NOT NULL,
  `tinggi` bigint NOT NULL,
  `berat` decimal(10,2) NOT NULL,
  `air_bersih` enum('Ya','Tidak') COLLATE utf8mb4_general_ci NOT NULL,
  `kondisi_sanitasi` enum('Baik','Cukup','Buruk') COLLATE utf8mb4_general_ci NOT NULL,
  `susu_formula` enum('Ya','Tidak') COLLATE utf8mb4_general_ci NOT NULL,
  `status_stunting` enum('Ya','Tidak') COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_data_latih_usia` (`usia`),
  KEY `idx_data_latih_status` (`status_stunting`),
  KEY `idx_data_latih_jenis_kelamin` (`jenis_kelamin`)
) ENGINE=InnoDB AUTO_INCREMENT=1501 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table stunting_db.data_uji_y
CREATE TABLE IF NOT EXISTS `data_uji_y` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_keluarga` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `usia` bigint NOT NULL,
  `jenis_kelamin` enum('Laki-laki','Perempuan') COLLATE utf8mb4_general_ci NOT NULL,
  `pendapatan` bigint NOT NULL,
  `tinggi` decimal(10,2) NOT NULL,
  `berat` decimal(10,2) NOT NULL,
  `air_bersih` enum('Ya','Tidak') COLLATE utf8mb4_general_ci NOT NULL,
  `kondisi_sanitasi` enum('Baik','Cukup','Buruk') COLLATE utf8mb4_general_ci NOT NULL,
  `susu_formula` enum('Ya','Tidak') COLLATE utf8mb4_general_ci NOT NULL,
  `status_stunting` enum('Ya','Tidak') COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_data_uji_usia` (`usia`),
  KEY `idx_data_uji_status` (`status_stunting`),
  KEY `idx_data_uji_jenis_kelamin` (`jenis_kelamin`)
) ENGINE=InnoDB AUTO_INCREMENT=245 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for view stunting_db.v_data_stunting
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `v_data_stunting` (
	`source_table` VARCHAR(10) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`nama_lengkap` VARCHAR(100) NOT NULL COLLATE 'utf8mb4_general_ci',
	`usia` BIGINT(19) NOT NULL,
	`jenis_kelamin` VARCHAR(9) NOT NULL COLLATE 'utf8mb4_general_ci',
	`pendapatan` BIGINT(19) NOT NULL,
	`tinggi` DECIMAL(21,2) NOT NULL,
	`berat` DECIMAL(10,2) NOT NULL,
	`air_bersih` VARCHAR(5) NOT NULL COLLATE 'utf8mb4_general_ci',
	`kondisi_sanitasi` VARCHAR(5) NOT NULL COLLATE 'utf8mb4_general_ci',
	`susu_formula` VARCHAR(5) NOT NULL COLLATE 'utf8mb4_general_ci',
	`status_stunting` VARCHAR(5) NOT NULL COLLATE 'utf8mb4_general_ci'
) ENGINE=MyISAM;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `v_data_stunting`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_data_stunting` AS select 'data_latih' AS `source_table`,`data_latih`.`nama` AS `nama_lengkap`,`data_latih`.`usia` AS `usia`,`data_latih`.`jenis_kelamin` AS `jenis_kelamin`,`data_latih`.`pendapatan` AS `pendapatan`,`data_latih`.`tinggi` AS `tinggi`,`data_latih`.`berat` AS `berat`,`data_latih`.`air_bersih` AS `air_bersih`,`data_latih`.`kondisi_sanitasi` AS `kondisi_sanitasi`,`data_latih`.`susu_formula` AS `susu_formula`,`data_latih`.`status_stunting` AS `status_stunting` from `data_latih` union all select 'data_uji' AS `source_table`,`data_uji_y`.`nama_keluarga` AS `nama_lengkap`,`data_uji_y`.`usia` AS `usia`,`data_uji_y`.`jenis_kelamin` AS `jenis_kelamin`,`data_uji_y`.`pendapatan` AS `pendapatan`,`data_uji_y`.`tinggi` AS `tinggi`,`data_uji_y`.`berat` AS `berat`,`data_uji_y`.`air_bersih` AS `air_bersih`,`data_uji_y`.`kondisi_sanitasi` AS `kondisi_sanitasi`,`data_uji_y`.`susu_formula` AS `susu_formula`,`data_uji_y`.`status_stunting` AS `status_stunting` from `data_uji_y`;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
