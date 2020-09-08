import { Router, Request, Response } from 'express';
import { Db, BuildRunner } from "../core";

export function buildProcRouter() {
	const router:Router = Router({ mergeParams: true });

	router.get('/', async (req:Request, res:Response) => {
		let {db, proc} = req.params;

		async function buildProc(dbName:string):Promise<any> {
			try {
				let db = Db.db(dbName);
				let runner = new BuildRunner(db);
				await runner.buildProc(proc);
				return;
			}
			catch (err) {
				return err;
			}
		}

		if (proc.toLowerCase().startsWith('tv_') === false) {
			proc = 'tv_' + proc;
		}

		let dbProd = db;
		let dbTest = db + '$test';
		let errProd = await buildProc(db);
		let errTest  = await buildProc(db + '$test');
		let message: string;
		if (!errProd && !errTest) {
			message = `${dbProd} and ${dbTest}`;
		}
		else if (!errProd) {
			message = dbTest;
		}
		else if (!errTest) {
			message = dbProd;
		}
		else {
			message = undefined;
		}
		if (message) {
			message += ` stored procedure tv_${proc} built successfully`;
		}
		else {
			message = `faild to build ${proc} in ${dbProd} and ${dbTest}`;
		}

		res.json({
			message
		});
	});
	
	return router;
}