import { logger } from '../../tool';
import { centerApi, CenterUnitxUrls, UnitxUrlServer } from '../centerApi';
import { consts } from '../consts';
import { env, UnitxDb, UnitxProdDb, UnitxTestDb } from "../db";
import { getUrlDebug } from '../getUrlDebug';
import { Message } from '../model';
import { UnitxApi } from "./unitxApi";

interface UnitxApiBox {
	prev: UnitxApi;
	current: UnitxApi;
}

interface UnitxUrlServerBox {
	prev: UnitxUrlServer;
	current: UnitxUrlServer;
}

export abstract class Unitx {
	protected _db: UnitxDb;

	constructor() {
		this.buildUnitxDb();
	}
	protected abstract buildUnitxDb():void;
	get db(): UnitxDb {return this._db};

	private unitUnitxApis: {[unit:number]:UnitxApiBox} = {};
	private async getUnitxApiBox(unit:number):Promise<UnitxApiBox> {
		let unitxApiBox = this.unitUnitxApis[unit];
		if (unitxApiBox === undefined) {
			this.unitUnitxApis[unit] = unitxApiBox = await this.buildUnitxApiBox(unit);
		}
		return unitxApiBox;
	}

    private async getPullUnitxApi(unit:number):Promise<UnitxApi> {
		let {prev, current} = await this.getUnitxApiBox(unit);
		if (prev === undefined) return current;
		
		// 小于10分钟
		let delta = Date.now()/1000 - current.tickCreate;
		let minutes = delta / 60;
		if (minutes < 10) {
			// 用老的unitx拉
			return prev ;
		}
		else {
			// 用新的unitx拉
			return current;
		}
	}

    private async getPushUnitxApi(unit:number):Promise<UnitxApi> {
		let {current} = await this.getUnitxApiBox(unit);
		return current;
	}

	private async buildUnitxApiBox(unit:number): Promise<UnitxApiBox> {
		let unitxUrls = await centerApi.unitUnitx(unit);
		let {prev, current} = this.boxFromUrls(unitxUrls);
		return {
			prev: await this.buildUnitxApi(prev),
			current: await this.buildUnitxApi(current),
		}
	}

	private async buildUnitxApi(uus: UnitxUrlServer): Promise<UnitxApi> {
		if (uus === undefined) return undefined;
		let {url, server, create} = uus;
        if (env.isDevelopment === true) {
			if (server === this._db.serverId) {
				let urlDebug = await getUrlDebug();
				if (urlDebug !== undefined) url = urlDebug;
			}
		}
		let unitxUrl = this.unitxUrl(url);
		return new UnitxApi(unitxUrl, create);
	}
	
    async sendToUnitx(unit:number, msg:Message):Promise<number[]|string> {
		logger.error('sendToUnitx', unit, msg);
        let unitxApi = await this.getPushUnitxApi(unit);
        if (!unitxApi) {
            let err = `Center unit ${unit} not binding $unitx service!!!`;
            //return ret;
            logger.error(err);
            throw new Error(err);
		}
		else {
			logger.error('get unitx push url in sendToUnitx: ',  unitxApi.url);
		}
        let toArr:number[] = await unitxApi.send(msg);
        return toArr;
	}
	
	async pullBus(unit:number, maxId:number, faces:string): Promise<any[][]> {
		let unitxApi = await this.getPullUnitxApi(unit);
		if (!unitxApi) {
			logger.error(`getUnitxApi unit=${unit}, pull return nothing`);
			return;
		}
		let ret = await unitxApi.fetchBus(unit, maxId, faces);
		if (ret === undefined) {
			logger.error(`unitxApi.fetchBus  url=${unitxApi.url} unit=${unit}`);
			return;
		}
		return ret;
	}

	protected abstract unitxUrl(url:string):string;
	protected abstract boxFromUrls(unitxUrls: CenterUnitxUrls):UnitxUrlServerBox;
}

export class UnitxProd extends Unitx {
	protected buildUnitxDb():void {
		let dbName = consts.$unitx;
		this._db = new UnitxProdDb(dbName)
	}
    protected unitxUrl(url:string):string {return url + 'uq/unitx-prod/'};
	protected boxFromUrls(unitxUrls: CenterUnitxUrls):UnitxUrlServerBox {
		let {tv, prod:current} = unitxUrls;
		if (current !== undefined) return {
			prev: tv,
			current,
		};
		return {
			prev: undefined,
			current: tv,
		}
	}
}

export class UnitxTest extends Unitx {
	protected buildUnitxDb():void {
		let dbName = consts.$unitx + '$test';
		this._db = new UnitxTestDb(dbName);
	}
    protected unitxUrl(url:string):string {return url + 'uq/unitx-test/'};
	protected boxFromUrls(unitxUrls: CenterUnitxUrls):UnitxUrlServerBox {
		let {tv, test:current} = unitxUrls;
		if (current !== undefined) return {
			prev: tv,
			current,
		};
		return {
			prev: undefined,
			current: tv,
		}
	}
}
