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
class Field {
    static create(runner, schema, fieldName, header) {
        let schemaField = schema.fields[fieldName];
        if (schemaField === undefined)
            return Field.createSpecialField(runner, schema, fieldName, header);
        let { name, type } = schemaField;
        switch (type) {
            case 'tinyint':
            case 'smallint':
            case 'int':
            case 'dec':
                return Field.createNumberField(name, type, header[name]);
            case 'char':
                return Field.createCharField(name, type, header[name]);
            case 'bigint':
                let tuid = schemaField.tuid;
                if (tuid !== undefined)
                    return Field.createTuidField(runner, name, tuid, header);
                return Field.createNumberField(name, type, header[name]);
        }
        return;
    }
    static createNumberField(name, type, colIndex) {
        let f = new NumberField();
        f.name = name;
        f.type = type;
        f.colIndex = colIndex;
        return f;
    }
    static createCharField(name, type, colIndex) {
        let f = new StringField();
        f.name = name;
        f.type = type;
        f.colIndex = colIndex;
        return f;
    }
    static createTuidField(runner, name, tuid, header) {
        return;
    }
    static createSpecialField(runner, schema, fieldName, header) {
        let pos = fieldName.indexOf('@');
        if (pos < 0) {
            switch (fieldName) {
                default: return;
                case '$id': return this.createIdField(runner, schema);
                case '$owner': return this.createOwnerField(runner, schema);
            }
        }
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
        let schemaField = schema.fields[fieldName];
        let { tuid } = schemaField;
        let f = new TuidDivField();
        f.name = name;
        f.tuid = tuid;
        f.unique = divUnqiue;
        f.owner = owner;
        return f;
    }
    static createIdField(runner, schema) {
        return;
    }
    static createOwnerField(runner, schema) {
        return;
    }
    getValue(row) { return null; }
    getId(row) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
}
exports.Field = Field;
class NumberField extends Field {
    getValue(row) {
        return Number(row[this.colIndex]);
    }
}
class StringField extends Field {
    getValue(row) {
        return row[this.colIndex];
    }
}
class BaseTuidField extends Field {
}
class TuidField extends BaseTuidField {
    getId(row) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
}
class TuidDivField extends BaseTuidField {
    getId(row) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
}
class ImportField extends BaseTuidField {
    getId(row) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
}
class TuidImportField extends ImportField {
    getId(row) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
}
class TuidDivImportField extends ImportField {
    getId(row) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
}
//# sourceMappingURL=field.js.map