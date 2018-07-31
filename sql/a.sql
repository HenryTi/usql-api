__proc_exit: BEGIN
    DECLARE `_$id` BIGINT;DECLARE `_$p` INT;DECLARE `_$c` INT;DECLARE `_$sep` VARCHAR(10);
    DECLARE `_$rn` VARCHAR(10);DECLARE `_$arrn` VARCHAR(10);DECLARE `_$mainn` VARCHAR(10);
    DECLARE `_$dataLen` INT;DECLARE `_$date` DATETIME(6);DECLARE `_$historyDate` DATETIME(6);
    DECLARE `_$sheetType` INT;DECLARE `_$row` INT;DECLARE `_$sec` VARCHAR(3900);
    DECLARE `_type` VARCHAR(20);DECLARE `_subject` VARCHAR(100);
    DECLARE `_discription` VARCHAR(300);DECLARE `_content` TEXT;
    DECLARE `_mename` VARCHAR(100);DECLARE `_menick` VARCHAR(200);
    DECLARE `_meicon` VARCHAR(200);DECLARE `_$to_` INT;DECLARE `_$to$` INT;
    DECLARE `_to_touser` BIGINT;DECLARE `_$cc_` INT;DECLARE `_$cc$` INT;
    DECLARE `_cc_ccuser` BIGINT;DECLARE `_msg_1` BIGINT;DECLARE `_flowid_2` BIGINT;
    DECLARE `_userid_3` BIGINT;DECLARE `_startstate_4` VARCHAR(20);
    DECLARE `_$_tuid7` BIGINT;DECLARE `_$tuid7` BIGINT;DECLARE `_$_tuid8` BIGINT;
    DECLARE `_$tuid8` BIGINT;DECLARE `__order_9` INT;DECLARE `__order_11` INT;
    DECLARE `_$_tuid17` BIGINT;DECLARE `_$tuid17` BIGINT;DECLARE `__order_18` INT;
    DECLARE `__order_20` INT;DECLARE `__order_22` INT;DECLARE `__order_23` INT;
    DECLARE `__order_24` INT;DECLARE `_mtext_5` TEXT;DECLARE `__order_29` INT;
    DECLARE `__order_31` INT;
    SET SESSION group_concat_max_len=100000;
    DROP TEMPORARY TABLE IF EXISTS `_$send`;
    CREATE TEMPORARY TABLE `_$send` (`to` BIGINT NULL,`msg` BIGINT NULL,`action` VARCHAR(50) NULL,`notify` TINYINT NOT NULL,PRIMARY KEY(`to`,`msg`,`action`)) ENGINE=MyISAM;
    DROP TEMPORARY TABLE IF EXISTS `_$message_send`;
    CREATE TEMPORARY TABLE `_$message_send` (`msg` BIGINT NULL,`data` TEXT NULL) ENGINE=MyISAM;
    SET `_$date`=UTC_TIMESTAMP(6);
    SET `_$historyDate`=`_$date`;
    SET `_$dataLen`=LENGTH(`_$data`);
    SET `_$c`=1;
    SET `_$sep`=CHAR(9);
    SET `_$rn`=CHAR(10);
    SET `_$arrn`=CONCAT(`_$rn`,`_$rn`);
    SET `_$mainn`=CONCAT(`_$rn`,`_$rn`,`_$rn`);
    SET `_$p`=LOCATE(`_$sep`,`_$data`,`_$c`);
    SET `_$sec`=SUBSTRING(`_$data`,`_$c`,`_$p`-`_$c`);
    IF LENGTH(`_$sec`)=0 THEN
    SET `_type`=NULL;
    ELSE
    SET `_type`=`_$sec`;
    END IF;
    SET `_$c`=`_$p`+1;
    SET `_$p`=LOCATE(`_$sep`,`_$data`,`_$c`);
    SET `_$sec`=SUBSTRING(`_$data`,`_$c`,`_$p`-`_$c`);
    IF LENGTH(`_$sec`)=0 THEN
    SET `_subject`=NULL;
    ELSE
    SET `_subject`=`_$sec`;
    END IF;
    SET `_$c`=`_$p`+1;
    SET `_$p`=LOCATE(`_$sep`,`_$data`,`_$c`);
    SET `_$sec`=SUBSTRING(`_$data`,`_$c`,`_$p`-`_$c`);
    IF LENGTH(`_$sec`)=0 THEN
    SET `_discription`=NULL;
    ELSE
    SET `_discription`=`_$sec`;
    END IF;
    SET `_$c`=`_$p`+1;
    SET `_$p`=LOCATE(`_$sep`,`_$data`,`_$c`);
    SET `_$sec`=SUBSTRING(`_$data`,`_$c`,`_$p`-`_$c`);
    IF LENGTH(`_$sec`)=0 THEN
    SET `_content`=NULL;
    ELSE
    SET `_content`=`_$sec`;
    END IF;
    SET `_$c`=`_$p`+1;
    SET `_$p`=LOCATE(`_$sep`,`_$data`,`_$c`);
    SET `_$sec`=SUBSTRING(`_$data`,`_$c`,`_$p`-`_$c`);
    IF LENGTH(`_$sec`)=0 THEN
    SET `_mename`=NULL;
    ELSE
    SET `_mename`=`_$sec`;
    END IF;
    SET `_$c`=`_$p`+1;
    SET `_$p`=LOCATE(`_$sep`,`_$data`,`_$c`);
    SET `_$sec`=SUBSTRING(`_$data`,`_$c`,`_$p`-`_$c`);
    IF LENGTH(`_$sec`)=0 THEN
    SET `_menick`=NULL;
    ELSE
    SET `_menick`=`_$sec`;
    END IF;
    SET `_$c`=`_$p`+1;
    SET `_$p`=LOCATE(`_$rn`,`_$data`,`_$c`);
    SET `_$sec`=SUBSTRING(`_$data`,`_$c`,`_$p`-`_$c`);
    IF LENGTH(`_$sec`)=0 THEN
    SET `_meicon`=NULL;
    ELSE
    SET `_meicon`=`_$sec`;
    END IF;
    SET `_$c`=`_$p`+1;
    SET `_$to_`=`_$c`;
    SET `_$to$`=LOCATE(`_$arrn`,`_$data`,`_$to_`);
    SET `_$cc_`=`_$to$`+2;
    SET `_$cc$`=LOCATE(`_$arrn`,`_$data`,`_$cc_`);
    DROP TEMPORARY TABLE IF EXISTS `_ret`;
    CREATE TEMPORARY TABLE `_ret` (`id` BIGINT NULL) ENGINE=MyISAM;
    SET `_startstate_4`='$';

    IF NOT (`_mename` IS NULL) THEN
        INSERT INTO `tv_user` (`name`,`nick`,`icon`,`$unit`,`id`) 
            VALUES (`_mename`,`_menick`,`_meicon`,`_$unit`,`_$user`)
            ON DUPLICATE KEY UPDATE  
            `name`=`_mename`,`nick`=`_menick`,`icon`=`_meicon`;
    END IF;

    INSERT INTO `tv_message` (`$unit`,`fromuser`,`fromunit`,`type`,`subject`,`discription`,`content`,`date`)
        VALUES (`_$unit`,`_$user`,`_$unit`,`_type`,`_subject`,`_discription`,`_content`,`_$date`);
    SET `_$tuid8`=LAST_INSERT_ID();
    SET `_msg_1`=`_$tuid8`;
    INSERT INTO `tv_folder` (`$unit`,`me`,`tag`,`message`) 
        VALUES (`_$unit`,`_$user`,'$me',`_msg_1`)
        ON DUPLICATE KEY UPDATE`$unit`=`_$unit`;
        
    IF NOT (exists(SELECT `msg` FROM `_$send` 
        WHERE 1=1 AND `msg`=`_msg_1` AND `to`=`_$user` AND `action`='$me')) THEN
        INSERT INTO `_$send` (`to`,`msg`,`action`,`notify`) 
            VALUES (`_$user`,`_msg_1`,'$me',0);
    END IF;
    INSERT INTO `tv_folder` (`$unit`,`me`,`tag`,`message`) 
        VALUES (`_$unit`,`_$user`,'$',`_msg_1`)
        ON DUPLICATE KEY UPDATE`$unit`=`_$unit`;
    SET `_$row`=1;
    SET `_$c`=`_$to_`;

