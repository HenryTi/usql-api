import * as _ from 'lodash';
import { getRunner } from "../tv/runner";
import { packParam } from "../core/packParam";
import { afterAction } from "../tv/afterAction";
import { pushToCenter } from "../core";

const $unitx = '$unitx';
const usqlSheetMessage = 'sheetMessage';
const usqlGetSheetTo = 'getSheetTo';
export async function processSheetMessage(unit:number, db:string, sheetMessage:any): Promise<{to:number}[]> {
    let runner = await getRunner($unitx);
    let {no, discription, /*to, */usq, id:sheet, state, user, name} = sheetMessage;
    // 上句中的to removed，由下面调用unitx来计算
    let sheetName = name;
    let stateName = state;
    let paramsGetSheetTo:any[] = [usq, sheetName, stateName];
    let tos:any[] = await runner.query(usqlGetSheetTo, unit, user, paramsGetSheetTo);
    let prePostSame:boolean = false;
    /*
    let toUsers:{toUser:number}[] = sheetTo.map(v => {
        return {toUser: v.to}
    });
    */
    if (tos.length === 0) {
        tos.push({to: user});
        prePostSame = true;
    }
    let data = {
        //type: 'sheetMsg',
        subject: discription,
        discription: no + ' - ' + stateName,
        content: JSON.stringify(sheetMessage),
        //meName: 'henry',
        //meNick: 'henry-nick',
        //meIcon: undefined,
        usq: usq,
        sheet: sheet,
        state: state,
        to: tos,
    };
    //let toUser = 1;
    let schema = runner.getSchema(usqlSheetMessage);
    let msg = packParam(schema.call, data);
    let result = await runner.action(usqlSheetMessage, unit, user, msg);
    let returns = schema.call.returns;
    let {hasSend, busFaces} = schema.run;
    let actionReturn = await afterAction($unitx, runner, unit, returns, hasSend, busFaces, result);
    console.log('save sheet message ', data);

    // 之前设计，sheetAct消息不是usq里面推送。
    if (prePostSame === true) {
        let sheetActMsg = _.merge({$unit: unit}, sheetMessage);
        sheetActMsg.$type = 'sheetAct';
        sheetActMsg.$user = [user];
        await pushToCenter(db, sheetActMsg);
        return;
    }
    let sheetActPreState = _.merge({$unit: unit}, sheetMessage);
    sheetActPreState.$type = 'sheetActPreState';
    sheetActPreState.$user = [user];
    await pushToCenter(db, sheetActPreState);

    let toArr = tos.map(v=>v.to);
    let sheetActState = _.merge({$unit: unit}, sheetMessage);
    sheetActState.$type = 'sheetActState';
    sheetActState.$user = toArr;
    await pushToCenter(db, sheetActState);

    /*
    {
        $type: 'sheetAct',
        $user: tos.map(v=>v.to),
        $unit: unit,
    });
    await pushToCenter(db, sheetActMsg);
    */
    return tos;
}

