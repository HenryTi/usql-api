import { start } from "./start";
//import { centerApi } from "./core";

start().then(() => {
    console.log('uq-api started!');
    /*
    centerApi.queueOut(0, 100).then(value => {
        console.log(value);
    }).catch(reason => {
        console.error(reason);
    });
    */
});
