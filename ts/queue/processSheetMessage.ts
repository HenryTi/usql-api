import { SheetMessage } from "./model";
import { getRunner } from "../db";
import { pushToClient } from "./pushToClient";
import { actionProcess } from "../router/actionProcess";

const $unitx = '$unitx';
const sheetMessage = 'sheetMessage';

export async function processSheetMessage(sheetMsg:SheetMessage) {
    let {unit, body, to} = sheetMsg;
    let {id, discription, no, state, app, usq, sheet} = body;
    let runner = await getRunner($unitx);
    let content = {
        app:app,
        id: id, 
        usq: usq,
        sheet:sheet
    };
    let msgBody = {
        subject: discription,
        discription: no + ' - ' + state,
        content: JSON.stringify(content),
        usq: usq,
        sheet: id,
        state: state,
        tos: to.map(v => {return {to: v}}),
    };

    let schema = runner.getSchema(sheetMessage);
    let call = schema.call;
    let run = schema.run;
    let user = 0;

    // 保存单据消息
    // 保存之后，发送desk消息到home
    await actionProcess(unit, user, sheetMessage, $unitx, undefined, runner, msgBody, call, run);

    // 单据处理的消息发送到前台
    await pushToClient(sheetMsg);
}
