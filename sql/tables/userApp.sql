CREATE TABLE `userApp` (
	`id` BIGINT(20) NOT NULL AUTO_INCREMENT,
	`user` BIGINT(20) NOT NULL,
	`app` INT(11) NOT NULL,
	`nick` TINYTEXT NULL COMMENT 'null? app name',
	`icon` TINYTEXT NULL,
	`latestMessage` BIGINT(20) NULL DEFAULT NULL,
	`unread` INT(11) NOT NULL DEFAULT '0',
	PRIMARY KEY (`id`),
	UNIQUE INDEX `id_user_app` (`user`, `app`, `id`)
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
;

CREATE TABLE `userAppApplet` (
	`userApp` INT(11) NOT NULL,
	`applet` INT(11) NOT NULL,
	`roles` TINYTEXT NULL COMMENT 'comma seperated roles, [all]',
	PRIMARY KEY (`userApp`, `applet`)
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
;

CREATE TABLE `userAppMessages` (
	`userApp` BIGINT(20) NOT NULL,
	`id` BIGINT(20) NOT NULL AUTO_INCREMENT,
	`message` TEXT NULL,
	`read` BIT(1) NOT NULL DEFAULT b'0',
	PRIMARY KEY (`id`),
	UNIQUE INDEX `userApp_id` (`userApp`, `id`)
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
;
