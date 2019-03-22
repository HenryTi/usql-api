import { Router } from 'express';
import { Runner } from '../db';
import { get } from './process';

export default function(router:Router) {
    get(router, '/schema/:name',
    async (unit:number, user:number, urlParams:any, runner:Runner, body:any) => {
        let {name} = urlParams;
        let schema = runner.getSchema(name);
        return schema && schema.call;
    });
    get(router, '/schema/:name/:version',
    async (unit:number, user:number, urlParams:any, runner:Runner, body:any) => {
        let {name, version} = urlParams;
        let schemaVersion = await runner.loadSchemaVersion(name, version);
        return schemaVersion;
    });
}
