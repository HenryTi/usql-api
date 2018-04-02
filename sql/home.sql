CREATE DEFINER=`root`@`%` PROCEDURE `homeItems`(
	IN `user` BIGINT
)
LANGUAGE SQL
NOT DETERMINISTIC
CONTAINS SQL
SQL SECURITY DEFINER
COMMENT ''
BEGIN
	set @user=1;
	select b.id as unit, b.name, b.icon, a.nick as unitNick, a.latestMessage as msgId, a.unread, c.time as msgTime, c.message
		from userUnit a 
			join unit b on a.unit=b.id
			left join userUnitMessage c on a.id=c.userUnit
		where a.user=user;
	
	select b.unit, b.id as role, b.name
		from userUnitRole a 
			join unitRole b on a.unitRole=b.id
			join unit c on b.unit=c.id
		where a.user=user;

	select b.unit, b.id as role, e.name, e.url, e.urlDebug, e.icon
		from userUnitRole a 
			join unitRole b on a.unitRole=b.id
			join unit c on b.unit=c.id
			join unitRoleApp d on b.id=d.unitRole
			join app e on d.app=e.id
		where a.user=user;
		
	select a.id, a.name, a.unit
		from userHomeItem a
		where a.user=user
		order by a.ordinal;
		
	select a.userHomeItem as id, a.unit
		from userHomeItemUnits a join userHomeItem b on a.userHomeItem=b.id
		where b.user=user
		order by id, a.ordinal;
END
