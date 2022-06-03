import Model from "~/models/Model";
import { ValidateConfig } from "~/types/configs/ValidateConfig";
import { PropertyDecoratorFunction } from "~/types/functions/PropertyDecoratorFunction";
export declare function Validate<T extends Model>(rule: ValidateConfig<T>): PropertyDecoratorFunction;