__loop_12: WHILE 1=1 DO
        IF (`_$c` IS NULL OR `_$c`>=`_$to$`) THEN
            LEAVE __loop_12;
        END IF;
        SET `_$p`=LOCATE(`_$rn`,`_$data`,`_$c`);
        SET `_$sec`=SUBSTRING(`_$data`,`_$c`,`_$p`-`_$c`);
        IF LENGTH(`_$sec`)=0 THEN
            SET `_to_touser`=NULL;
        ELSE
            SET `_to_touser`=`_$sec`;
        END IF;
        SET `_$c`=`_$p`+1;
        IF (`_to_touser` IS NULL OR `_to_touser`=0) THEN
            SELECT `_$user` INTO `_to_touser`;
        END IF;
        INSERT INTO `tv_flow` (`$unit`,`message`,`prev`,`user`,`date`,`state`)
            VALUES (`_$unit`,`_msg_1`,0,`_to_touser`,`_$date`,`_startstate_4`);
        SET `_$tuid17`=LAST_INSERT_ID();
        SET `_flowid_2`=`_$tuid17`;
        INSERT INTO `tv_desk` (`read`,`flow`,`$unit`,`me`,`message`)
            VALUES (0,`_flowid_2`,`_$unit`,`_to_touser`,`_msg_1`) 
            ON DUPLICATE KEY UPDATE
            `read`=0,`flow`=`_flowid_2`;
        IF NOT (exists(SELECT `msg` FROM `_$send` 
            WHERE 1=1 AND `msg`=`_msg_1` AND `to`=`_to_touser` AND `action`='$desk')) THEN
        INSERT INTO `_$send` (`to`,`msg`,`action`,`notify`) 
            VALUES (`_to_touser`,`_msg_1`,'$desk',1);
        END IF;
        INSERT INTO `tv_folder` (`$unit`,`me`,`tag`,`message`) 
            VALUES (`_$unit`,`_to_touser`,'$pass',`_msg_1`)
            ON DUPLICATE KEY UPDATE`$unit`=`_$unit`;
        IF NOT (exists(SELECT `msg` FROM `_$send` 
            WHERE 1=1 AND `msg`=`_msg_1` AND `to`=`_to_touser` AND `action`='$pass')) THEN
        INSERT INTO `_$send` (`to`,`msg`,`action`,`notify`) 
            VALUES (`_to_touser`,`_msg_1`,'$pass',0);
        END IF;
        INSERT INTO `tv_folder` (`$unit`,`me`,`tag`,`message`) 
            VALUES (`_$unit`,`_to_touser`,'$',`_msg_1`)
            ON DUPLICATE KEY UPDATE`$unit`=`_$unit`;
        INSERT INTO `tv_branch` (`done`,`$unit`,`message`,`flow`,`to`)
            VALUES (0,`_$unit`,`_msg_1`,`_flowid_2`,`_to_touser`) 
            ON DUPLICATE KEY UPDATE
            `done`=0;
        SET `_$row`=`_$row`+1;
    END WHILE;

    INSERT INTO `tv_state` (`donecount`,`branchcount`,`$unit`,`message`)
        VALUES (0,(SELECT COUNT(`to`) FROM `tv_branch` 
        WHERE 1=1 AND `$unit`=`_$unit` AND `message`=`_msg_1`),`_$unit`,`_msg_1`)
        ON DUPLICATE KEY UPDATE 
        `donecount`=0,`branchcount`=(SELECT COUNT(`to`)
        FROM `tv_branch` 
        WHERE 1=1 AND `$unit`=`_$unit` AND `message`=`_msg_1`);
    SELECT CONCAT_WS('\t',a.`id`,a.`fromuser`,a.`fromunit`,a.`type`,UNIX_TIMESTAMP(CONVERT_TZ(a.`date`,'+00:00',@@global.time_zone)),IFNULL(a.`subject`,''),IFNULL(a.`discription`,''),IFNULL(a.`content`,''),b.`branchcount`,b.`donecount`,'','$') INTO `_mtext_5`
        FROM `tv_message` AS a
        JOIN `tv_state` AS b ON a.`id`=b.`message` AND b.`$unit`=`_$unit`
        WHERE 1=1 AND a.`$unit`=`_$unit` AND a.`id`=`_msg_1`;
    SET `_$row`=1;
    SET `_$c`=`_$cc_`;

  __loop_27: WHILE 1=1 DO
        IF (`_$c` IS NULL OR `_$c`>=`_$cc$`) THEN
            LEAVE __loop_27;
        END IF;
        SET `_$p`=LOCATE(`_$rn`,`_$data`,`_$c`);
        SET `_$sec`=SUBSTRING(`_$data`,`_$c`,`_$p`-`_$c`);
        IF LENGTH(`_$sec`)=0 THEN
            SET `_cc_ccuser`=NULL;
        ELSE
            SET `_cc_ccuser`=`_$sec`;
        END IF;
        SET `_$c`=`_$p`+1;
        INSERT INTO `tv_folder` (`$unit`,`me`,`tag`,`message`) 
            VALUES (`_$unit`,`_cc_ccuser`,'$cc',`_msg_1`)
            ON DUPLICATE KEY UPDATE`$unit`=`_$unit`;
        IF NOT (exists(SELECT `msg` FROM `_$send` 
            WHERE 1=1 AND `msg`=`_msg_1` AND `to`=`_cc_ccuser` AND `action`='$cc')) THEN
        INSERT INTO `_$send` (`to`,`msg`,`action`,`notify`) 
            VALUES (`_cc_ccuser`,`_msg_1`,'$cc',1);
        END IF;
        INSERT INTO `tv_folder` (`$unit`,`me`,`tag`,`message`) 
            VALUES (`_$unit`,`_cc_ccuser`,'$',`_msg_1`)
            ON DUPLICATE KEY UPDATE`$unit`=`_$unit`;
        SET `_$row`=`_$row`+1;
    END WHILE;

    INSERT INTO `_$message_send` (`data`,`msg`) 
        VALUES (`_mtext_5`,`_msg_1`)
        ON DUPLICATE KEY UPDATE `data`=`_mtext_5`;
    INSERT INTO `_ret` (`id`)
        SELECT `_msg_1` AS `id`;
    SELECT a.`to`,a.`msg`,sum(a.`notify`) AS `notify`,GROUP_CONCAT(a.`action`) AS `action`,(SELECT `data`
        FROM `_$message_send` 
        WHERE 1=1 AND `msg`=a.`msg`) AS `data`
        FROM `_$send` AS a
        WHERE 1=1
        GROUP BY a.`to`,a.`msg`;
    SELECT `id` AS `id`
        FROM `_ret`
        WHERE 1=1;
END
