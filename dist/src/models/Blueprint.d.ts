import { ConstructorFunction } from "~/types/functions/ConstructorFunction";
import Model from "./Model";
export declare class Blueprint<T extends Model> {
    constructorFunction: ConstructorFunction<T>;
    collectionRoute: string;
    collectionRouteParams: any;
    constructor(model: T, routeParams?: any);
    static createBlueprint<T extends Model>(constructor: ConstructorFunction<T>): Blueprint<T>;
    buildCollectionRoute(): string;
    getSubCollectionName(): string;
}
