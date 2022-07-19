import Model from "~/models/Model";
import { PropertyDecoratorFunction } from "~/types/functions/PropertyDecoratorFunction";
import { HasOneRelationConfig } from "~/types/configs/RelationConfig";
import { ClassWithRelations, Relations } from "~/types/internal/ClassWithRelations";


// TODO instead of class pass the getModelName for the options modelClass
export function HasOne<K extends Model>(options: HasOneRelationConfig): PropertyDecoratorFunction {
  return  (target: Object, propertyKey: string | symbol): void => {
    if(!target.hasOwnProperty('relations')){
      let relations: any = {}
      relations[propertyKey] = Object.assign(options, { type: 'hasOne' })
      Object.defineProperty(target, 'relations', { value: relations })
    } else 
      (target as ClassWithRelations).relations[propertyKey] = Object.assign(options, { type: 'hasOne' as Relations })
  };
}