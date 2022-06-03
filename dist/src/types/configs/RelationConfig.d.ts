import { ConstructorFunction } from "../functions/ConstructorFunction";
declare type RelationType = 'hasMany' | 'hasCollection' | 'hasOne';
export declare type RelationConfig = {
    name?: string;
    modelClass: ConstructorFunction<unknown>;
    foreignProperty?: string;
};
export declare type HasOneRelationConfig = RelationConfig & {
    relatedId?: string;
};
export declare type HasManyRelationConfig = RelationConfig & {
    mapIds?: Function;
    relatedIds?: string;
};
export declare type RelationConfigWithType = (RelationConfig | HasOneRelationConfig | HasManyRelationConfig) & {
    type: RelationType;
};
export {};
