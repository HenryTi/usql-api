
export function getErrorString(err:any): string {
    if (err === null) return 'error=null';
    if (err === undefined) return 'error=undefined';

    if (typeof err === 'object') {
        let ret = '';
        for (let key of Object.keys(err)) {
            ret += key + ': ' + err[key] + '; ';
        }
        return ret;
    }
    return err;
}