import { ParamID, ParamIX, ParamIXSum, ParamIDActs, ParamIDDetail, ParamIDinIX as ParamIDinIX, ParamIDLog, ParamIDSum, ParamKeyID, ParamKeyIX, ParamKeyIXSum, ParamKeyIDSum, ParamIDxID, ParamIDTree } from "../dbServer";

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

	IX(param: ParamIX): string {
		return
	}
	
	KeyIX(param: ParamKeyIX): string {
		return
	}
	
	IDLog(param: ParamIDLog): string {
		return
	}
	
	IDSum(param: ParamIDSum): string {
		return
	}
	
	KeyIDSum(param: ParamKeyIDSum): string {
		return
	}
	
	IXSum(param: ParamIXSum): string {
		return
	}
	
	KeyIXSum(param: ParamKeyIXSum): string {
		return
	}

	IDinIX(param: ParamIDinIX): string {
		return;
	}

	IDxID(param: ParamIDxID): string {
		return;
	}
	
	IDTree(param: ParamIDTree): string {
		return;
	}
}
