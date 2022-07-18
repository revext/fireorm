import { FieldConfig } from "../configs/FieldConfig";
export declare type ClassWithFields = Object & {
    fields?: {
        [key: string | symbol]: FieldConfig;
    };
};
