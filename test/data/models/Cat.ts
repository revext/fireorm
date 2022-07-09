import { Human } from "."
import { Collection, Model, Field, HasOne } from "../../../src/index"

@Collection({ route: '/humans/{humanId}/cats'})	
export class Cat extends Model {
    getModelName(): string {
        return 'Cat'
    }
    @Field()
    name: string    

    type: string = 'tiger'

    @Field()
    humanId: string = "1"

    @HasOne({ modelClass: Human })
    human: Human = null
}
