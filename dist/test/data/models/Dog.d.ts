import { Model } from "../../../src/index";
import { Bone } from '.';
export declare class Dog extends Model {
    name: string;
    humanId: string;
    bones: Bone[];
    type: string;
    tagNames: Map<string, string>;
}
