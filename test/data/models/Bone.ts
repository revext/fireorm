import { Model, Field } from "../../../src/index"
import { Dog } from "./Dog"

export class Bone extends Model {
    getModelName(): string {
        return 'Bone'
    }
    @Field()
    length: number = 0

    width: number

    dog: Dog = null
}