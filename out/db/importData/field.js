"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../../core");
class Field {
    static create(runner, schema, fieldName, header, source) {
        let field;
        let schemaField = schema.fields.find(v => v.name === fieldName);
        if (schemaField === undefined) {
            let keys = schema.keys;
            if (keys === undefined)
                return;
            schemaField = keys.find(v => v.name === fieldName);
            if (schemaField === undefined)
                return;
        }
        let { name, type } = schemaField;
        switch (type) {
            default: return;
            case 'tinyint':
            case 'smallint':
            case 'int':
            case 'dec':
                field = Field.createNumberField(name, type);
                break;
            case 'char':
                field = Field.createCharField(name, type);
                break;
            case 'bigint':
                let tuid = schemaField.tuid;
                if (tuid !== undefined) {
                    let tField = Field.createTuidField(name, tuid, header);
                    tField.runner = runner;
                    tField.source = source;
                    field = tField;
                }
                else {
                    field = Field.createNumberField(name, type);
                }
                break;
        }
        field.colIndex = header[name];
        return field;
    }
    static createNumberField(name, type) {
        let f = new NumberField();
        f.name = name;
        f.type = type;
        return f;
    }
    static createCharField(name, type) {
        let f = new StringField();
        f.name = name;
        f.type = type;
        return f;
    }
    static createTuidField(name, tuid, header) {
        let f = new TuidField();
        f.name = name;
        f.type = 'bigint';
        f.tuid = tuid;
        return f;
    }
    static createSpecialField(schema, fieldName, header) {
        let pos = fieldName.indexOf('@');
        if (pos < 0)
            return;
        let name = fieldName.substr(0, pos);
        let owner;
        let divUnqiue;
        if (fieldName[pos + 1] === '/') {
            owner = fieldName.substr(pos + 2);
            divUnqiue = false;
        }
        else {
            owner = fieldName.substr(pos + 1);
            divUnqiue = true;
        }
        let schemaField = schema.fields.find(v => v.name === fieldName);
        let { tuid } = schemaField;
        let f = new TuidDivField();
        f.name = name;
        f.tuid = tuid;
        f.unique = divUnqiue;
        f.owner = owner;
        return f;
    }
    static createIdField(runner, source, tuid, div) {
        let field = new IdField();
        field.source = source;
        field.tuid = tuid;
        field.div = div;
        field.runner = runner;
        return field;
    }
    static createUserField() {
        return new UserField();
    }
    static createOwnerField(schema) {
        let field = new OwnerField();
        return field;
    }
    getValue(row) { return null; }
    getId(unit, row) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
}
exports.Field = Field;
class NumberField extends Field {
    getValue(row) {
        let v = row[this.colIndex];
        if (v !== undefined)
            return Number(v);
    }
}
class StringField extends Field {
    getValue(row) {
        return row[this.colIndex];
    }
}
class UserField extends Field {
    getId(unit, row) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield core_1.centerApi.userIdFromName(row[this.colIndex]);
        });
    }
}
class BaseTuidField extends Field {
}
class IdField extends BaseTuidField {
    getId(unit, row) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.runner.importVId(unit, undefined, this.source, this.tuid, this.div, row[this.colIndex]);
        });
    }
}
class OwnerField extends BaseTuidField {
    getId(unit, row) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
}
class TuidField extends BaseTuidField {
    getId(unit, row) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.runner.importVId(unit, undefined, this.source, this.tuid, undefined, row[this.colIndex]);
        });
    }
}
class TuidDivField extends BaseTuidField {
    getId(unit, row) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
}
class ImportField extends BaseTuidField {
    getId(unit, row) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
}
class TuidImportField extends ImportField {
    getId(unit, row) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
}
class TuidDivImportField extends ImportField {
    getId(unit, row) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
}
//# sourceMappingURL=field.js.map