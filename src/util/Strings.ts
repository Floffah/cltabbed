interface String {
    endsWithOne(matches: string[]):boolean
}

String.prototype.endsWithOne = function(m) {
    for(let match of m) {
        if(this.endsWith(match)) {
            return true;
        }
    }
    return false;
}
