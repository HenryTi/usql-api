import { centerApi } from "../centerApi";
import { EntityRunner } from '../runner';
import { Cache } from "../../tool";

interface UserX {
	service: number;
	unitxUrl: string;
}
interface FaceUserX {
	[face:string]: UserX[];
}
interface BusUserX {
	[bus:string]: FaceUserX;
}
const userxCache: Cache<number, BusUserX> = new Cache<number, BusUserX>(3, 10);

async function buildUserX(runner:EntityRunner, to:number, busOwner:string, busName:string, face:string):Promise<UserX[]> {
	// runner 可以做本地数据库缓存，不一定每次都到中央服务器获取，减轻中央服务器压力
	let results = await centerApi.userxBusFace(to, busOwner, busName, face);
	return results;
}

export async function getUserX(runner:EntityRunner, to:number, bus:string, busOwner:string, busName:string, face:string): Promise<number[]> {	
	// 如果发给指定用户
	// unit为指定service id，并且为负数
	let faceUserX:FaceUserX;
	let userXArr:UserX[];
	let busUserX = userxCache.get(to);
	if (busUserX === undefined) {
		busUserX = {};
		userxCache.set(to, busUserX);
	}
	faceUserX = busUserX[bus];
	if (faceUserX === undefined) {
		faceUserX = busUserX[bus] = {};
	}
	userXArr = faceUserX[face];
	if (userXArr === undefined) {
		userXArr = await buildUserX(runner, to, busOwner, busName, face);
		faceUserX[face] = userXArr;
	}
	return userXArr.map(v => -v.service);
}
