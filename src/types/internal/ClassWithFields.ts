import { FieldConfig } from "../configs/FieldConfig";


export type ClassWithFields = Object & { fields?: { [key: string | symbol]: FieldConfig }}