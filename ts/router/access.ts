import { Router } from 'express';
import { EntityRunner, RouterBuilder } from '../core';

const accessType = 'access';

export function buildAccessRouter(router:Router, rb:RouterBuilder) {
    rb.entityGet(router, accessType, '', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        try {
            let {acc} = body;
            let accs:string[] = undefined;
            if (acc !== undefined) {
                accs = acc.split('|');
                if (accs.length === 1 && accs[0].trim().length === 0) accs = undefined;
            }
            console.log('getAccesses: ' + runner.getDb());
            let access = await runner.getAccesses(unit, user, accs);
            return access;
        }
        catch (err) {
            console.error('/access&name=', name, '&db=', db,  err);
            debugger;
        }
    });

    rb.entityGet(router, 'entities', '', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let entities = await runner.getEntities(unit);
        return entities;
    });

    rb.entityGet(router, 'all-schemas', '', 
    async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let entities = await runner.getAllSchemas();
        return entities;
	});
	
	rb.entityGet(router, 'get-roles', '',
	async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
        let roles = await runner.getMyRoles(unit, user);
        return roles;
    })
	
	rb.entityGet(router, 'get-all-role-users', '',
	async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
		// row 0 返回 ixOfUsers
        let roles = await runner.getAllRoleUsers(unit, user);		
        return roles;
    })

	rb.entityGet(router, 'delete-user-roles', '',
	async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
		let {theUser} = body;
		await runner.deleteUserRoles(unit, user, theUser);
		return;
    })
	
	rb.entityPost(router, 'set-user-roles', '',
	async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
		let {theUser, roles} = body;
		await runner.setUserRoles(unit, user, theUser, roles);
		return;
    })
}
