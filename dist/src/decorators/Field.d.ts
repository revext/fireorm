import Model from "~/models/Model";
import { FieldConfig } from "~/types/configs/FieldConfig";
import { PropertyDecoratorFunction } from "~/types/functions/PropertyDecoratorFunction";
export declare function Field<T extends Model>(options?: FieldConfig): PropertyDecoratorFunction;
