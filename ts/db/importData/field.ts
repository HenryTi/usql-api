import { Runner } from "../runner";

export interface Header {
	[name:string]: number;
}

export abstract class Field {
	static create(runner:Runner, schema:any, fieldName:string, header:Header):Field {
		let schemaField = schema.fields[fieldName];
		if (schemaField === undefined) return Field.createSpecialField(runner, schema, fieldName, header);
		let {name, type} = schemaField;
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
				if (tuid !== undefined) return Field.createTuidField(runner, name, tuid, header);
				return Field.createNumberField(name, type, header[name]);
		}
		return;
	}

	private static createNumberField(name:string, type:string, colIndex:number):Field {
		let f = new NumberField();
		f.name = name;
		f.type = type;
		f.colIndex = colIndex;
		return f;
	}

	private static createCharField(name:string, type:string, colIndex:number):Field {
		let f = new StringField();
		f.name = name;
		f.type = type;
		f.colIndex = colIndex;
		return f;
	}

	private static createTuidField(runner:Runner, name:string, tuid:string, header:Header):Field {
		return;
	}

	private static createSpecialField(runner:Runner, schema:any, fieldName:string, header:Header):Field {
		let pos = fieldName.indexOf('@');
		if (pos < 0) {
			switch (fieldName) {
				default: return;
				case '$id': return this.createIdField(runner, schema);
				case '$owner': return this.createOwnerField(runner, schema);
			}
		}
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
		let schemaField = schema.fields[fieldName];
		let {tuid} = schemaField;
		let f = new TuidDivField();
		f.name = name;
		f.tuid = tuid;
		f.unique = divUnqiue;
		f.owner = owner;
		return f;
	}

	private static createIdField(runner:Runner, schema:any):Field {
		return;
	}

	private static createOwnerField(runner:Runner, schema:any):Field {
		return;
	}

    name: string;
	type: string;
	colIndex: number;

	getValue(row:any[]):any {return null}
	async getId(row:any[]): Promise<number> {
		return undefined;
	}
}

class NumberField extends Field {
	getValue(row:any[]):any {
		return Number(row[this.colIndex]);
	}
}

class StringField extends Field {
	getValue(row:any[]):any {
		return row[this.colIndex];
	}
}

abstract class BaseTuidField extends Field {
	runner: Runner;
	tuid: string;
}

class TuidField extends BaseTuidField {
	async getId(row:any[]): Promise<number> {
		return undefined;
	}
}

class TuidDivField extends BaseTuidField {
	unique: boolean;
	owner: string;
	async getId(row:any[]): Promise<number> {
		return undefined;
	}
}

class ImportField extends BaseTuidField {
	async getId(row:any[]): Promise<number> {
		return undefined;
	}
}

class TuidImportField extends ImportField {
	async getId(row:any[]): Promise<number> {
		return undefined;
	}
}

class TuidDivImportField extends ImportField {
	async getId(row:any[]): Promise<number> {
		return undefined;
	}
}
