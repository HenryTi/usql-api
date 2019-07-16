import { Router } from 'express';
import { Runner, RouterBuilder } from '../core';

export function buildSchemaRouter(router:Router, rb:RouterBuilder) {
    rb.get(router, '/schema/:name',
    async (runner:Runner, body:any, urlParams:any) => {
        let {name} = urlParams;
        let schema = runner.getSchema(name);
        return schema && schema.call;
    });
    rb.get(router, '/schema/:name/:version',
    async (runner:Runner, body:any, urlParams:any) => {
        let {name, version} = urlParams;
        let schemaVersion = await runner.loadSchemaVersion(name, version);
        return schemaVersion;
    });
}
