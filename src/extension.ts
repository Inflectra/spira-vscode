'use strict';
import * as vscode from 'vscode';
import { SpiraArtifactProvider } from './spiraartifactprovider';
import { Artifact } from './artifact';
import { SpiraHtmlProvider } from './htmlprovider';
import { SpiraConstants } from './constants';
import { SetupCredentialsCommand } from './setupcredentialscommand';
import { NewTaskCommand } from './newtaskcommand';

/**
 * Timer used to refresh the settings
 */
var timer: NodeJS.Timer;

/**
 * Becomes false when an error occurs
 */
var runTimer: { run: boolean } = {
    run: true
};

//called when extension is activated. See package.json for activation events
export function activate(context: vscode.ExtensionContext) {
    const spiraProvider = new SpiraArtifactProvider(context, runTimer);
    const spiraHtmlProvider = new SpiraHtmlProvider(context);
    const setupCredentialsCommand = new SetupCredentialsCommand(context);
    const uri: vscode.Uri = vscode.Uri.parse(SpiraConstants.URI);
    const newTaskCommand = new NewTaskCommand(context, spiraProvider);

    let refresh = vscode.commands.registerCommand('spira.refresh', () => {
        runTimer.run = true;
        if (!timer) {
            refreshCallback();
        }
        //refresh the Spira window
        spiraProvider.refresh();
    });
    let showInfo = vscode.commands.registerCommand('spira.info', (artifact: Artifact) => {
        //only look at the event if it is actually an artifact and not just a header
        if (artifact.type !== "header") {
            //tailor the document around the clicked artifact
            spiraHtmlProvider.setArtifact(artifact);
            //actually open the document in the second column
            vscode.commands.executeCommand('vscode.previewHtml', uri, vscode.ViewColumn.Two, `Spira - ${artifact.name}`).then(s => { });
            spiraHtmlProvider.update(uri);
        }
    });
    let setupCredentials = vscode.commands.registerCommand('spira.setupCredentials', () => {
        setupCredentialsCommand.run();
    });
    let newTask = vscode.commands.registerCommand('spira.newTask', () => {
        //get the selected text
        let editor = vscode.window.activeTextEditor;
        let text = '';
        if (editor) {
            let selection: vscode.Selection = editor.selection;
            text = editor.document.getText(selection);
        }
        //run with the selected text
        newTaskCommand.run(text);
    });

    vscode.workspace.registerTextDocumentContentProvider('Spira', spiraHtmlProvider);
    vscode.window.registerTreeDataProvider('spiraExtension', spiraProvider);
    //begin automatically refreshing
    setTimeout(refreshCallback, 5000);
}

function refreshCallback(): void {
    clearTimeout(timer);
    if (!runTimer.run) {
        return;
    }
    let time = getRefreshTime();
    //only refresh if user input a value above 0
    if (time > 0) {
        //minimum of 5 seconds to refresh
        if (time < 5000) {
            time = 5000;
        }
        timer = setTimeout(refreshCallback, time);
    }
    vscode.commands.executeCommand('spira.refresh');
}

/**
 * Gets the time in miliseconds to refresh artifacts from Spira
 */
function getRefreshTime(): number {
    return vscode.workspace.getConfiguration().get<number>("spira.settings.refreshTime") * 1000;
}

// this method is called when your extension is deactivated
export function deactivate() {
}