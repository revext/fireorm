import { RuleSet } from "../external/RuleSet";
export declare type ValidateConfig<T> = string | RuleSet | ((item: T) => RuleSet);
