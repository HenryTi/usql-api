import { logger } from '../tool';
import { Net } from "../core";

//import { getRunner } from "../db";
//import { prodRouterBuilder } from "../core";

export async function importData(net: Net) {
    try {
        let runner = await net.getRunner('biz_license');
        if (runner === undefined) return;
        let unit = 99;
        let user = 99;
        let source = '#';
        let files = [
            {
                entity: 'vendor',
                filePath: 'C:/Users/Henry/Desktop/Results.csv',
            },
            {
                entity: 'vendorPercentage',
                filePath: 'C:/Users/Henry/Desktop/map.csv',
            }
        ]

        for (let f of files) {
            let {entity, filePath} = f;
            if (filePath === undefined) continue;
            await runner.importData(unit, user, source, entity, filePath);
        }
        logger.log('files imported!');
    }
    catch (err) {
        logger.error(err);
    }
}
