import { ParamID, ParamID2, ParamIDActs, ParamIDDetail, ParamIDLog, ParamKeyID, ParamKeyID2 } from "../dbServer";

export abstract class Builder {
	protected dbName:string;
	protected hasUnit:boolean;
	constructor(dbName:string, hasUnit:boolean) {
		this.dbName = dbName;
		this.hasUnit = hasUnit;
	}

	IDActs(param:ParamIDActs): string {
		return
	}

	IDDetail(param:ParamIDDetail): string {
		return
	}

	IDDetailGet(param:ParamIDDetail): string {
		return
	}

	ID(param: ParamID): string {
		return;
	}

	KeyID(param: ParamKeyID): string {
		return
	}

	ID2(param: ParamID2): string {
		return
	}
	
	KeyID2(param: ParamKeyID2): string {
		return
	}
	
	IDLog(param: ParamIDLog): string {
		return
	}
}
