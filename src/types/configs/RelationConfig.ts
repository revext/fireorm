import { ConstructorFunction } from "../functions/ConstructorFunction"


type RelationType = 'hasMany' | 'hasCollection' | 'hasOne'

export type RelationConfig = { name?: string, modelClass: ConstructorFunction<unknown>, foreignProperty?: string }

export type HasOneRelationConfig = RelationConfig & { relatedId?: string }
export type HasManyRelationConfig = RelationConfig & {  mapIds?: Function, relatedIds?: string }

export type RelationConfigWithType = 
    (RelationConfig | HasOneRelationConfig | HasManyRelationConfig) & { type: RelationType }