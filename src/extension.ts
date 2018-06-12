'use strict';
import * as vscode from 'vscode';
import { SpiraArtifactProvider } from './spiraartifact';
import { SpiraInformationProvider } from './spirainformation';
import { Artifact } from './artifact';

//called when extension is activated. See package.json for activation events
export function activate(context: vscode.ExtensionContext) {
    const spiraProvider = new SpiraArtifactProvider(context);
    const spiraInformation = new SpiraInformationProvider(context);
    let refresh = vscode.commands.registerCommand('spira.refresh', () => {
        //refresh the Spira window
        spiraProvider.refresh();
    });
    let showInfo = vscode.commands.registerCommand('spira.info', (artifact: Artifact) => {
        //only look at the event if it is actually an artifact and not just a header
        if (artifact.type !== "header") {
            spiraInformation.setArtifact(artifact);
        }

    });

    vscode.window.registerTreeDataProvider('spiraArtifacts', spiraProvider);
    vscode.window.registerTreeDataProvider('spiraInformation', spiraInformation);

}

// this method is called when your extension is deactivated
export function deactivate() {
}