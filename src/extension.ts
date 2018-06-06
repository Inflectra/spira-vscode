'use strict';
import * as vscode from 'vscode';
import { SpiraArtifactProvider } from './spiraprovider';

//called when extension is activated. See package.json for activation events
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Extension is active!');



    const spiraProvider = new SpiraArtifactProvider(context);
    let refresh = vscode.commands.registerCommand('spira.refresh', () => {
        //refresh the Spira window
        spiraProvider.refresh();
    });

    context.subscriptions.push(refresh);
    vscode.window.registerTreeDataProvider('spiraArtifacts', spiraProvider);

}

// this method is called when your extension is deactivated
export function deactivate() {
}