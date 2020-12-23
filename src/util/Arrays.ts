// @ts-ignore
interface Array {
    oneEndsWith(search: string): boolean;
    allEndsWith(search: string): boolean;
    oneIncludes(search: string): boolean;
    allIncludes(search: string): boolean;
}

Array.prototype.oneEndsWith = function(search:string) {
    for(let part of this) {
        if(typeof part === "string" && part.endsWith(search)) {
            return true;
        }
    }
    return false;
}

Array.prototype.allEndsWith = function(search:string) {
    for(let part of this) {
        if(typeof part === "string" && !part.endsWith(search)) {
            return false;
        }
    }
    return true;
}

Array.prototype.oneIncludes = function(search:string) {
    for(let part of this) {
        if(typeof part === "string" && part.includes(search)) {
            return true;
        }
    }
    return false;
}

Array.prototype.allIncludes = function(search:string) {
    for(let part of this) {
        if(typeof part === "string" && !part.includes(search)) {
            return false;
        }
    }
    return true;
}
