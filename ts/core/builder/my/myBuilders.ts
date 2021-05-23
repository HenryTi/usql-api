import { ParamID, ParamIX, ParamActs, ParamActDetail
	, ParamIDDetailGet, ParamIDLog, ParamKeyID, ParamKeyIX
	, ParamIDxID, ParamIDSum, ParamKeyIDSum, ParamIXSum
	, ParamKeyIXSum
	, ParamIDinIX, ParamIDTree, ParamIDNO, ParamActIX, ParamActIXSort, ParamQueryID} from "../../dbServer";
import { Builders, ISqlBuilder } from "../builders";
import { SqlActDetail } from "./sqlActDetail";
import { SqlActIX } from "./sqlActIX";
import { SqlActs } from "./sqlActs";
import { SqlKeyID } from "./sqlKeyID";
import { SqlID } from "./sqlID";
import { SqlIDDetail } from "./sqlIDDetail";
import { SqlIDNO } from "./sqlIDNO";
import { SqlIX } from "./sqlIX";
import { SqlIXr } from "./sqlIXr";
import { SqlIDLog } from "./sqlIDLog";
import { SqlIDTree } from "./sqlIDTree";
import { SqlIDxID } from "./sqlIDxID";
import { SqlIDinIX } from "./sqlIDinIX";
import { SqlKeyIX } from "./sqlKeyIX";
import { SqlIDSum } from "./sqlIDSum";
import { SqlKeyIXSum } from "./sqlKeyIXSum";
import { SqlIXSum } from "./sqlIXSum";
import { SqlKeyIDSum } from "./sqlKeyIDSum";
import { SqlActIXSort } from "./sqlActIXSort";
import { SqlQueryID } from "./sqlQueryID";
import { SqlIDTv } from "./sqlIDTv";

export class MyBuilders extends Builders {
	Acts(param:ParamActs): ISqlBuilder {
		return new SqlActs(this, param);
	}

	ActIX(param: ParamActIX): ISqlBuilder {
		return new SqlActIX(this, param);
	}

	ActIXSort(param: ParamActIXSort): ISqlBuilder {
		return new SqlActIXSort(this, param);
	}

	ActDetail(param:ParamActDetail): ISqlBuilder {
		return new SqlActDetail(this, param);
	}

	QueryID(param: ParamQueryID): ISqlBuilder {
		return new SqlQueryID(this, param);
	}

	IDNO(param:ParamIDNO): ISqlBuilder {
		return new SqlIDNO(this, param);
	}

	IDDetailGet(param:ParamIDDetailGet): ISqlBuilder {
		return new SqlIDDetail(this, param);
	}

	ID(param: ParamID): ISqlBuilder {
		return new SqlID(this, param);
	}

	IDTv(ids: number[]): ISqlBuilder {
		return new SqlIDTv(this, ids);
	}

	KeyID(param: ParamKeyID): ISqlBuilder {
		return new SqlKeyID(this, param);
	}

	IX(param: ParamIX): ISqlBuilder {
		return new SqlIX(this, param);
	}
	
	IXr(param: ParamIX): ISqlBuilder {
		return new SqlIXr(this, param);
	}
	
	KeyIX(param: ParamKeyIX): ISqlBuilder {
		return new SqlKeyIX(this, param);
	}
	
	IDLog(param: ParamIDLog): ISqlBuilder {
		return new SqlIDLog(this, param);
	}

	IDSum(param: ParamIDSum): ISqlBuilder {
		return new SqlIDSum(this, param);
	}

	KeyIDSum(param: ParamKeyIDSum): ISqlBuilder {
		return new SqlKeyIDSum(this, param);
	}

	IXSum(param: ParamIXSum): ISqlBuilder {
		return new SqlIXSum(this, param);
	}

	KeyIXSum(param: ParamKeyIXSum): ISqlBuilder {
		return new SqlKeyIXSum(this, param);
	}

	IDinIX(param: ParamIDinIX): ISqlBuilder {
		return new SqlIDinIX(this, param);
	}

	IDxID(param: ParamIDxID): ISqlBuilder {
		return new SqlIDxID(this, param);
	}
	
	IDTree(param: ParamIDTree): ISqlBuilder {
		return new SqlIDTree(this, param);
	}
}
