"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HasMany = void 0;
function HasMany(options) {
    return (target, propertyKey) => {
        if (!target.hasOwnProperty('relations')) {
            let relations = {};
            relations[propertyKey] = Object.assign(options, { type: 'hasMany' });
            Object.defineProperty(target, 'relations', { value: relations });
        }
        else
            target.relations[propertyKey] = Object.assign(options, { type: 'hasMany' });
    };
}
exports.HasMany = HasMany;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSGFzTWFueS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kZWNvcmF0b3JzL0hhc01hbnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBS0EsU0FBZ0IsT0FBTyxDQUFtQyxPQUE4QjtJQUN0RixPQUFRLENBQUMsTUFBYyxFQUFFLFdBQTRCLEVBQVEsRUFBRTtRQUM3RCxJQUFHLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsRUFBQztZQUNyQyxJQUFJLFNBQVMsR0FBUSxFQUFFLENBQUE7WUFDdkIsU0FBUyxDQUFDLFdBQVcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUE7WUFDcEUsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUE7U0FDakU7O1lBQ0UsTUFBNkIsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBc0IsRUFBRSxDQUFDLENBQUE7SUFDcEgsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQVRELDBCQVNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IE1vZGVsIGZyb20gXCJ+L21vZGVscy9Nb2RlbFwiO1xyXG5pbXBvcnQgeyBQcm9wZXJ0eURlY29yYXRvckZ1bmN0aW9uIH0gZnJvbSBcIn4vdHlwZXMvZnVuY3Rpb25zL1Byb3BlcnR5RGVjb3JhdG9yRnVuY3Rpb25cIjtcclxuaW1wb3J0IHsgSGFzTWFueVJlbGF0aW9uQ29uZmlnIH0gZnJvbSBcIn4vdHlwZXMvY29uZmlncy9SZWxhdGlvbkNvbmZpZ1wiO1xyXG5pbXBvcnQgeyBDbGFzc1dpdGhSZWxhdGlvbnMsIFJlbGF0aW9ucyB9IGZyb20gXCJ+L3R5cGVzL2ludGVybmFsL0NsYXNzV2l0aFJlbGF0aW9uc1wiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIEhhc01hbnk8VCBleHRlbmRzIE1vZGVsLCBLIGV4dGVuZHMgTW9kZWw+KG9wdGlvbnM6IEhhc01hbnlSZWxhdGlvbkNvbmZpZyk6IFByb3BlcnR5RGVjb3JhdG9yRnVuY3Rpb24ge1xyXG4gIHJldHVybiAgKHRhcmdldDogT2JqZWN0LCBwcm9wZXJ0eUtleTogc3RyaW5nIHwgc3ltYm9sKTogdm9pZCA9PiB7XHJcbiAgICBpZighdGFyZ2V0Lmhhc093blByb3BlcnR5KCdyZWxhdGlvbnMnKSl7XHJcbiAgICAgIGxldCByZWxhdGlvbnM6IGFueSA9IHt9XHJcbiAgICAgIHJlbGF0aW9uc1twcm9wZXJ0eUtleV0gPSBPYmplY3QuYXNzaWduKG9wdGlvbnMsIHsgdHlwZTogJ2hhc01hbnknIH0pXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsICdyZWxhdGlvbnMnLCB7IHZhbHVlOiByZWxhdGlvbnMgfSlcclxuICAgIH0gZWxzZSBcclxuICAgICAgKHRhcmdldCBhcyBDbGFzc1dpdGhSZWxhdGlvbnMpLnJlbGF0aW9uc1twcm9wZXJ0eUtleV0gPSBPYmplY3QuYXNzaWduKG9wdGlvbnMsIHsgdHlwZTogJ2hhc01hbnknIGFzIFJlbGF0aW9ucyB9KVxyXG4gIH07XHJcbn0iXX0=