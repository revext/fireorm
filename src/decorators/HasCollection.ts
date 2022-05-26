import { PropertyDecoratorFunction } from "~/types/functions/PropertyDecoratorFunction";
import { RelationConfig, RelationConfigWithType } from "~/types/configs/RelationConfig";
import { relationMetadataKey } from "./MetadataKeys";

export function HasCollection(options: RelationConfig): PropertyDecoratorFunction {
  options = Object.assign(options, { type: 'hasCollection' }) as RelationConfigWithType;
  return Reflect.metadata(relationMetadataKey, options);
}