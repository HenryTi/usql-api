export interface SchemaBusFace {
    name:string;
    owner:string;
    bus:string;
    faces: {
        name: string;
        arr: string[];
    }[];
}
