import { ClassDecoratorFunction } from "~/types/functions/ClassDecoratorFunction";
import { collectionMetadataKey } from "./MetadataKeys";


export function Collection(options: { route: string }): ClassDecoratorFunction {
  return Reflect.metadata(collectionMetadataKey, options);
}
