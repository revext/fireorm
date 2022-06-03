"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRepositoryFor = exports.registerRepositories = exports.registerRepository = void 0;
const Commons_1 = __importDefault(require("../utilities/Commons"));
let gThis = globalThis;
gThis._repositoryMapping = new Map();
function registerRepository(repositoryName) {
    const repository = new repositoryName(gThis._engine);
    gThis._repositoryMapping.set(Commons_1.default.getConstructor(repository.getModel()).name, repository);
}
exports.registerRepository = registerRepository;
function registerRepositories(repositories) {
    repositories.forEach(repository => {
        registerRepository(repository);
    });
}
exports.registerRepositories = registerRepositories;
function getRepositoryFor(modelClass) {
    if (!modelClass) {
        throw new Error(`'modelClass' is not defined on the property, also check if your property has a default value`);
    }
    if (!gThis._repositoryMapping.has(modelClass.name)) {
        throw new Error(`No repository found for ${modelClass.name}`);
    }
    const repository = gThis._repositoryMapping.get(modelClass.name);
    return repository;
}
exports.getRepositoryFor = getRepositoryFor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvcmVwb3NpdG9yaWVzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUdBLG1FQUEwQztBQUkxQyxJQUFJLEtBQUssR0FBSSxVQUE0QixDQUFBO0FBQ3pDLEtBQUssQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLEdBQUcsRUFBMkIsQ0FBQztBQUc5RCxTQUFnQixrQkFBa0IsQ0FBMkMsY0FBc0M7SUFDakgsTUFBTSxVQUFVLEdBQUcsSUFBSSxjQUFjLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ3BELEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsaUJBQU8sQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFBO0FBQzlGLENBQUM7QUFIRCxnREFHQztBQUVELFNBQWdCLG9CQUFvQixDQUFDLFlBQXNEO0lBQ3pGLFlBQVksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7UUFDaEMsa0JBQWtCLENBQUMsVUFBVSxDQUFDLENBQUE7SUFDaEMsQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDO0FBSkQsb0RBSUM7QUFFRCxTQUFnQixnQkFBZ0IsQ0FBOEIsVUFBd0M7SUFDcEcsSUFBRyxDQUFDLFVBQVUsRUFBRTtRQUNkLE1BQU0sSUFBSSxLQUFLLENBQUMsOEZBQThGLENBQUMsQ0FBQTtLQUNoSDtJQUNELElBQUcsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUMvQyxNQUFNLElBQUksS0FBSyxDQUFDLDJCQUEyQixVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztLQUNqRTtJQUNELE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBTSxDQUFBO0lBQ3JFLE9BQU8sVUFBVSxDQUFBO0FBQ25CLENBQUM7QUFURCw0Q0FTQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBNb2RlbCBmcm9tIFwifi9tb2RlbHMvTW9kZWxcIjtcclxuaW1wb3J0IHsgQ29uc3RydWN0b3JGdW5jdGlvbiB9IGZyb20gXCJ+L3R5cGVzL2Z1bmN0aW9ucy9Db25zdHJ1Y3RvckZ1bmN0aW9uXCI7XHJcbmltcG9ydCBSZXBvc2l0b3J5IGZyb20gXCIuL1JlcG9zaXRvcnlcIjtcclxuaW1wb3J0IENvbW1vbnMgZnJvbSBcIi4uL3V0aWxpdGllcy9Db21tb25zXCJcclxuaW1wb3J0IHsgR2xvYmFsVGhpc09ybSB9IGZyb20gXCJ+L3R5cGVzL2ludGVybmFsL0dsb2JhbFRoaXNPcm1cIjtcclxuXHJcblxyXG5sZXQgZ1RoaXMgPSAoZ2xvYmFsVGhpcyBhcyBHbG9iYWxUaGlzT3JtKVxyXG5nVGhpcy5fcmVwb3NpdG9yeU1hcHBpbmcgPSBuZXcgTWFwPHN0cmluZywgUmVwb3NpdG9yeTxhbnk+PigpO1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlclJlcG9zaXRvcnk8SyBleHRlbmRzIFJlcG9zaXRvcnk8VD4sIFQgZXh0ZW5kcyBNb2RlbD4ocmVwb3NpdG9yeU5hbWU6IENvbnN0cnVjdG9yRnVuY3Rpb248Sz4pIHtcclxuICBjb25zdCByZXBvc2l0b3J5ID0gbmV3IHJlcG9zaXRvcnlOYW1lKGdUaGlzLl9lbmdpbmUpXHJcbiAgZ1RoaXMuX3JlcG9zaXRvcnlNYXBwaW5nLnNldChDb21tb25zLmdldENvbnN0cnVjdG9yKHJlcG9zaXRvcnkuZ2V0TW9kZWwoKSkubmFtZSwgcmVwb3NpdG9yeSlcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyUmVwb3NpdG9yaWVzKHJlcG9zaXRvcmllczogQ29uc3RydWN0b3JGdW5jdGlvbjxSZXBvc2l0b3J5PE1vZGVsPj5bXSkge1xyXG4gIHJlcG9zaXRvcmllcy5mb3JFYWNoKHJlcG9zaXRvcnkgPT4ge1xyXG4gICAgcmVnaXN0ZXJSZXBvc2l0b3J5KHJlcG9zaXRvcnkpXHJcbiAgfSlcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlcG9zaXRvcnlGb3I8UiBleHRlbmRzIFJlcG9zaXRvcnk8TW9kZWw+Pihtb2RlbENsYXNzOiBDb25zdHJ1Y3RvckZ1bmN0aW9uPHVua25vd24+KTogUiB7XHJcbiAgaWYoIW1vZGVsQ2xhc3MpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgJ21vZGVsQ2xhc3MnIGlzIG5vdCBkZWZpbmVkIG9uIHRoZSBwcm9wZXJ0eSwgYWxzbyBjaGVjayBpZiB5b3VyIHByb3BlcnR5IGhhcyBhIGRlZmF1bHQgdmFsdWVgKVxyXG4gIH1cclxuICBpZighZ1RoaXMuX3JlcG9zaXRvcnlNYXBwaW5nLmhhcyhtb2RlbENsYXNzLm5hbWUpKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gcmVwb3NpdG9yeSBmb3VuZCBmb3IgJHttb2RlbENsYXNzLm5hbWV9YCk7XHJcbiAgfVxyXG4gIGNvbnN0IHJlcG9zaXRvcnkgPSBnVGhpcy5fcmVwb3NpdG9yeU1hcHBpbmcuZ2V0KG1vZGVsQ2xhc3MubmFtZSkgYXMgUlxyXG4gIHJldHVybiByZXBvc2l0b3J5XHJcbn0iXX0=