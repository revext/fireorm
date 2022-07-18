"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HasOne = void 0;
function HasOne(options) {
    return (target, propertyKey) => {
        if (!target.hasOwnProperty('relations')) {
            let relations = {};
            relations[propertyKey] = Object.assign(options, { type: 'hasOne' });
            Object.defineProperty(target, 'relations', { value: relations });
        }
        else
            target.relations[propertyKey] = Object.assign(options, { type: 'hasOne' });
    };
}
exports.HasOne = HasOne;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSGFzT25lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2RlY29yYXRvcnMvSGFzT25lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQU1BLFNBQWdCLE1BQU0sQ0FBa0IsT0FBNkI7SUFDbkUsT0FBUSxDQUFDLE1BQWMsRUFBRSxXQUE0QixFQUFRLEVBQUU7UUFDN0QsSUFBRyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLEVBQUM7WUFDckMsSUFBSSxTQUFTLEdBQVEsRUFBRSxDQUFBO1lBQ3ZCLFNBQVMsQ0FBQyxXQUFXLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFBO1lBQ25FLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFBO1NBQ2pFOztZQUNFLE1BQTZCLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQXFCLEVBQUUsQ0FBQyxDQUFBO0lBQ25ILENBQUMsQ0FBQztBQUNKLENBQUM7QUFURCx3QkFTQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBNb2RlbCBmcm9tIFwifi9tb2RlbHMvTW9kZWxcIjtcclxuaW1wb3J0IHsgUHJvcGVydHlEZWNvcmF0b3JGdW5jdGlvbiB9IGZyb20gXCJ+L3R5cGVzL2Z1bmN0aW9ucy9Qcm9wZXJ0eURlY29yYXRvckZ1bmN0aW9uXCI7XHJcbmltcG9ydCB7IEhhc09uZVJlbGF0aW9uQ29uZmlnIH0gZnJvbSBcIn4vdHlwZXMvY29uZmlncy9SZWxhdGlvbkNvbmZpZ1wiO1xyXG5pbXBvcnQgeyBDbGFzc1dpdGhSZWxhdGlvbnMsIFJlbGF0aW9ucyB9IGZyb20gXCJ+L3R5cGVzL2ludGVybmFsL0NsYXNzV2l0aFJlbGF0aW9uc1wiO1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBIYXNPbmU8SyBleHRlbmRzIE1vZGVsPihvcHRpb25zOiBIYXNPbmVSZWxhdGlvbkNvbmZpZyk6IFByb3BlcnR5RGVjb3JhdG9yRnVuY3Rpb24ge1xyXG4gIHJldHVybiAgKHRhcmdldDogT2JqZWN0LCBwcm9wZXJ0eUtleTogc3RyaW5nIHwgc3ltYm9sKTogdm9pZCA9PiB7XHJcbiAgICBpZighdGFyZ2V0Lmhhc093blByb3BlcnR5KCdyZWxhdGlvbnMnKSl7XHJcbiAgICAgIGxldCByZWxhdGlvbnM6IGFueSA9IHt9XHJcbiAgICAgIHJlbGF0aW9uc1twcm9wZXJ0eUtleV0gPSBPYmplY3QuYXNzaWduKG9wdGlvbnMsIHsgdHlwZTogJ2hhc09uZScgfSlcclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgJ3JlbGF0aW9ucycsIHsgdmFsdWU6IHJlbGF0aW9ucyB9KVxyXG4gICAgfSBlbHNlIFxyXG4gICAgICAodGFyZ2V0IGFzIENsYXNzV2l0aFJlbGF0aW9ucykucmVsYXRpb25zW3Byb3BlcnR5S2V5XSA9IE9iamVjdC5hc3NpZ24ob3B0aW9ucywgeyB0eXBlOiAnaGFzT25lJyBhcyBSZWxhdGlvbnMgfSlcclxuICB9O1xyXG59Il19