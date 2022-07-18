import { RelationConfigWithType } from "../configs/RelationConfig";
export declare type Relations = 'hasCollection' | 'hasOne' | 'hasMany';
export declare type ClassWithRelations = Object & {
    relations: {
        [key: string | symbol]: RelationConfigWithType;
    };
};
