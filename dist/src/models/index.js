"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createModel = void 0;
function createModel(modelClass, params = []) {
    const model = new modelClass();
    model.init(...params);
    return model;
}
exports.createModel = createModel;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbW9kZWxzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLFNBQWdCLFdBQVcsQ0FBa0IsVUFBdUMsRUFBRSxTQUFnQixFQUFFO0lBQ3BHLE1BQU0sS0FBSyxHQUFHLElBQUksVUFBVSxFQUFFLENBQUE7SUFDOUIsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFBO0lBRXJCLE9BQU8sS0FBcUIsQ0FBQTtBQUNoQyxDQUFDO0FBTEQsa0NBS0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2RlbCB9IGZyb20gXCIuLlwiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU1vZGVsPFQgZXh0ZW5kcyBNb2RlbD4obW9kZWxDbGFzczogeyBuZXcgKC4uLmFyZ3M6IGFueVtdKTogVCB9LCBwYXJhbXM6IGFueVtdID0gW10pOiBUIHsgICAgXHJcbiAgICBjb25zdCBtb2RlbCA9IG5ldyBtb2RlbENsYXNzKClcclxuICAgIG1vZGVsLmluaXQoLi4ucGFyYW1zKVxyXG5cclxuICAgIHJldHVybiBtb2RlbCBhcyB1bmtub3duIGFzIFRcclxufSJdfQ==