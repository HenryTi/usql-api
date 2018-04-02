import * as bull from 'bull';
import * as config from 'config';
import {sheetAct} from './sheetAct';
import { sendtoUnitx } from './unitx';

interface BullConfig {
    name: string;
    connection: string;
}

//export const queue = bull('job', 'redis://127.0.0.1:6379');
const bullConfig = config.get<BullConfig>('bull');
export const queue = bull(bullConfig.name, bullConfig.connection);

queue.on("error", (error: Error) => {
    console.log('queue server: ', error);
});

queue.process(async function(job, done) {
    let data = job.data;
    if (data === undefined) {
        done();
        return;
    }

    switch (data.job) {
        case 'sheetAct': 
            await sheetAct(data); 
            done();
            return;
        case 'unitx':
            await sendtoUnitx(data);
            done();
            return;
    }

    // job.data contains the custom data passed when the job was created
    // job.id contains id of this job.

    // transcode video asynchronously and report progress
    job.progress(42);

    // call done when finished
    done();

    // or give a error if error
    //done(new Error('error transcoding'));

    // or pass it a result
    //done(null, { framerate: 29.5  });

    // If the job throws an unhandled exception it is also handled correctly
    //throw new Error('some unexpected error');
});
