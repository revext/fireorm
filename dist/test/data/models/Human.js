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
var Human_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Human = void 0;
const index_1 = require("../../../src/index");
const models_1 = require("../models");
// console.log(models)
let Human = Human_1 = class Human extends index_1.Model {
    constructor() {
        super(...arguments);
        this.name = '';
        this.relatives = [];
        this.dogs = [];
        this.createdAt = new Date();
    }
};
__decorate([
    (0, index_1.Field)(),
    __metadata("design:type", String)
], Human.prototype, "name", void 0);
__decorate([
    (0, index_1.HasMany)({ modelClass: Human_1, mapIds: (_) => { return ['2']; } }),
    __metadata("design:type", Array)
], Human.prototype, "relatives", void 0);
__decorate([
    (0, index_1.HasCollection)({ modelClass: models_1.Dog }),
    __metadata("design:type", Array)
], Human.prototype, "dogs", void 0);
__decorate([
    (0, index_1.Field)({ timestamp: true }),
    __metadata("design:type", Date)
], Human.prototype, "createdAt", void 0);
Human = Human_1 = __decorate([
    (0, index_1.Collection)({ route: 'humans' })
], Human);
exports.Human = Human;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSHVtYW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi90ZXN0L2RhdGEvbW9kZWxzL0h1bWFuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFBQSw4Q0FBcUY7QUFDckYsc0NBQStCO0FBQy9CLHNCQUFzQjtBQUV0QixJQUFhLEtBQUssYUFBbEIsTUFBYSxLQUFNLFNBQVEsYUFBSztJQUFoQzs7UUFFSSxTQUFJLEdBQVcsRUFBRSxDQUFBO1FBR2pCLGNBQVMsR0FBYSxFQUFFLENBQUE7UUFHeEIsU0FBSSxHQUFXLEVBQUUsQ0FBQTtRQUdqQixjQUFTLEdBQVMsSUFBSSxJQUFJLEVBQUUsQ0FBQTtJQUNoQyxDQUFDO0NBQUEsQ0FBQTtBQVZHO0lBREMsSUFBQSxhQUFLLEdBQUU7O21DQUNTO0FBR2pCO0lBREMsSUFBQSxlQUFPLEVBQUMsRUFBRSxVQUFVLEVBQUUsT0FBSyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQVMsRUFBRSxFQUFFLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFBLENBQUMsQ0FBQyxFQUFFLENBQUM7O3dDQUNoRDtBQUd4QjtJQURDLElBQUEscUJBQWEsRUFBQyxFQUFFLFVBQVUsRUFBRSxZQUFHLEVBQUUsQ0FBQzs7bUNBQ2xCO0FBR2pCO0lBREMsSUFBQSxhQUFLLEVBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUM7OEJBQ2hCLElBQUk7d0NBQWE7QUFYbkIsS0FBSztJQURqQixJQUFBLGtCQUFVLEVBQUMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFDLENBQUM7R0FDbEIsS0FBSyxDQVlqQjtBQVpZLHNCQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29sbGVjdGlvbiwgTW9kZWwsIEZpZWxkLCBIYXNDb2xsZWN0aW9uLCBIYXNNYW55IH0gZnJvbSBcIi4uLy4uLy4uL3NyYy9pbmRleFwiXHJcbmltcG9ydCB7IERvZyB9IGZyb20gJy4uL21vZGVscydcclxuLy8gY29uc29sZS5sb2cobW9kZWxzKVxyXG5AQ29sbGVjdGlvbih7IHJvdXRlOiAnaHVtYW5zJ30pXHRcclxuZXhwb3J0IGNsYXNzIEh1bWFuIGV4dGVuZHMgTW9kZWwge1xyXG4gICAgQEZpZWxkKClcclxuICAgIG5hbWU6IHN0cmluZyA9ICcnXHJcblxyXG4gICAgQEhhc01hbnkoeyBtb2RlbENsYXNzOiBIdW1hbiwgbWFwSWRzOiAoXzogIEh1bWFuKSA9PiB7IHJldHVybiBbJzInXSB9IH0pXHJcbiAgICByZWxhdGl2ZXM6ICBIdW1hbltdID0gW11cclxuXHJcbiAgICBASGFzQ29sbGVjdGlvbih7IG1vZGVsQ2xhc3M6IERvZyB9KVxyXG4gICAgZG9nczogIERvZ1tdID0gW11cclxuXHJcbiAgICBARmllbGQoeyB0aW1lc3RhbXA6IHRydWUgfSlcclxuICAgIGNyZWF0ZWRBdDogRGF0ZSA9IG5ldyBEYXRlKClcclxufSJdfQ==