user unit app

return in token:
{
    id: 
    unit:
    app:
    access:
}

CREATE DEFINER=`root`@`%` PROCEDURE `appToken`(
	IN `user` BIGINT,
	IN `unit` INT,
	IN `app` INT

)
LANGUAGE SQL
NOT DETERMINISTIC
CONTAINS SQL
SQL SECURITY DEFINER
COMMENT ''
BEGIN
    select secret from app where id=app;

	select c.access
	    from userUnit a 
	        join userUnitRole b on a.id=b.userUnit
	        join userRoleApp c on b.unitRole=c.unitRole
	    where a.user=user and a.unit=unit and c.app=app;
END
