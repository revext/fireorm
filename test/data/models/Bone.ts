import { Model, Field } from "../../../src/index"
import { Dog } from "./Dog"

export class Bone extends Model {
    @Field()
    length: number = 0

    width: number

    dog: Dog = null
}