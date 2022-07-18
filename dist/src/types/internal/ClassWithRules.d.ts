import { ValidateConfig } from "../configs/ValidateConfig";
export declare type ClassWithRules<T> = Object & {
    rules?: {
        [key: string | symbol]: ValidateConfig<T>;
    };
};
