import Model from "~/models/Model";
import { ValidateConfig } from "~/types/configs/ValidateConfig";
import { PropertyDecoratorFunction } from "~/types/functions/PropertyDecoratorFunction";
import { ClassWithRules } from "~/types/internal/ClassWithRules";


export function Validate<T extends Model>(rule: ValidateConfig<T>): PropertyDecoratorFunction {
  return  (target: Object, propertyKey: string | symbol): void => {
    if(!target.hasOwnProperty('rules')){
      let rules: any = {}
      rules[propertyKey] = rule
      Object.defineProperty(target, 'rules', { value: rules })
    } else 
      (target as ClassWithRules<T>).rules[propertyKey] = rule
  };
}
