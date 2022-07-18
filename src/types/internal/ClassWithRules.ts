import { ValidateConfig } from "../configs/ValidateConfig";


export type ClassWithRules<T> = Object & { rules?: { [key: string | symbol]: ValidateConfig<T> }}