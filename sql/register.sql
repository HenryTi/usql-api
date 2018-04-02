CREATE DEFINER=`root`@`%` PROCEDURE `register`(
	IN `name` VARCHAR(100),
	IN `nickName` VARCHAR(100),
	IN `countryCode` SMALLINT,
	IN `mobile` BIGINT,
	IN `email` VARCHAR(100),
	IN `password` VARCHAR(100),
	IN `passwordType` ENUM('char','bcrypt')
)
LANGUAGE SQL
NOT DETERMINISTIC
CONTAINS SQL
SQL SECURITY DEFINER
COMMENT '注册用户'
BEGIN
	if exists(select users.nickname from users where users.name=name) then
	begin
		select 1;
	end;
	elseif exists(select users.nickname from users where users.countryCode=countryCode and users.mobile=mobile) then
	begin
		select 2;
	end;
	elseif exists(select users.nickname from users where users.email=email) then 
	begin
		select 3;
	end;
	else begin
		insert into users (name, nickName, countryCode, mobile, email)
			values (name, nickName, countryCode, mobile, email);
		insert into logins (id, password, passwordType)
			values (@@identity, password, passwordType);
		select 0;
	end;
	end if;
END