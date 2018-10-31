export * from './router';
export * from './setting';

import {router} from './router';
import accessRouter from './access';
import schemaRouter from './schema';
import tuidRouter from './tuid';
import sheetRouter from './sheet';
import actionRouter from './action';
import bookRouter from './book';
import historyRouter from './history';
import queryRouter from './query';

//import settingRouter from './setting';

accessRouter(router);
schemaRouter(router);
tuidRouter(router);
sheetRouter(router);
actionRouter(router);
bookRouter(router);
historyRouter(router);
queryRouter(router);

//settingRouter(router);
