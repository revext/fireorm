import Model from "~/models/Model";
import { PropertyDecoratorFunction } from "~/types/functions/PropertyDecoratorFunction";
import { HasManyRelationConfig } from "~/types/configs/RelationConfig";
import { ClassWithRelations, Relations } from "~/types/internal/ClassWithRelations";

export function HasMany<T extends Model, K extends Model>(options: HasManyRelationConfig): PropertyDecoratorFunction {
  return  (target: Object, propertyKey: string | symbol): void => {
    if(!target.hasOwnProperty('relations')){
      let relations: any = {}
      relations[propertyKey] = Object.assign(options, { type: 'hasMany' })
      Object.defineProperty(target, 'relations', { value: relations })
    } else 
      (target as ClassWithRelations).relations[propertyKey] = Object.assign(options, { type: 'hasMany' as Relations })
  };
}