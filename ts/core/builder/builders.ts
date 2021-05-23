import { ParamID, ParamIX, ParamIXSum, ParamActs
	, ParamActDetail, ParamIDinIX, ParamIDLog, ParamIDSum
	, ParamKeyID, ParamKeyIX, ParamKeyIXSum
	, ParamKeyIDSum, ParamIDxID, ParamIDTree, ParamIDNO, ParamActIX, ParamActIXSort, ParamQueryID } from "../dbServer";

export interface ISqlBuilder {
	build(): string;
}

export abstract class Builders {
	dbName:string;
	hasUnit:boolean;
	constructor(dbName:string, hasUnit:boolean) {
		this.dbName = dbName;
		this.hasUnit = hasUnit;
	}

	Acts(param:ParamActs): ISqlBuilder {
		return
	}

	ActIX(param:ParamActIX): ISqlBuilder {
		return
	}

	ActIXSort(param: ParamActIXSort): ISqlBuilder {
		return;
	}

	ActDetail(param:ParamActDetail): ISqlBuilder {
		return
	}

	QueryID(param: ParamQueryID): ISqlBuilder {
		return;
	}

	IDNO(param:ParamIDNO): ISqlBuilder {
		return
	}

	IDDetailGet(param:ParamActDetail): ISqlBuilder {
		return
	}

	ID(param: ParamID): ISqlBuilder {
		return;
	}

	IDTv(ids: number[]): ISqlBuilder {
		return;
	}

	KeyID(param: ParamKeyID): ISqlBuilder {
		return
	}

	IX(param: ParamIX): ISqlBuilder {
		return
	}
	
	IXr(param: ParamIX): ISqlBuilder {
		return
	}
	
	KeyIX(param: ParamKeyIX): ISqlBuilder {
		return
	}
	
	IDLog(param: ParamIDLog): ISqlBuilder {
		return
	}
	
	IDSum(param: ParamIDSum): ISqlBuilder {
		return
	}
	
	KeyIDSum(param: ParamKeyIDSum): ISqlBuilder {
		return
	}
	
	IXSum(param: ParamIXSum): ISqlBuilder {
		return
	}
	
	KeyIXSum(param: ParamKeyIXSum): ISqlBuilder {
		return
	}

	IDinIX(param: ParamIDinIX): ISqlBuilder {
		return;
	}

	IDxID(param: ParamIDxID): ISqlBuilder {
		return;
	}
	
	IDTree(param: ParamIDTree): ISqlBuilder {
		return;
	}
}
