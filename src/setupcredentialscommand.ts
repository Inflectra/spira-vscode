import * as vscode from 'vscode';

export class SetupCredentialsCommand implements vscode.Command {
    title = "Spira - Setup Credentials";
    command = "spira.setupCredentials";
    constructor(public context: vscode.ExtensionContext) {

    }

    public async run(): Promise<void> {
        const url = await vscode.window.showInputBox({
            ignoreFocusOut: true,
            placeHolder: "http://doctor/SpiraPlan",
            prompt: "Base URL for accessing Spira Please omit the last slash as shown above ex. https://example.com/examle/Spira",
            //prefill credentials if already input, with it selected
            value: this.context.globalState.get("spira-url")
        });
        const username = await vscode.window.showInputBox({
            ignoreFocusOut: true,
            placeHolder: "fredbloggs",
            prompt: "Please enter your Spira username",
            value: this.context.globalState.get("spira-username")
        });
        const token = await vscode.window.showInputBox({
            ignoreFocusOut: true,
            placeHolder: "{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}",
            prompt: "Marked 'RSS Token' in your profile, RSS Feeds must be enabled for this to work",
            value: this.context.globalState.get("spira-token")
        });

        await this.context.globalState.update("spira-url", url);
        await this.context.globalState.update("spira-username", username);
        await this.context.globalState.update("spira-token", token);
        vscode.commands.executeCommand('spira.refresh');
    }
}