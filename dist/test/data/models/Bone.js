"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bone = void 0;
const index_1 = require("../../../src/index");
class Bone extends index_1.Model {
    constructor() {
        super(...arguments);
        this.length = 0;
        this.dog = null;
    }
}
__decorate([
    (0, index_1.Field)(),
    __metadata("design:type", Number)
], Bone.prototype, "length", void 0);
exports.Bone = Bone;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQm9uZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Rlc3QvZGF0YS9tb2RlbHMvQm9uZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSw4Q0FBaUQ7QUFHakQsTUFBYSxJQUFLLFNBQVEsYUFBSztJQUEvQjs7UUFFSSxXQUFNLEdBQVcsQ0FBQyxDQUFBO1FBSWxCLFFBQUcsR0FBUSxJQUFJLENBQUE7SUFDbkIsQ0FBQztDQUFBO0FBTEc7SUFEQyxJQUFBLGFBQUssR0FBRTs7b0NBQ1U7QUFGdEIsb0JBT0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2RlbCwgRmllbGQgfSBmcm9tIFwiLi4vLi4vLi4vc3JjL2luZGV4XCJcclxuaW1wb3J0IHsgRG9nIH0gZnJvbSBcIi4vRG9nXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBCb25lIGV4dGVuZHMgTW9kZWwge1xyXG4gICAgQEZpZWxkKClcclxuICAgIGxlbmd0aDogbnVtYmVyID0gMFxyXG5cclxuICAgIHdpZHRoOiBudW1iZXJcclxuXHJcbiAgICBkb2c6IERvZyA9IG51bGxcclxufSJdfQ==