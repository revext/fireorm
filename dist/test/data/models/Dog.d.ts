import { Model } from "../../../src/index";
import { Bone } from '.';
export declare class Dog extends Model {
    getModelName(): string;
    name: string;
    humanId: string;
    bones: Bone[];
    type: string;
    tagNames: Map<string, string>;
}
