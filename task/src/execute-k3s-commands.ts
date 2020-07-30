/*
Note: When updating this file make sure to update the version number in task.json 
      if you do not do this ADO will not grab the new code for your task!
*/
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

import * as taskLibrary from "azure-pipelines-task-lib/task";
import * as toolRunner from "azure-pipelines-task-lib/toolrunner";

export class K3sCITask {

    workingDirectory: string;

    fileExtensions = {cmd: '.cmd', pwsh: '.ps1', powershell: '.ps1'};

    builtInShells = {
        bash: 'bash --noprofile --norc -eo pipefail {0}', 
        pwsh: 'pwsh -command "& \'{0}\'"',
        python: 'python {0}',
        sh: 'sh -e {0}',
        cmd: '%ComSpec% /D /E:ON /V:OFF /S /C "CALL "{0}""',
        powershell: 'powershell -command "& \'{0}\'"',
        };

    linuxCommand = `echo "Downloading latest kubeci script..."
        curl -sfL https://github.com/KnicKnic/temp-kubernetes-ci/releases/download/v1.0.0/linux.sh" | sh -s `;

    linuxShell = 'bash';

    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
        });
    }

    // add format because that seems to be how github does formatting
    format = function () {
        var a = this;
        for (var k in arguments) {
            a = a.replace(new RegExp("\\{" + k + "\\}", 'g'), arguments[k]);
        }
        return a
    }

     async run() {
        // Main logic that runs on task execution
        try {
            
            this.defineWorkingDirectory();

            let command =  '';
        let unformattedShell = '';

        let file = path.join(this.workingDirectory, this.uuidv4())

        // https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#using-a-specific-shell

        let platform = os.platform()
        // if(platform == 'darwin'){
        //     command = core.getInput('macos')
        //     unformattedShell = core.getInput('macosShell')
        // }

        if(platform == 'linux'){
            command = this.linuxCommand
            unformattedShell = this.linuxShell
        } else{
            taskLibrary.setResult(taskLibrary.TaskResult.Failed, "Unsupported os " + platform);
        }     
        // else if (platform == 'win32'){
        //     command = core.getInput('windows');
        //     unformattedShell = core.getInput('windowsShell')
        // }    

        let fileExtension = this.fileExtensions[unformattedShell] || ''
        file = file+fileExtension
        fs.writeFileSync(file, command)

        //let shell = this.builtInShells[unformattedShell] || unformattedShell
        //let formattedShell = shell.format(file)
        // const error_code = await exec.exec(formattedShell);

        console.log(`About to run command ${command}`)

        const k3scommands = taskLibrary.getInput("k3scommands", true);

        let shellPath = taskLibrary.which(unformattedShell, true)
        let shell = taskLibrary.tool(shellPath);

        shell.arg(file);
        
        let options = <toolRunner.IExecOptions>{
            cwd: this.workingDirectory,
            failOnStdErr: false,
            errStream: process.stdout, // Direct all output to STDOUT, otherwise the output may appear out
            outStream: process.stdout, // of order since Node buffers it's own STDOUT but not STDERR.
            ignoreReturnCode: true
        };

        let exitCode: number = await shell.exec(options);

        if(exitCode != 0){
            taskLibrary.setResult(taskLibrary.TaskResult.Failed, `Exit code: ${exitCode}`);
        }
        else {
            taskLibrary.setResult(taskLibrary.TaskResult.Succeeded, null, true);
        }

        } catch (err) {
            taskLibrary.setResult(taskLibrary.TaskResult.Failed, err.message);
        }
    }

    private defineWorkingDirectory() {
        // Find the working directory where JSON and html reports will be written to
        // This data will later be added to attachments so location is not super important
        const sourceDirectory =
            taskLibrary.getVariable("build.sourceDirectory") || taskLibrary.getVariable("build.sourcesDirectory");
        this.workingDirectory = taskLibrary.getInput("cwd", false) || sourceDirectory;
        if (!this.workingDirectory) {
            throw new Error("Working directory is not defined");
        }
    }

}

new K3sCITask().run();
