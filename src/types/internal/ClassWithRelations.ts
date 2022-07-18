import { RelationConfigWithType } from "../configs/RelationConfig"


export type Relations = 'hasCollection' | 'hasOne' | 'hasMany'
export type ClassWithRelations = Object & { relations: { [key: string | symbol]: RelationConfigWithType }}