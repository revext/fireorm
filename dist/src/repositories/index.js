"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRepositoryFor = exports.registerRepositories = exports.registerRepository = void 0;
let gThis = globalThis;
gThis._repositoryMapping = new Map();
function registerRepository(repositoryName) {
    const repository = new repositoryName(gThis._engine);
    gThis._repositoryMapping.set(repository.getModel().getModelName(), repository);
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
    const modelName = new modelClass().getModelName();
    if (!gThis._repositoryMapping.has(modelName)) {
        throw new Error(`No repository found for ${modelName}`);
    }
    const repository = gThis._repositoryMapping.get(modelName);
    return repository;
}
exports.getRepositoryFor = getRepositoryFor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvcmVwb3NpdG9yaWVzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQU1BLElBQUksS0FBSyxHQUFJLFVBQTRCLENBQUE7QUFDekMsS0FBSyxDQUFDLGtCQUFrQixHQUFHLElBQUksR0FBRyxFQUEyQixDQUFDO0FBRzlELFNBQWdCLGtCQUFrQixDQUEyQyxjQUFzQztJQUNqSCxNQUFNLFVBQVUsR0FBRyxJQUFJLGNBQWMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDcEQsS0FBSyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUMsWUFBWSxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUE7QUFDaEYsQ0FBQztBQUhELGdEQUdDO0FBRUQsU0FBZ0Isb0JBQW9CLENBQUMsWUFBc0Q7SUFDekYsWUFBWSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRTtRQUNoQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsQ0FBQTtJQUNoQyxDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUM7QUFKRCxvREFJQztBQUVELFNBQWdCLGdCQUFnQixDQUE4QixVQUF3QztJQUNwRyxJQUFHLENBQUMsVUFBVSxFQUFFO1FBQ2QsTUFBTSxJQUFJLEtBQUssQ0FBQyw4RkFBOEYsQ0FBQyxDQUFBO0tBQ2hIO0lBQ0QsTUFBTSxTQUFTLEdBQUksSUFBSSxVQUFVLEVBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQTtJQUM1RCxJQUFHLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRTtRQUN6QyxNQUFNLElBQUksS0FBSyxDQUFDLDJCQUEyQixTQUFTLEVBQUUsQ0FBQyxDQUFDO0tBQzNEO0lBQ0QsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQU0sQ0FBQTtJQUMvRCxPQUFPLFVBQVUsQ0FBQTtBQUNuQixDQUFDO0FBVkQsNENBVUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTW9kZWwgZnJvbSBcIn4vbW9kZWxzL01vZGVsXCI7XHJcbmltcG9ydCB7IENvbnN0cnVjdG9yRnVuY3Rpb24gfSBmcm9tIFwifi90eXBlcy9mdW5jdGlvbnMvQ29uc3RydWN0b3JGdW5jdGlvblwiO1xyXG5pbXBvcnQgUmVwb3NpdG9yeSBmcm9tIFwiLi9SZXBvc2l0b3J5XCI7XHJcbmltcG9ydCB7IEdsb2JhbFRoaXNPcm0gfSBmcm9tIFwifi90eXBlcy9pbnRlcm5hbC9HbG9iYWxUaGlzT3JtXCI7XHJcblxyXG5cclxubGV0IGdUaGlzID0gKGdsb2JhbFRoaXMgYXMgR2xvYmFsVGhpc09ybSlcclxuZ1RoaXMuX3JlcG9zaXRvcnlNYXBwaW5nID0gbmV3IE1hcDxzdHJpbmcsIFJlcG9zaXRvcnk8YW55Pj4oKTtcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJSZXBvc2l0b3J5PEsgZXh0ZW5kcyBSZXBvc2l0b3J5PFQ+LCBUIGV4dGVuZHMgTW9kZWw+KHJlcG9zaXRvcnlOYW1lOiBDb25zdHJ1Y3RvckZ1bmN0aW9uPEs+KSB7XHJcbiAgY29uc3QgcmVwb3NpdG9yeSA9IG5ldyByZXBvc2l0b3J5TmFtZShnVGhpcy5fZW5naW5lKVxyXG4gIGdUaGlzLl9yZXBvc2l0b3J5TWFwcGluZy5zZXQocmVwb3NpdG9yeS5nZXRNb2RlbCgpLmdldE1vZGVsTmFtZSgpLCByZXBvc2l0b3J5KVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJSZXBvc2l0b3JpZXMocmVwb3NpdG9yaWVzOiBDb25zdHJ1Y3RvckZ1bmN0aW9uPFJlcG9zaXRvcnk8TW9kZWw+PltdKSB7XHJcbiAgcmVwb3NpdG9yaWVzLmZvckVhY2gocmVwb3NpdG9yeSA9PiB7XHJcbiAgICByZWdpc3RlclJlcG9zaXRvcnkocmVwb3NpdG9yeSlcclxuICB9KVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVwb3NpdG9yeUZvcjxSIGV4dGVuZHMgUmVwb3NpdG9yeTxNb2RlbD4+KG1vZGVsQ2xhc3M6IENvbnN0cnVjdG9yRnVuY3Rpb248dW5rbm93bj4pOiBSIHtcclxuICBpZighbW9kZWxDbGFzcykge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGAnbW9kZWxDbGFzcycgaXMgbm90IGRlZmluZWQgb24gdGhlIHByb3BlcnR5LCBhbHNvIGNoZWNrIGlmIHlvdXIgcHJvcGVydHkgaGFzIGEgZGVmYXVsdCB2YWx1ZWApXHJcbiAgfVxyXG4gIGNvbnN0IG1vZGVsTmFtZSA9IChuZXcgbW9kZWxDbGFzcygpIGFzIE1vZGVsKS5nZXRNb2RlbE5hbWUoKVxyXG4gIGlmKCFnVGhpcy5fcmVwb3NpdG9yeU1hcHBpbmcuaGFzKG1vZGVsTmFtZSkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyByZXBvc2l0b3J5IGZvdW5kIGZvciAke21vZGVsTmFtZX1gKTtcclxuICB9XHJcbiAgY29uc3QgcmVwb3NpdG9yeSA9IGdUaGlzLl9yZXBvc2l0b3J5TWFwcGluZy5nZXQobW9kZWxOYW1lKSBhcyBSXHJcbiAgcmV0dXJuIHJlcG9zaXRvcnlcclxufSJdfQ==