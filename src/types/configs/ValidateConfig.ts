import { RuleSet } from "../external/RuleSet";

export type ValidateConfig<T> = 
    string | RuleSet | ((item: T) => RuleSet)