import Model from "~/models/Model";
import { FieldConfig } from "~/types/configs/FieldConfig";
import { PropertyDecoratorFunction } from "~/types/functions/PropertyDecoratorFunction";
import { fieldMetadataKey } from "./MetadataKeys";


export function Field<T extends Model>(options: FieldConfig = null): PropertyDecoratorFunction {
  return Reflect.metadata(fieldMetadataKey, options);
}
