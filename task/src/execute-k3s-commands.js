"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
Note: When updating this file make sure to update the version number in task.json
      if you do not do this ADO will not grab the new code for your task!
*/
const fs = require("fs");
const path = require("path");
const os = require("os");
const taskLibrary = require("azure-pipelines-task-lib/task");
class K3sCITask {
    constructor() {
        this.fileExtensions = { cmd: '.cmd', pwsh: '.ps1', powershell: '.ps1' };
        this.builtInShells = {
            bash: 'bash --noprofile --norc -eo pipefail {0}',
            pwsh: 'pwsh -command "& \'{0}\'"',
            python: 'python {0}',
            sh: 'sh -e {0}',
            cmd: '%ComSpec% /D /E:ON /V:OFF /S /C "CALL "{0}""',
            powershell: 'powershell -command "& \'{0}\'"',
        };
        this.linuxCommand = `echo "asfd"
        curl -sfL https://get.k3s.io | sh -s - --docker
        mkdir ~/.kube || echo "~/.kube already existed"
        sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
        sudo chmod 777 ~/.kube/config
        # systemctl status k3s
        # sleep 15
        cat ~/.kube/config
        kubectl get node`;
        this.linuxShell = 'bash';
        // add format because that seems to be how github does formatting
        this.format = function () {
            var a = this;
            for (var k in arguments) {
                a = a.replace(new RegExp("\\{" + k + "\\}", 'g'), arguments[k]);
            }
            return a;
        };
    }
    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            // Main logic that runs on task execution
            try {
                this.defineWorkingDirectory();
                let command = '';
                let unformattedShell = '';
                let file = path.join(this.workingDirectory, this.uuidv4());
                // https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#using-a-specific-shell
                let platform = os.platform();
                // if(platform == 'darwin'){
                //     command = core.getInput('macos')
                //     unformattedShell = core.getInput('macosShell')
                // }
                if (platform == 'linux') {
                    command = this.linuxCommand;
                    unformattedShell = this.linuxShell;
                }
                else {
                    taskLibrary.setResult(taskLibrary.TaskResult.Failed, "Unsupported os " + platform);
                }
                // else if (platform == 'win32'){
                //     command = core.getInput('windows');
                //     unformattedShell = core.getInput('windowsShell')
                // }    
                let fileExtension = this.fileExtensions[unformattedShell] || '';
                file = file + fileExtension;
                fs.writeFileSync(file, command);
                //let shell = this.builtInShells[unformattedShell] || unformattedShell
                //let formattedShell = shell.format(file)
                // const error_code = await exec.exec(formattedShell);
                console.log(`About to run command ${command}`);
                const k3scommands = taskLibrary.getInput("k3scommands", true);
                let bashPath = taskLibrary.which("bash", true);
                let bash = taskLibrary.tool(bashPath);
                bash.arg(file);
                let options = {
                    cwd: this.workingDirectory,
                    failOnStdErr: false,
                    errStream: process.stdout,
                    outStream: process.stdout,
                    ignoreReturnCode: true
                };
                let exitCode = yield bash.exec(options);
                if (exitCode != 0) {
                    taskLibrary.setResult(taskLibrary.TaskResult.Failed, `Exit code: ${exitCode}`);
                }
                else {
                    taskLibrary.setResult(taskLibrary.TaskResult.Succeeded, null, true);
                }
            }
            catch (err) {
                taskLibrary.setResult(taskLibrary.TaskResult.Failed, err.message);
            }
        });
    }
    defineWorkingDirectory() {
        // Find the working directory where JSON and html reports will be written to
        // This data will later be added to attachments so location is not super important
        const sourceDirectory = taskLibrary.getVariable("build.sourceDirectory") || taskLibrary.getVariable("build.sourcesDirectory");
        this.workingDirectory = taskLibrary.getInput("cwd", false) || sourceDirectory;
        if (!this.workingDirectory) {
            throw new Error("Working directory is not defined");
        }
    }
}
exports.K3sCITask = K3sCITask;
new K3sCITask().run();
