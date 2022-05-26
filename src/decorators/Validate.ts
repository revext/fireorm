import Model from "~/models/Model";
import { ValidateConfig } from "~/types/configs/ValidateConfig";
import { PropertyDecoratorFunction } from "~/types/functions/PropertyDecoratorFunction";
import { validateMetadataKey } from "./MetadataKeys";


export function Validate<T extends Model>(rule: ValidateConfig<T>): PropertyDecoratorFunction {
  return Reflect.metadata(validateMetadataKey, rule);
}
