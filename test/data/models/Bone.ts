import { Model, Field } from "../../../src/index"

export class Bone extends Model {
    @Field()
    length: number = 0

    width: number
}