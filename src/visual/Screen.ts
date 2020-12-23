import App from "../App";
import {terminal, Terminal} from "terminal-kit";
import {spawn} from "node-pty";

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
            logs: ["^BWelcome!^:", "^CKeybinds:^:", "^CCTRL_C^ - exit", "^CCTRL_N/CTRL_RIGHT^ - next tab", "^CCTRL_P/CTRL_LEFT^ - previous tab", "^CCTRL_A^ - new tab"]
        }]
    };
    processes: ProcessState[] = []

    start() {
        this.render();
        // console.log(JSON.stringify(process.env, null, 2));
        process.on("SIGINT", () => this.shutdown(false));
        this.term.on("key", (a: string, b: string[], c: { isCharacter: boolean; codepoint: number; code: number | Buffer; }) => this.key(a, b, c));
        this.term.on("resize", (w: number, h: number) => this.resize(w, h));
        this.term.grabInput(true);
    }

    key(name: string, _matches: string[], data: { isCharacter: boolean, codepoint: number, code: number | Buffer }) {
        if (name === "CTRL_C") {
            this.shutdown(false);
        } else if (name === "CTRL_N" || name === "CTRL_RIGHT") {
            if (!!this.state.tabs[this.state.tab + 1]) {
                this.state.tab += 1;
                this.render(true, false);
            }
        } else if (name === "CTRL_P" || name === "CTRL_LEFT") {
            if (!!this.state.tabs[this.state.tab - 1]) {
                this.state.tab -= 1;
                this.render(true, false);
            }
        } else if (name === "CTRL_A") {
            this.newTab();
        } else {
            let tab = this.state.tabs[this.state.tab];
            if ("proci" in tab) {
                let proc = this.processes[tab.proci];
                proc.keypress(name, data.codepoint, data.code);
                //this.render();
            }
        }
    }

    newTab() {
        let title = "", proc = "";
        if (process.platform === "win32") {
            title = "CMD";
            proc = "cmd.exe";
        }
        this.state.tabs.push({
            type: "proc",
            title: title,
            proc: proc,
            logs: ["^KStarting process..."],
            proci: this.processes.length,
        });
        let tab = this.state.tabs.length - 1;
        this.processes.push({
            command: proc,
            tab,
            keypress(_name, _codepoint, _code) {
                //p.write(String.fromCharCode(codepoint))
            }
        });
        let p = spawn(proc, [], {
            cwd: process.cwd(),
            cols: this.term.width,
            rows: this.term.height - 2, //@ts-ignore
            env: process.env,
            useConpty: true,
            encoding: "utf8",
            name: "cmd"
        });
        p.onData((c) => {
            this.logtab(tab, "^:" + c);
            this.render();
        })
        process.stdin.on("data", (d: Buffer) => {
            if(this.state.tab === tab) {
                p.write(d.toString("utf-8"));
                this.render();
            }
        });
        this.render(true, false);
    }

    resize(_width: number, _height: number) {
        this.render();
    }

    shutdown(_forced: boolean) {
        this.term.clear();
        process.exit();
    }

    generateTabs(): string {
        let tabs = " ";

        for (let i = 0; i < this.state.tabs.length; i++) {
            let tab = this.state.tabs[i];
            let add = "";
            if (i !== this.state.tab) {
                if (i.toString().endsWithOne(["1", "3", "5", "7", "9"])) {
                    add += "^:^K"
                } else {
                    add += "^:"
                }
            } else {
                add += "^W^#^K"
            }
            if (tab.type === "welcome") {
                add += "Welcome";
            } else {
                add += tab.proc;
            }
            tabs += add + "^: ";
        }

        return tabs;
    }

    generateSep(): string {
        let sep = "";

        for (let i = 0; i < this.term.width; i++) {
            sep += "-";
        }

        return sep;
    }

    logline(...message: string[]) {
        this.logtabline(this.state.tab, ...message);
    }

    logtabline(tab: number, ...message: string[]) {
        this.state.tabs[tab].logs.push(message.join(" "));
        if (this.state.tabs[tab].logs.length >= 49) {
            this.state.tabs[tab].logs.shift();
        }
    }

    log(...message: string[]) {
        this.logtab(this.state.tab, ...message);
    }

    logtab(tab: number, ...message: string[]) {
        let logs = this.state.tabs[tab].logs;
        let log = logs[logs.length - 1];
        log += message.join(" ");
        this.state.tabs[tab].logs[logs.length - 1] = log;
    }


    render(clear?: boolean, cursor?: boolean) {
        if (clear) {
            this.term.clear();
        }

        let active = this.state.tabs[this.state.tab];
        this.term.windowTitle(("title" in active ? active.title : "Welcome") + " @ cltabbed");

        let lines: string[] = [];

        lines[0] = this.generateTabs();
        lines[1] = this.generateSep();

        let compensate = 0;
        let loglines: string[] = [];
        for (let i = 0; i < (this.term.height - 2); i++) {
            let i2 = (this.state.tabs[this.state.tab].logs.length - 1) - i;
            if (!!this.state.tabs[this.state.tab].logs[i2]) {
                let clines: string[] = [];
                let line = this.state.tabs[this.state.tab].logs[i2];

                if (line.length > this.term.width) {
                    let amt = line.length / this.term.width;
                    for (let i = 0; i < amt; i++) {
                        clines.push(line.substr(i * this.term.width, (i + 1) * this.term.width));
                    }
                    compensate += amt - 1;
                } else {
                    clines.push(line);
                }

                clines.reverse();
                loglines.push(...clines);
            } else {
                break;
            }
        }
        loglines.reverse();
        lines = [...lines, ...loglines];

        this.term.hideCursor();
        if (cursor) {
            lines[lines.length - 1] += "^#^W ^:"
        }

        if (lines.length < this.term.height) {
            let diff = (this.term.height - lines.length) - compensate;
            for (let i = 0; i < diff; i++) {
                lines.push("");
            }
        }
        this.term("\n" + lines.join("\n"));
    }
}

interface ProcessState {
    command: string,
    tab: number,
    keypress: (name: string, codepoint: number, code: number | Buffer) => void
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
    logs: string[],
    proci: number,
}
