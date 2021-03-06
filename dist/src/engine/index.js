"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBatch = exports.runTransaction = exports.useEngine = exports.startOrm = void 0;
// type OrmMode = 'server' | 'client';
let gThis = globalThis;
gThis._engine = null;
function startOrm(engine) {
    gThis._engine = engine;
}
exports.startOrm = startOrm;
function useEngine() {
    return gThis._engine;
}
exports.useEngine = useEngine;
async function runTransaction(operations) {
    return await gThis._engine.runTransaction(operations);
}
exports.runTransaction = runTransaction;
async function runBatch(operations) {
    return await gThis._engine.runBatch(operations);
}
exports.runBatch = runBatch;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZW5naW5lL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUdBLHNDQUFzQztBQUN0QyxJQUFJLEtBQUssR0FBSSxVQUE0QixDQUFBO0FBRXpDLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFBO0FBRXBCLFNBQWdCLFFBQVEsQ0FBQyxNQUF1QjtJQUM5QyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQTtBQUN4QixDQUFDO0FBRkQsNEJBRUM7QUFFRCxTQUFnQixTQUFTO0lBQ3ZCLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQTtBQUN0QixDQUFDO0FBRkQsOEJBRUM7QUFFTSxLQUFLLFVBQVUsY0FBYyxDQUFDLFVBQThCO0lBQ2pFLE9BQU8sTUFBTSxLQUFLLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQTtBQUN2RCxDQUFDO0FBRkQsd0NBRUM7QUFFTSxLQUFLLFVBQVUsUUFBUSxDQUFDLFVBQThCO0lBQzNELE9BQU8sTUFBTSxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQTtBQUNqRCxDQUFDO0FBRkQsNEJBRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRW5naW5lSW50ZXJmYWNlIGZyb20gXCJ+L2VuZ2luZS9FbmdpbmVJbnRlcmZhY2VcIjtcclxuaW1wb3J0IHsgR2xvYmFsVGhpc09ybSB9IGZyb20gXCJ+L3R5cGVzL2ludGVybmFsL0dsb2JhbFRoaXNPcm1cIjtcclxuXHJcbi8vIHR5cGUgT3JtTW9kZSA9ICdzZXJ2ZXInIHwgJ2NsaWVudCc7XHJcbmxldCBnVGhpcyA9IChnbG9iYWxUaGlzIGFzIEdsb2JhbFRoaXNPcm0pXHJcblxyXG5nVGhpcy5fZW5naW5lID0gbnVsbFxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHN0YXJ0T3JtKGVuZ2luZTogRW5naW5lSW50ZXJmYWNlKSB7XHJcbiAgZ1RoaXMuX2VuZ2luZSA9IGVuZ2luZVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdXNlRW5naW5lKCk6IEVuZ2luZUludGVyZmFjZSB7XHJcbiAgcmV0dXJuIGdUaGlzLl9lbmdpbmVcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1blRyYW5zYWN0aW9uKG9wZXJhdGlvbnM6ICgpID0+IFByb21pc2U8YW55Pik6IFByb21pc2U8YW55PiB7XHJcbiAgcmV0dXJuIGF3YWl0IGdUaGlzLl9lbmdpbmUucnVuVHJhbnNhY3Rpb24ob3BlcmF0aW9ucylcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bkJhdGNoKG9wZXJhdGlvbnM6ICgpID0+IFByb21pc2U8YW55Pik6IFByb21pc2U8YW55PiB7XHJcbiAgcmV0dXJuIGF3YWl0IGdUaGlzLl9lbmdpbmUucnVuQmF0Y2gob3BlcmF0aW9ucylcclxufSJdfQ==