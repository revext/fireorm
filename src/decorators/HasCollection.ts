import { PropertyDecoratorFunction } from "~/types/functions/PropertyDecoratorFunction";
import { RelationConfig } from "~/types/configs/RelationConfig";
import { ClassWithRelations, Relations } from "~/types/internal/ClassWithRelations";

export function HasCollection(options: RelationConfig): PropertyDecoratorFunction {
  return  (target: Object, propertyKey: string | symbol): void => {
    if(!target.hasOwnProperty('relations')){
      let relations: any = {}
      relations[propertyKey] = Object.assign(options, { type: 'hasCollection' })
      Object.defineProperty(target, 'relations', { value: relations })
    } else 
      (target as ClassWithRelations).relations[propertyKey] = Object.assign(options, { type: 'hasCollection' as Relations })
  };
}