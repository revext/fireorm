import { Collection, Model, Field } from "../../../src/index"
import { Bone } from '.'

@Collection({ route: '/humans/{humanId}/dogs'})	
export class Dog extends Model {
    @Field()
    name: string    

    @Field({ routeParam: true })
    humanId: string = "1"

    @Field({ modelClass: Bone })
bones: Bone[]

    type: string = 'terrier'

    //TODO be able to convert map values as modelClasses
    @Field({ modelClass: Map })
    tagNames: Map<string, string> = new Map([['test1','test2']])
}