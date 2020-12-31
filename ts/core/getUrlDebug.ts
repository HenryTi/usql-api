import fetch from "node-fetch";
import { env } from "./db";

const urlDebugPromises:{[url:string]: Promise<string>|boolean} = {};
export async function getUrlDebug():Promise<string> {
	let urlDebug = `http://${env.localhost}/`; //urlSetUqHost();
	let urlDebugPromise = urlDebugPromises[urlDebug];
	if (urlDebugPromise === true) return urlDebug;
	if (urlDebugPromise === false) return undefined;
	if (urlDebugPromise === undefined) {
		urlDebugPromise = fetchHello(urlDebug);
		urlDebugPromises[urlDebug] = urlDebugPromise;
	}
	let ret = await (urlDebugPromise as Promise<string>);
	if (ret === null) {
		urlDebugPromises[urlDebug] = false;
		return undefined;
	}
	else {
		urlDebugPromises[urlDebug] = true;
		return ret;
	}

}

async function fetchHello(url:string):Promise<string> {
	try {
		let ret = await fetch(url + 'hello');
		if (ret.status !== 200) throw 'not ok';
		let text = await ret.text();
		return url;
	}
	catch {
		return null;
	}
}
