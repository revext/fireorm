import { ClassDecoratorFunction } from "~/types/functions/ClassDecoratorFunction";


export function Collection(options: { route: string }): ClassDecoratorFunction {
  return  (target: Function): void => {
    const prototype = target.prototype
    Object.defineProperty(prototype, 'collection', { value: options })
  };
}
