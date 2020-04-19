import { Router } from 'express';
import { EntityRunner, RouterBuilder, User } from '../core';

export function buildTagRouter(router:Router, rb:RouterBuilder) {
    rb.get(router, '/tag/values/:name',
    async (runner:EntityRunner, body:any, urlParams:any, userToken?:User) => {
		let {id:userId, unit} = userToken;
		let {name} = urlParams;
        let values = await runner.tagValues(unit, name);
        return values;
    });
}
