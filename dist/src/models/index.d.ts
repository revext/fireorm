import { Model } from "..";
export declare function createModel<T extends Model>(modelClass: {
    new (...args: any[]): T;
}, params?: any[]): T;
