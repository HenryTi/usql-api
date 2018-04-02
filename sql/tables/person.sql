CREATE TABLE `person` (
	`id` BIGINT(20) NOT NULL AUTO_INCREMENT,
	`firstName` TINYTEXT NULL COMMENT '名',
	`surName` TINYTEXT NULL COMMENT '姓',
	`middleName` TINYTEXT NULL COMMENT '中间名',
	`gender` TINYINT(4) NOT NULL DEFAULT '-1',
	PRIMARY KEY (`id`)
)
COMMENT='比如开发者，机构联系人'
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
;
