import App from "../App";
import {terminal, Terminal} from "terminal-kit";

export default class Screen {
    app: App;

    constructor(app: App) {
        this.app = app;
        this.start();
    }

    term: Terminal = terminal;

    state: ScreenState = {
        tab: 0,
        tabs: [{
            type: "welcome",
            logs: ["^bWelcome!^:", "Keybinds:", "CTRL_C - exit", "CTRL_N - next tab", "CTRL_P - previous tab"]
        }]
    };

    start() {
        this.render();

        process.on("SIGINT", () => this.shutdown(false));
        this.term.on("key", (a: string, b: string[], c: { isCharacter: boolean; codepoint: number; code: number | Buffer; }) => this.key(a,b,c));
        this.term.grabInput(true);
    }

    key(name:string, matches: string[], data: {isCharacter:boolean,codepoint:number,code:number|Buffer}) {
        if(name == "CTRL_C") {
            this.shutdown(false);
        } else {
            this.logline(name + " " + matches + " " + JSON.stringify(data));
            this.render();
        }
    }

    shutdown(_forced:boolean) {
        this.term.clear();
        process.exit();
    }

    generateTabs():string {
        let tabs = " ";

        for(let i=0;i<this.state.tabs.length;i++) {
            let tab = this.state.tabs[i];
            let add = "";
            if(i !== this.state.tab) {
                if(i.toString().endsWithOne(["1","3","5","7","9"])) {
                    add += "^:^K"
                } else {
                    add += "^:"
                }
            } else {
                add += "^W^#^K"
            }
            if(tab.type === "welcome") {
                add += "Welcome";
            } else {
                add += tab.proc;
            }
            tabs += add + "^: ";
        }

        return tabs;
    }

    generateSep():string {
        let sep = "";

        for(let i=0;i<this.term.width;i++) {
            sep += "-";
        }

        return sep;
    }

    logline(...message: string[]) {
        this.logtabline(this.state.tab, ...message);
    }

    logtabline(tab: number, ...message: string[]) {
        this.state.tabs[tab].logs.push(message.join(" "));
    }

    log(...message: string[]) {
        this.logtab(this.state.tab, ...message);
    }

    logtab(tab: number, ...message: string[]) {
        let logs = this.state.tabs[tab].logs;
        let log = logs[logs.length-1];
        log += message.join(" ");
        this.state.tabs[tab].logs[logs.length-1] = log;
    }


    render(clear?: boolean) {
        if(clear) {
            this.term.clear();
        }

        let active = this.state.tabs[this.state.tab];
        this.term.windowTitle(("title" in active ? active.title : "Welcome") + " @ cltabbed");

        let lines:string[] = [];

        lines[0] = this.generateTabs();
        lines[1] = this.generateSep();

        let loglines:string[] = [];
        for(let i=0;i<(this.term.height-2);i++) {
            let i2 = (this.state.tabs[this.state.tab].logs.length - 1) - i;
            if(!!this.state.tabs[this.state.tab].logs[i2]) {
                loglines.push(this.state.tabs[this.state.tab].logs[i2]);
            } else {
                break;
            }
        }
        loglines.reverse();
        lines = [...lines,...loglines];

        if(lines.length < this.term.height) {
            let diff = this.term.height - lines.length;
            for(let i = 0;i<diff;i++) {
                lines.push("");
            }
        }

        this.term("\n" + lines.join("\n"));
    }
}

interface ScreenState {
    tab: number,
    tabs: ScreenTab[],
}

type ScreenTab = WelcomeTab | ProcessTab;

interface WelcomeTab {
    type: "welcome",
    logs: string[],
}

interface ProcessTab {
    type: "proc",
    title: string,
    proc: string,
    logs: string[]
}
