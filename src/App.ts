import "./util/Arrays";
import "./util/Strings"
import {sep} from "path";
import Screen from "./visual/Screen";

export default class App {
    static start() {
        let app = new App();
        app.start();
    }

    args: string[] = process.argv;
    screen: Screen;

    start() {
        this.processArgs();
        this.screen = new Screen(this);
    }

    processArgs() {
        if (!!this.args[0] && this.args[0].split(sep).oneIncludes("node")) {
            this.args.shift();
            if (!!this.args[0] && this.args[0].split(sep).oneIncludes("cltabbed")) {
                this.args.shift();
            }
        }
    }
}

App.start();
