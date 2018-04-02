use thusers;
create table users (
	id bigint not null auto_increment,
	name varchar(100) character set ucs2,
	nickName varchar(100) character set ucs2,
	countryCode smallint,
	mobile bigint,
	email varchar(100) character set utf8,
	primary key(id)
);

create table logins (
	id bigint not null,
	password varchar(100),
	passwordType enum('char', 'bcrypt'),
	primary key(id)
);

CREATE TABLE `roles` (
	`id` TINYINT(3) UNSIGNED NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(100) NOT NULL COLLATE 'ucs2_unicode_ci',
	PRIMARY KEY (`id`)
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
AUTO_INCREMENT=3
;

CREATE TABLE `userRoles` (
	`user` BIGINT(20) NOT NULL,
	`role` TINYINT(4) NOT NULL,
	PRIMARY KEY (`user`, `role`)
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
;
