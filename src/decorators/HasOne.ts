import Model from "~/models/Model";
import { PropertyDecoratorFunction } from "~/types/functions/PropertyDecoratorFunction";
import { RelationConfigWithType, HasOneRelationConfig } from "~/types/configs/RelationConfig";
import { relationMetadataKey } from "./MetadataKeys";


export function HasOne<K extends Model>(options: HasOneRelationConfig): PropertyDecoratorFunction {
  options = Object.assign(options, { type: 'hasOne' }) as RelationConfigWithType;
  return Reflect.metadata(relationMetadataKey, options);
}