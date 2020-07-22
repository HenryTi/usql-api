import { start } from "./start";

start().then(() => {
    console.log('Tonva uq-api started!');
    /*
    centerApi.queueOut(0, 100).then(value => {
        console.log(value);
    }).catch(reason => {
        console.error(reason);
    });
    */
});
