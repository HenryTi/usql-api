
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
    sheetHead: SheetHead;
}

export interface ClientMessage {
    type: 'sheet'|'msg';
    to: number[];
    body: any;
}

export interface SheetMessage extends ClientMessage{
    type: 'sheet';
    db: string;
    id: number;
}

export interface MsgMessage extends ClientMessage {
    type: 'msg';
}

export interface BusMessage {
    type: 'bus';
    body: any;
}

export type Message = ClientMessage | BusMessage;

export interface UnitxPack {
    unit: number;
    message: Message;
}
