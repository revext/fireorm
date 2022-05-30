import { Collection, Model, Field } from "../../../src/index"

@Collection({ route: '/humans/{humanId}/cats'})	
export class Cat extends Model {
    @Field()
    name: string    

    type: string = 'tiger'
}
