import * as _ from 'lodash';
//import {App} from './il/app';
//import {Entity} from './il/entity';
import {log} from './log';
//import {TokenStream, Context as PContext} from './parser';
//import {Context, BApp} from './builder';
import {Runner} from './runner';

export class UsqlApp {
    private log: log;
    //private app: App;
    //private bapp: BApp;
    ok: boolean;
    
    constructor(log:log) {
        this.log = log || ((text:string) => {});
        this.ok = true;
        //this.app = new App();
    }

    setLog(log: log) {
        this.log = log;
    }
    /*
    parse(input:string, fileName:string=undefined) {
        try {
            let ts = new TokenStream(this.log, input);
            ts.file = fileName;
            let context:PContext = {ts: ts, createStatements: undefined}
            let parser = this.app.parser(context);
            parser.parse();
        }
        catch (err) {
            this.ok = false;
            if (typeof err !== 'string')
                this.log(err.message);
        }
    }
    async loadResource() {
        let pelement = this.app.pelement;
        if (pelement === undefined) return;
        let ret = await pelement.loadResource();
        if (ret === false) this.ok = false;
    }
    scan() {
        let pelement = this.app.pelement;
        if (pelement === undefined) return;
        let ret = pelement.scan(undefined);
        if (ret === false) this.ok = false;
    }

    buildDb() {
        let context = new Context(config.sqlType, this.log, true);
        this.bapp = new BApp(this.app, context);
        this.bapp.buildTables();
        this.bapp.buildProcedures();
    }
    async updateDb(runner:Runner, unitId:number, userId:number) {
        await this.bapp.updateDb(runner, unitId, userId);
    }
    */
}
