import { Model } from "../../../src/index";
import { Dog } from "./Dog";
export declare class Bone extends Model {
    getModelName(): string;
    length: number;
    width: number;
    dog: Dog;
}
