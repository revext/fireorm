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
    getModelName() {
        return 'Bone';
    }
}
__decorate([
    (0, index_1.Field)(),
    __metadata("design:type", Number)
], Bone.prototype, "length", void 0);
exports.Bone = Bone;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQm9uZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Rlc3QvZGF0YS9tb2RlbHMvQm9uZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSw4Q0FBaUQ7QUFHakQsTUFBYSxJQUFLLFNBQVEsYUFBSztJQUEvQjs7UUFLSSxXQUFNLEdBQVcsQ0FBQyxDQUFBO1FBSWxCLFFBQUcsR0FBUSxJQUFJLENBQUE7SUFDbkIsQ0FBQztJQVRHLFlBQVk7UUFDUixPQUFPLE1BQU0sQ0FBQTtJQUNqQixDQUFDO0NBT0o7QUFMRztJQURDLElBQUEsYUFBSyxHQUFFOztvQ0FDVTtBQUx0QixvQkFVQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vZGVsLCBGaWVsZCB9IGZyb20gXCIuLi8uLi8uLi9zcmMvaW5kZXhcIlxyXG5pbXBvcnQgeyBEb2cgfSBmcm9tIFwiLi9Eb2dcIlxyXG5cclxuZXhwb3J0IGNsYXNzIEJvbmUgZXh0ZW5kcyBNb2RlbCB7XHJcbiAgICBnZXRNb2RlbE5hbWUoKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gJ0JvbmUnXHJcbiAgICB9XHJcbiAgICBARmllbGQoKVxyXG4gICAgbGVuZ3RoOiBudW1iZXIgPSAwXHJcblxyXG4gICAgd2lkdGg6IG51bWJlclxyXG5cclxuICAgIGRvZzogRG9nID0gbnVsbFxyXG59Il19