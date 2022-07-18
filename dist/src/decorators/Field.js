"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Field = void 0;
function Field(options = null) {
    return (target, propertyKey) => {
        if (!target.hasOwnProperty('fields')) {
            let fields = {};
            fields[propertyKey] = options !== null && options !== void 0 ? options : {};
            Object.defineProperty(target, 'fields', { value: fields });
        }
        else
            target.fields[propertyKey] = options !== null && options !== void 0 ? options : {};
    };
}
exports.Field = Field;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmllbGQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZGVjb3JhdG9ycy9GaWVsZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFLQSxTQUFnQixLQUFLLENBQUMsVUFBdUIsSUFBSTtJQUMvQyxPQUFRLENBQUMsTUFBYyxFQUFFLFdBQTRCLEVBQVEsRUFBRTtRQUM3RCxJQUFHLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsRUFBQztZQUNsQyxJQUFJLE1BQU0sR0FBUSxFQUFFLENBQUE7WUFDcEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLE9BQU8sYUFBUCxPQUFPLGNBQVAsT0FBTyxHQUFJLEVBQUUsQ0FBQTtZQUNuQyxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQTtTQUMzRDs7WUFDRSxNQUEwQixDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxPQUFPLGFBQVAsT0FBTyxjQUFQLE9BQU8sR0FBSSxFQUFFLENBQUE7SUFDbkUsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQVRELHNCQVNDIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbmltcG9ydCB7IEZpZWxkQ29uZmlnIH0gZnJvbSBcIn4vdHlwZXMvY29uZmlncy9GaWVsZENvbmZpZ1wiO1xyXG5pbXBvcnQgeyBQcm9wZXJ0eURlY29yYXRvckZ1bmN0aW9uIH0gZnJvbSBcIn4vdHlwZXMvZnVuY3Rpb25zL1Byb3BlcnR5RGVjb3JhdG9yRnVuY3Rpb25cIjtcclxuaW1wb3J0IHsgQ2xhc3NXaXRoRmllbGRzIH0gZnJvbSBcIn4vdHlwZXMvaW50ZXJuYWwvQ2xhc3NXaXRoRmllbGRzXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gRmllbGQob3B0aW9uczogRmllbGRDb25maWcgPSBudWxsKTogUHJvcGVydHlEZWNvcmF0b3JGdW5jdGlvbiB7XHJcbiAgcmV0dXJuICAodGFyZ2V0OiBPYmplY3QsIHByb3BlcnR5S2V5OiBzdHJpbmcgfCBzeW1ib2wpOiB2b2lkID0+IHtcclxuICAgIGlmKCF0YXJnZXQuaGFzT3duUHJvcGVydHkoJ2ZpZWxkcycpKXtcclxuICAgICAgbGV0IGZpZWxkczogYW55ID0ge31cclxuICAgICAgZmllbGRzW3Byb3BlcnR5S2V5XSA9IG9wdGlvbnMgPz8ge31cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgJ2ZpZWxkcycsIHsgdmFsdWU6IGZpZWxkcyB9KVxyXG4gICAgfSBlbHNlIFxyXG4gICAgICAodGFyZ2V0IGFzIENsYXNzV2l0aEZpZWxkcykuZmllbGRzW3Byb3BlcnR5S2V5XSA9IG9wdGlvbnMgPz8ge31cclxuICB9O1xyXG59XHJcbiJdfQ==