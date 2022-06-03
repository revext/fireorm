import Model from "~/models/Model";
import { PropertyDecoratorFunction } from "~/types/functions/PropertyDecoratorFunction";
import { HasManyRelationConfig } from "~/types/configs/RelationConfig";
export declare function HasMany<T extends Model, K extends Model>(options: HasManyRelationConfig): PropertyDecoratorFunction;
