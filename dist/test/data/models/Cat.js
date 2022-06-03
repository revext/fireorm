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
exports.Cat = void 0;
const _1 = require(".");
const index_1 = require("../../../src/index");
let Cat = class Cat extends index_1.Model {
    constructor() {
        super(...arguments);
        this.type = 'tiger';
        this.humanId = "1";
        this.human = null;
    }
};
__decorate([
    (0, index_1.Field)(),
    __metadata("design:type", String)
], Cat.prototype, "name", void 0);
__decorate([
    (0, index_1.Field)(),
    __metadata("design:type", String)
], Cat.prototype, "humanId", void 0);
__decorate([
    (0, index_1.HasOne)({ modelClass: _1.Human }),
    __metadata("design:type", _1.Human)
], Cat.prototype, "human", void 0);
Cat = __decorate([
    (0, index_1.Collection)({ route: '/humans/{humanId}/cats' })
], Cat);
exports.Cat = Cat;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2F0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vdGVzdC9kYXRhL21vZGVscy9DYXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsd0JBQXlCO0FBQ3pCLDhDQUFxRTtBQUdyRSxJQUFhLEdBQUcsR0FBaEIsTUFBYSxHQUFJLFNBQVEsYUFBSztJQUE5Qjs7UUFJSSxTQUFJLEdBQVcsT0FBTyxDQUFBO1FBR3RCLFlBQU8sR0FBVyxHQUFHLENBQUE7UUFHckIsVUFBSyxHQUFVLElBQUksQ0FBQTtJQUN2QixDQUFDO0NBQUEsQ0FBQTtBQVRHO0lBREMsSUFBQSxhQUFLLEdBQUU7O2lDQUNJO0FBS1o7SUFEQyxJQUFBLGFBQUssR0FBRTs7b0NBQ2E7QUFHckI7SUFEQyxJQUFBLGNBQU0sRUFBQyxFQUFFLFVBQVUsRUFBRSxRQUFLLEVBQUUsQ0FBQzs4QkFDdkIsUUFBSztrQ0FBTztBQVZWLEdBQUc7SUFEZixJQUFBLGtCQUFVLEVBQUMsRUFBRSxLQUFLLEVBQUUsd0JBQXdCLEVBQUMsQ0FBQztHQUNsQyxHQUFHLENBV2Y7QUFYWSxrQkFBRyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEh1bWFuIH0gZnJvbSBcIi5cIlxyXG5pbXBvcnQgeyBDb2xsZWN0aW9uLCBNb2RlbCwgRmllbGQsIEhhc09uZSB9IGZyb20gXCIuLi8uLi8uLi9zcmMvaW5kZXhcIlxyXG5cclxuQENvbGxlY3Rpb24oeyByb3V0ZTogJy9odW1hbnMve2h1bWFuSWR9L2NhdHMnfSlcdFxyXG5leHBvcnQgY2xhc3MgQ2F0IGV4dGVuZHMgTW9kZWwge1xyXG4gICAgQEZpZWxkKClcclxuICAgIG5hbWU6IHN0cmluZyAgICBcclxuXHJcbiAgICB0eXBlOiBzdHJpbmcgPSAndGlnZXInXHJcblxyXG4gICAgQEZpZWxkKClcclxuICAgIGh1bWFuSWQ6IHN0cmluZyA9IFwiMVwiXHJcblxyXG4gICAgQEhhc09uZSh7IG1vZGVsQ2xhc3M6IEh1bWFuIH0pXHJcbiAgICBodW1hbjogSHVtYW4gPSBudWxsXHJcbn1cclxuIl19