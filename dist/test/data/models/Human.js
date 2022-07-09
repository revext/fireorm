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
    getModelName() {
        return 'Human';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSHVtYW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi90ZXN0L2RhdGEvbW9kZWxzL0h1bWFuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFBQSw4Q0FBcUY7QUFDckYsc0NBQStCO0FBQy9CLHNCQUFzQjtBQUV0QixJQUFhLEtBQUssYUFBbEIsTUFBYSxLQUFNLFNBQVEsYUFBSztJQUFoQzs7UUFLSSxTQUFJLEdBQVcsRUFBRSxDQUFBO1FBR2pCLGNBQVMsR0FBYSxFQUFFLENBQUE7UUFHeEIsU0FBSSxHQUFXLEVBQUUsQ0FBQTtRQUdqQixjQUFTLEdBQVMsSUFBSSxJQUFJLEVBQUUsQ0FBQTtJQUNoQyxDQUFDO0lBZEcsWUFBWTtRQUNSLE9BQU8sT0FBTyxDQUFBO0lBQ2xCLENBQUM7Q0FZSixDQUFBO0FBVkc7SUFEQyxJQUFBLGFBQUssR0FBRTs7bUNBQ1M7QUFHakI7SUFEQyxJQUFBLGVBQU8sRUFBQyxFQUFFLFVBQVUsRUFBRSxPQUFLLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBUyxFQUFFLEVBQUUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUEsQ0FBQyxDQUFDLEVBQUUsQ0FBQzs7d0NBQ2hEO0FBR3hCO0lBREMsSUFBQSxxQkFBYSxFQUFDLEVBQUUsVUFBVSxFQUFFLFlBQUcsRUFBRSxDQUFDOzttQ0FDbEI7QUFHakI7SUFEQyxJQUFBLGFBQUssRUFBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQzs4QkFDaEIsSUFBSTt3Q0FBYTtBQWRuQixLQUFLO0lBRGpCLElBQUEsa0JBQVUsRUFBQyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUMsQ0FBQztHQUNsQixLQUFLLENBZWpCO0FBZlksc0JBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb2xsZWN0aW9uLCBNb2RlbCwgRmllbGQsIEhhc0NvbGxlY3Rpb24sIEhhc01hbnkgfSBmcm9tIFwiLi4vLi4vLi4vc3JjL2luZGV4XCJcclxuaW1wb3J0IHsgRG9nIH0gZnJvbSAnLi4vbW9kZWxzJ1xyXG4vLyBjb25zb2xlLmxvZyhtb2RlbHMpXHJcbkBDb2xsZWN0aW9uKHsgcm91dGU6ICdodW1hbnMnfSlcdFxyXG5leHBvcnQgY2xhc3MgSHVtYW4gZXh0ZW5kcyBNb2RlbCB7XHJcbiAgICBnZXRNb2RlbE5hbWUoKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gJ0h1bWFuJ1xyXG4gICAgfVxyXG4gICAgQEZpZWxkKClcclxuICAgIG5hbWU6IHN0cmluZyA9ICcnXHJcblxyXG4gICAgQEhhc01hbnkoeyBtb2RlbENsYXNzOiBIdW1hbiwgbWFwSWRzOiAoXzogIEh1bWFuKSA9PiB7IHJldHVybiBbJzInXSB9IH0pXHJcbiAgICByZWxhdGl2ZXM6ICBIdW1hbltdID0gW11cclxuXHJcbiAgICBASGFzQ29sbGVjdGlvbih7IG1vZGVsQ2xhc3M6IERvZyB9KVxyXG4gICAgZG9nczogIERvZ1tdID0gW11cclxuXHJcbiAgICBARmllbGQoeyB0aW1lc3RhbXA6IHRydWUgfSlcclxuICAgIGNyZWF0ZWRBdDogRGF0ZSA9IG5ldyBEYXRlKClcclxufSJdfQ==