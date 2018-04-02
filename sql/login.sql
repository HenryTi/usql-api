CREATE DEFINER=`root`@`%` PROCEDURE `login`(
	IN `user` VARCHAR(100),
	IN `countryCode` TINYINT,
	IN `mobile` BIGINT,
	IN `email` VARCHAR(100)
)
LANGUAGE SQL
NOT DETERMINISTIC
CONTAINS SQL
SQL SECURITY DEFINER
COMMENT ''
BEGIN
	declare id bigint;
	declare password varchar(100);

	if (user is not null) then
		select users.id, users.name, logins.password
			into id, user, password
			from users join logins on users.id=logins.id
			where users.name=user;
	elseif (mobile is not null) then
		select users.id, users.name, logins.password
			into id, user, password
			from users join logins on users.id=logins.id
			where users.countryCode=countryCode and users.mobile=mobile;
	elseif (email is not null) then
		select users.id, users.name, logins.password
			into id, user, password
			from users join logins on users.id=logins.id
			where users.email=email;
	end if;

	if (id is not null) then begin
		select group_concat(roles.name separator ',') into @role
			from userRoles join roles on userRoles.role=roles.id 
			where userRoles.user=id;
		select password, id, user as name, @role as role;
	end;
	end if;
END
