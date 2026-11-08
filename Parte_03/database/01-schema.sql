CREATE DATABASE IF NOT EXISTS petmatch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE petmatch;

CREATE TABLE IF NOT EXISTS pets (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    especie ENUM('cachorro', 'gato') NOT NULL
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS adotantes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf CHAR(11) NOT NULL UNIQUE,
    email VARCHAR(254) NOT NULL,
    telefone VARCHAR(30) NULL,
    cidade VARCHAR(100) NULL,
    nascimento DATE NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS pre_cadastros (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    adotante_id INT UNSIGNED NOT NULL,
    pet_id INT UNSIGNED NULL,
    moradia ENUM('casa', 'apartamento') NOT NULL,
    mensagem VARCHAR(500) NULL,
    termo_aceito BOOLEAN NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (adotante_id) REFERENCES adotantes (id),
    FOREIGN KEY (pet_id) REFERENCES pets (id),
    CHECK (termo_aceito = 1)
) ENGINE = InnoDB;
