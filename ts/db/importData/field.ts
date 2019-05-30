import { Runner } from "../runner";
import { centerApi } from "../../core";

export interface Header {
	[name:string]: number;
}

export abstract class Field {
	static create(runner:Runner, schema:any, fieldName:string, header:Header, source:string):Field {
		let field:Field;
		let schemaField = (schema.fields as any[]).find(v => v.name === fieldName);
		if (schemaField === undefined) {
			let keys = schema.keys as any[];
			if (keys === undefined) return;
			schemaField = keys.find(v => v.name === fieldName);
			if (schemaField === undefined) return;
		}
		let {name, type} = schemaField;
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

	private static createNumberField(name:string, type:string):Field {
		let f = new NumberField();
		f.name = name;
		f.type = type;
		return f;
	}

	private static createCharField(name:string, type:string):Field {
		let f = new StringField();
		f.name = name;
		f.type = type;
		return f;
	}

	private static createTuidField(name:string, tuid:string, header:Header):BaseTuidField {
		let f = new TuidField();
		f.name = name;
		f.type = 'bigint';
		f.tuid = tuid;
		return f;
	}

	private static createSpecialField(schema:any, fieldName:string, header:Header):BaseTuidField {
		let pos = fieldName.indexOf('@');
		if (pos < 0) return;
		let name = fieldName.substr(0, pos);
		let owner:string;
		let divUnqiue: boolean;
		if (fieldName[pos+1] === '/') {
			owner = fieldName.substr(pos+2);
			divUnqiue = false;
		}
		else {
			owner = fieldName.substr(pos+1);
			divUnqiue = true;
		}
		let schemaField = (schema.fields as any[]).find(v => v.name === fieldName);
		let {tuid} = schemaField;
		let f = new TuidDivField();
		f.name = name;
		f.tuid = tuid;
		f.unique = divUnqiue;
		f.owner = owner;
		return f;
	}

	static createIdField(runner:Runner, source:string, tuid:string, div:string):BaseTuidField {
		let field = new IdField();
		field.source = source;
		field.tuid = tuid;
		field.div = div;
		field.runner = runner;
		return field;
	}

	static createUserField():Field {
		return new UserField();
	}

	private static createOwnerField(schema:any):BaseTuidField {
		let field = new OwnerField();
		return field;
	}

    name: string;
	type: string;
	colIndex: number;

	getValue(row:any[]):any {return null}
	async getId(unit:number, row:any[]): Promise<number> {
		return undefined;
	}
}

class NumberField extends Field {
	getValue(row:any[]):any {
		let v = row[this.colIndex];
		if (v !== undefined) return Number(v);
	}
}

class StringField extends Field {
	getValue(row:any[]):any {
		return row[this.colIndex];
	}
}

class UserField extends Field {
	async getId(unit:number, row:any[]): Promise<number> {
		return await centerApi.userIdFromName(row[this.colIndex]);
	}
}

abstract class BaseTuidField extends Field {
	runner: Runner;
	source: string;
	tuid: string;
}

class IdField extends BaseTuidField {
	div: string;
	async getId(unit:number, row:any[]): Promise<number> {
		return await this.runner.importVId(unit, undefined, this.source, this.tuid, this.div, row[this.colIndex]);
	}
}

class OwnerField extends BaseTuidField {
	async getId(unit:number, row:any[]): Promise<number> {
		return undefined;
	}
}

class TuidField extends BaseTuidField {
	async getId(unit:number, row:any[]): Promise<number> {
		return await this.runner.importVId(unit, undefined, this.source, this.tuid, undefined, row[this.colIndex]);
	}
}

class TuidDivField extends BaseTuidField {
	unique: boolean;
	owner: string;
	async getId(unit:number, row:any[]): Promise<number> {
		return undefined;
	}
}

class ImportField extends BaseTuidField {
	async getId(unit:number, row:any[]): Promise<number> {
		return undefined;
	}
}

class TuidImportField extends ImportField {
	async getId(unit:number, row:any[]): Promise<number> {
		return undefined;
	}
}

class TuidDivImportField extends ImportField {
	async getId(unit:number, row:any[]): Promise<number> {
		return undefined;
	}
}
