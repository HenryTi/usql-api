CREATE TABLE `app` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`name` TINYTEXT NOT NULL,
	`unit` INT(11) NULL DEFAULT NULL,
	`url` TINYTEXT NULL,
	`debugUrl` TINYTEXT NULL,
	`icon` TINYTEXT NULL,
	PRIMARY KEY (`id`)
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
;

CREATE TABLE `applet` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`name` TINYTEXT NOT NULL,
	`developer` INT(11) NULL DEFAULT NULL,
	`url` TINYTEXT NULL,
	`debugUrl` TINYTEXT NULL,
	`secret` TINYTEXT NULL COMMENT '登录token用',
	PRIMARY KEY (`id`)
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
;

CREATE TABLE `appAppletRole` (
	`app` INT(11) NOT NULL,
	`applet` INT(11) NOT NULL,
	`roleName` VARCHAR(50) NOT NULL COLLATE 'ucs2_unicode_ci',
	`name` TINYTEXT NULL,
	`icon` TINYTEXT NULL,
	`comment` TINYTEXT NULL,
	PRIMARY KEY (`app`, `applet`, `roleName`)
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
;
