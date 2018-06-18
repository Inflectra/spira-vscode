'use strict';
import * as vscode from 'vscode';
import { SpiraArtifactProvider } from './spiraartifactprovider';
import { Artifact } from './artifact';
import { SpiraHtmlProvider } from './htmlprovider';
import { SpiraConstants } from './constants';

/**
 * Timer used to refresh the settings
 */
var timer: NodeJS.Timer;

//called when extension is activated. See package.json for activation events
export function activate(context: vscode.ExtensionContext) {
    const spiraProvider = new SpiraArtifactProvider(context);
    const spiraHtmlProvider = new SpiraHtmlProvider();
    const uri: vscode.Uri = vscode.Uri.parse(SpiraConstants.URI);

    let refresh = vscode.commands.registerCommand('spira.refresh', () => {
        refreshCallback();
        //refresh the Spira window
        spiraProvider.refresh();
    });
    let showInfo = vscode.commands.registerCommand('spira.info', (artifact: Artifact) => {
        //only look at the event if it is actually an artifact and not just a header
        if (artifact.type !== "header") {
            //tailor the document around the clicked artifact
            spiraHtmlProvider.setArtifact(artifact);
            vscode.commands.executeCommand('vscode.previewHtml', uri);
            spiraHtmlProvider.update(uri);
        }

    });

    vscode.workspace.registerTextDocumentContentProvider('Spira', spiraHtmlProvider);
    vscode.window.registerTreeDataProvider('spiraArtifacts', spiraProvider);
    //begin automatically refreshing
    setTimeout(refreshCallback, 5000);
}

function refreshCallback(): void {
    clearTimeout(timer);
    vscode.commands.executeCommand('spira.refresh');
    let time = getRefreshTime();
    //only refresh if user input a value above 0
    if (time > 0) {
        //minimum of 5 seconds to refresh
        if (time < 5000) {
            time = 5000;
        }
        timer = setTimeout(refreshCallback, time);
    }
    else {
        timer = undefined;
    }
}

/**
 * Gets the time in miliseconds to refresh artifacts from Spira
 */
function getRefreshTime(): number {
    return vscode.workspace.getConfiguration().get<number>("spira.settings.refreshtime") * 1000;
}

// this method is called when your extension is deactivated
export function deactivate() {
}