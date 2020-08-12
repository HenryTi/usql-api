import { start } from "./start";

(async function() {

	if (!process.env.NODE_ENV) {
		console.error('NODE_ENV not defined, exit');
		process.exit();
	}
	console.log('process.env.NODE_ENV: ', process.env.NODE_ENV);

	await start();
    console.log('Tonva uq-api started!');
})();
