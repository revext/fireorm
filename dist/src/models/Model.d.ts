import Validator from "validatorjs";
import { Blueprint } from "./Blueprint";
export declare type ParamsObject = {
    [key: string]: any;
};
export default abstract class Model {
    id?: string;
    relationsLoaded: string[];
    constructor(..._: any[]);
    init(..._: any[]): void;
    reset(): void;
    private errors;
    abstract getModelName(): string;
    autoId(): string;
    private collectRules;
    validate(): Promise<void>;
    hasErrors(): boolean;
    getAllErrors(): Validator.ValidationErrors;
    getErrors(name: string): Array<string> | false;
    getError(name: string): string | false;
    loadMany(relationNames: string[], forceReload?: boolean): Promise<void>;
    load(relationName: string, forceReload?: boolean): Promise<void>;
    getBlueprint<T extends Model>(this: T): Blueprint<T>;
    getRoute(): string;
    getRouteParameterMapping(): ParamsObject;
    toJson(toFireJson?: boolean): any;
    private innerToJson;
    private convertFromInstance;
    fromJson(data: any, fromFireJson?: boolean): this;
    private innerFromJson;
    private convertToInstance;
}
