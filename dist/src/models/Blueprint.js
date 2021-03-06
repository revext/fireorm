"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Blueprint = void 0;
const Commons_1 = __importDefault(require("../utilities/Commons"));
class Blueprint {
    constructor(model, routeParams = {}) {
        this.collectionRouteParams = {};
        this.constructorFunction = Commons_1.default.getConstructor(model);
        this.collectionRoute = model.getRoute();
        this.collectionRouteParams = routeParams;
    }
    static createBlueprint(constructor) {
        return new Blueprint(new constructor());
    }
    buildCollectionRoute() {
        let pathTemplate = this.collectionRoute;
        Object.keys(this.collectionRouteParams).forEach(key => {
            pathTemplate = pathTemplate.replace(`{${key}}`, this.collectionRouteParams[key]);
        });
        return pathTemplate;
    }
    getSubCollectionName() {
        const routeSplit = this.collectionRoute.split('/');
        return routeSplit.pop();
    }
}
exports.Blueprint = Blueprint;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQmx1ZXByaW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL21vZGVscy9CbHVlcHJpbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EsbUVBQTJDO0FBSTNDLE1BQWEsU0FBUztJQU9sQixZQUFZLEtBQVEsRUFBRSxjQUFtQixFQUFFO1FBRjNDLDBCQUFxQixHQUFRLEVBQUUsQ0FBQTtRQUczQixJQUFJLENBQUMsbUJBQW1CLEdBQUcsaUJBQU8sQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDeEQsSUFBSSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDdkMsSUFBSSxDQUFDLHFCQUFxQixHQUFHLFdBQVcsQ0FBQTtJQUM1QyxDQUFDO0lBRUQsTUFBTSxDQUFDLGVBQWUsQ0FBa0IsV0FBbUM7UUFDdkUsT0FBTyxJQUFJLFNBQVMsQ0FBQyxJQUFJLFdBQVcsRUFBRSxDQUFDLENBQUE7SUFDM0MsQ0FBQztJQUVELG9CQUFvQjtRQUNoQixJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFBO1FBRXZDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3BELFlBQVksR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxHQUFHLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFDbEYsQ0FBQyxDQUFDLENBQUE7UUFFRixPQUFPLFlBQVksQ0FBQTtJQUN2QixDQUFDO0lBRUQsb0JBQW9CO1FBQ2xCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBRWxELE9BQU8sVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFBO0lBQ3pCLENBQUM7Q0FDSjtBQWhDRCw4QkFnQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb25zdHJ1Y3RvckZ1bmN0aW9uIH0gZnJvbSBcIn4vdHlwZXMvZnVuY3Rpb25zL0NvbnN0cnVjdG9yRnVuY3Rpb25cIjtcclxuaW1wb3J0IENvbW1vbnMgZnJvbSBcIi4uL3V0aWxpdGllcy9Db21tb25zXCI7XHJcbmltcG9ydCBNb2RlbCBmcm9tIFwiLi9Nb2RlbFwiO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBCbHVlcHJpbnQ8VCBleHRlbmRzIE1vZGVsPiB7XHJcbiAgICBjb25zdHJ1Y3RvckZ1bmN0aW9uOiBDb25zdHJ1Y3RvckZ1bmN0aW9uPFQ+XHJcblxyXG4gICAgY29sbGVjdGlvblJvdXRlOiBzdHJpbmdcclxuXHJcbiAgICBjb2xsZWN0aW9uUm91dGVQYXJhbXM6IGFueSA9IHt9XHJcblxyXG4gICAgY29uc3RydWN0b3IobW9kZWw6IFQsIHJvdXRlUGFyYW1zOiBhbnkgPSB7fSkge1xyXG4gICAgICAgIHRoaXMuY29uc3RydWN0b3JGdW5jdGlvbiA9IENvbW1vbnMuZ2V0Q29uc3RydWN0b3IobW9kZWwpXHJcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9uUm91dGUgPSBtb2RlbC5nZXRSb3V0ZSgpXHJcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9uUm91dGVQYXJhbXMgPSByb3V0ZVBhcmFtc1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBjcmVhdGVCbHVlcHJpbnQ8VCBleHRlbmRzIE1vZGVsPihjb25zdHJ1Y3RvcjogQ29uc3RydWN0b3JGdW5jdGlvbjxUPik6IEJsdWVwcmludDxUPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCbHVlcHJpbnQobmV3IGNvbnN0cnVjdG9yKCkpXHJcbiAgICB9XHJcblxyXG4gICAgYnVpbGRDb2xsZWN0aW9uUm91dGUoKTogc3RyaW5nIHtcclxuICAgICAgICBsZXQgcGF0aFRlbXBsYXRlID0gdGhpcy5jb2xsZWN0aW9uUm91dGVcclxuICAgICAgICBcclxuICAgICAgICBPYmplY3Qua2V5cyh0aGlzLmNvbGxlY3Rpb25Sb3V0ZVBhcmFtcykuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgICAgcGF0aFRlbXBsYXRlID0gcGF0aFRlbXBsYXRlLnJlcGxhY2UoYHske2tleX19YCwgdGhpcy5jb2xsZWN0aW9uUm91dGVQYXJhbXNba2V5XSlcclxuICAgICAgICB9KVxyXG4gIFxyXG4gICAgICAgIHJldHVybiBwYXRoVGVtcGxhdGVcclxuICAgIH1cclxuXHJcbiAgICBnZXRTdWJDb2xsZWN0aW9uTmFtZSgpOiBzdHJpbmcge1xyXG4gICAgICBjb25zdCByb3V0ZVNwbGl0ID0gdGhpcy5jb2xsZWN0aW9uUm91dGUuc3BsaXQoJy8nKVxyXG5cclxuICAgICAgcmV0dXJuIHJvdXRlU3BsaXQucG9wKClcclxuICAgIH1cclxufSJdfQ==