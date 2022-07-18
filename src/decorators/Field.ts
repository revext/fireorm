
import { FieldConfig } from "~/types/configs/FieldConfig";
import { PropertyDecoratorFunction } from "~/types/functions/PropertyDecoratorFunction";
import { ClassWithFields } from "~/types/internal/ClassWithFields";

export function Field(options: FieldConfig = null): PropertyDecoratorFunction {
  return  (target: Object, propertyKey: string | symbol): void => {
    if(!target.hasOwnProperty('fields')){
      let fields: any = {}
      fields[propertyKey] = options ?? {}
      Object.defineProperty(target, 'fields', { value: fields })
    } else 
      (target as ClassWithFields).fields[propertyKey] = options ?? {}
  };
}
