import { ConstructorFunction } from "~/types/functions/ConstructorFunction";
export declare type FieldConfig = {
    name?: string | null;
    modelClass?: ConstructorFunction<unknown>;
    routeParam?: boolean;
    timestamp?: boolean;
};
