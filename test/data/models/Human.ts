import { Collection, Model, Field, HasCollection, HasMany } from "../../../src/index"
import { Dog } from '../models'
// console.log(models)
@Collection({ route: 'humans'})	
export class Human extends Model {
    @Field()
    name: string = ''

    @HasMany({ modelClass: Human, mapIds: (_:  Human) => { return ['2'] } })
    relatives:  Human[] = []

    @HasCollection({ modelClass: Dog })
    dogs:  Dog[] = []

    @Field({ timestamp: true })
    createdAt: Date = new Date()
}