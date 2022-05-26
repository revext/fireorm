import Model from "~/models/Model";
import { PropertyDecoratorFunction } from "~/types/functions/PropertyDecoratorFunction";
import { HasManyRelationConfig, RelationConfigWithType } from "~/types/configs/RelationConfig";
import { relationMetadataKey } from "./MetadataKeys";

export function HasMany<T extends Model, K extends Model>(options: HasManyRelationConfig): PropertyDecoratorFunction {
  options = Object.assign(options, { type: 'hasMany' }) as RelationConfigWithType;
  return Reflect.metadata(relationMetadataKey, options);
}