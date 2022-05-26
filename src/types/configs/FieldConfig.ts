import { ConstructorFunction } from "~/types/functions/ConstructorFunction"

export type FieldConfig = {
  name?: string | null, 
  modelClass?: ConstructorFunction<unknown>,
  routeParam?: boolean,
  timestamp?: boolean,
  //TODO remove timestamp type from model altogether, and use these converter methods instead
  // toDate?: (value: unknown) => Date
  // fromDate?: (value: unknown) => Date
}