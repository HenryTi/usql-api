
export interface SheetHead {
    id: number;
    sheet: string;
    state: string;
    action: string;
    unit: number;
    user: number;
    flow: number;
}

export interface SheetAct {
    db: string;
    from: number;
    sheetHead: SheetHead;
}

export interface Message {
    unit: number;
    type: 'sheet'|'msg'|'bus';
    body: any;
}

export interface ClientMessage extends Message {
    type: 'sheet' | 'msg';
    from: number;               // 发送人
    to: number[];               // 接收人
    subject: string;
}

export interface SheetMessage extends ClientMessage{
    type: 'sheet';
    db: string;
    //id: number;
}

export interface MsgMessage extends ClientMessage {
    type: 'msg';
}

export interface BusMessage extends Message {
    type: 'bus';
    from: string;           // from uq
    busOwner: string,
    bus: string,
    face: string,
}
