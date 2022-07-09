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
    getModelName() {
        return 'Cat';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2F0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vdGVzdC9kYXRhL21vZGVscy9DYXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsd0JBQXlCO0FBQ3pCLDhDQUFxRTtBQUdyRSxJQUFhLEdBQUcsR0FBaEIsTUFBYSxHQUFJLFNBQVEsYUFBSztJQUE5Qjs7UUFPSSxTQUFJLEdBQVcsT0FBTyxDQUFBO1FBR3RCLFlBQU8sR0FBVyxHQUFHLENBQUE7UUFHckIsVUFBSyxHQUFVLElBQUksQ0FBQTtJQUN2QixDQUFDO0lBYkcsWUFBWTtRQUNSLE9BQU8sS0FBSyxDQUFBO0lBQ2hCLENBQUM7Q0FXSixDQUFBO0FBVEc7SUFEQyxJQUFBLGFBQUssR0FBRTs7aUNBQ0k7QUFLWjtJQURDLElBQUEsYUFBSyxHQUFFOztvQ0FDYTtBQUdyQjtJQURDLElBQUEsY0FBTSxFQUFDLEVBQUUsVUFBVSxFQUFFLFFBQUssRUFBRSxDQUFDOzhCQUN2QixRQUFLO2tDQUFPO0FBYlYsR0FBRztJQURmLElBQUEsa0JBQVUsRUFBQyxFQUFFLEtBQUssRUFBRSx3QkFBd0IsRUFBQyxDQUFDO0dBQ2xDLEdBQUcsQ0FjZjtBQWRZLGtCQUFHIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSHVtYW4gfSBmcm9tIFwiLlwiXHJcbmltcG9ydCB7IENvbGxlY3Rpb24sIE1vZGVsLCBGaWVsZCwgSGFzT25lIH0gZnJvbSBcIi4uLy4uLy4uL3NyYy9pbmRleFwiXHJcblxyXG5AQ29sbGVjdGlvbih7IHJvdXRlOiAnL2h1bWFucy97aHVtYW5JZH0vY2F0cyd9KVx0XHJcbmV4cG9ydCBjbGFzcyBDYXQgZXh0ZW5kcyBNb2RlbCB7XHJcbiAgICBnZXRNb2RlbE5hbWUoKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gJ0NhdCdcclxuICAgIH1cclxuICAgIEBGaWVsZCgpXHJcbiAgICBuYW1lOiBzdHJpbmcgICAgXHJcblxyXG4gICAgdHlwZTogc3RyaW5nID0gJ3RpZ2VyJ1xyXG5cclxuICAgIEBGaWVsZCgpXHJcbiAgICBodW1hbklkOiBzdHJpbmcgPSBcIjFcIlxyXG5cclxuICAgIEBIYXNPbmUoeyBtb2RlbENsYXNzOiBIdW1hbiB9KVxyXG4gICAgaHVtYW46IEh1bWFuID0gbnVsbFxyXG59XHJcbiJdfQ==