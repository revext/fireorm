import { ConstructorFunction } from "~/types/functions/ConstructorFunction";
import { Model } from "..";
export declare function createModel<T extends Model>(modelClass: ConstructorFunction<T>, params?: any[]): T;
