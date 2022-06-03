import Model from "~/models/Model";
import { PropertyDecoratorFunction } from "~/types/functions/PropertyDecoratorFunction";
import { HasOneRelationConfig } from "~/types/configs/RelationConfig";
export declare function HasOne<K extends Model>(options: HasOneRelationConfig): PropertyDecoratorFunction;
