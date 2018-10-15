import { getRunner } from "../tv/runner";
import { packParam } from "../core/packParam";
import { afterAction } from "../tv/afterAction";

const $unitx = '$unitx';
const usqlSheetMessage = 'sheetMessage';
const usqlGetSheetTo = 'getSheetTo';
export async function processSheetMessage(unit:number, sheetMessage:any): Promise<{to:number}[]> {
    let runner = await getRunner($unitx);
    let {no, discription, /*to, */usq, id:sheet, state, user, name} = sheetMessage;
    // 上句中的to removed，由下面调用unitx来计算
    let sheetName = name;
    let stateName = state;
    let paramsGetSheetTo:any[] = [usq, sheetName, stateName];
    let tos:any[] = await runner.query(usqlGetSheetTo, unit, user, paramsGetSheetTo);
    /*
    let toUsers:{toUser:number}[] = sheetTo.map(v => {
        return {toUser: v.to}
    });
    */
    if (tos.length === 0) tos.push({to: user});
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
    let toUser = 1;
    let schema = runner.getSchema(usqlSheetMessage);
    let msg = packParam(schema.call, data);
    let result = await runner.action(usqlSheetMessage, unit, toUser, msg);
    let returns = schema.call.returns;
    let {hasSend, busFaces} = schema.run;
    let actionReturn = await afterAction($unitx, runner, unit, returns, hasSend, busFaces, result);
    console.log('save sheet message ', data);
    return tos;
}

