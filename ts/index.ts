import { start } from "./start";

(async function() {

	if (!process.env.NODE_ENV) {
		console.error('NODE_ENV not defined, exit');
		process.exit();
	}
	console.log('process.env.NODE_ENV: ', process.env.NODE_ENV);

	process.exit();
	await start();
    console.log('Tonva uq-api started!');
    /*
    centerApi.queueOut(0, 100).then(value => {
        console.log(value);
    }).catch(reason => {
        console.error(reason);
    });
    */
})();

