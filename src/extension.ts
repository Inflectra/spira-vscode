'use strict';
import * as vscode from 'vscode';
import { SpiraArtifactProvider } from './spiraartifactprovider';
import { Artifact, ArtifactToken, ArtifactType } from './artifact';
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
    const setupCredentialsCommand = new SetupCredentialsCommand(context);
    const uri: vscode.Uri = vscode.Uri.parse(SpiraConstants.URI);
    const newTaskCommand = new NewTaskCommand(context, spiraProvider);
    const scheme = 'spira';

    let chosenArtifact: Artifact;

    let refresh = vscode.commands.registerCommand('spira.refresh', (automatic: boolean) => {
        runTimer.run = true;
        if (!timer) {
            refreshCallback();
        }
        //refresh the Spira window
        spiraProvider.refresh(!automatic);
    });


    const contentProvider = new class implements vscode.TextDocumentContentProvider {
        // emitter and its event
        onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
        onDidChange = this.onDidChangeEmitter.event;

        provideTextDocumentContent(uri: vscode.Uri): string {
            // find the correct artifact
            // first split the uri we got into token and id
            const artifactToken = uri.path.split(":")[0];
            const artifactId = uri.path.split(":")[1];
            // now get the right array of items
            var artifactList;
            switch (artifactToken) {
                case ArtifactToken.Incident:
                    artifactList = spiraProvider.incidents;
                    break;
                case ArtifactToken.Requirement:
                    artifactList = spiraProvider.requirements;
                    break;
                case ArtifactToken.Task:
                    artifactList = spiraProvider.tasks;
                    break;
            }
            // find an item match
            const artifact = artifactList.filter(x => x.artifactId == artifactId)[0];

            // spit out a plain text string with a url at the top that can be clicked on
            const artifactString = `URL:       ${SpiraConstants.getArtifactUrl(artifact, context)}\n
ID:        [${SpiraConstants.getArtifactToken(artifact.artifactType)}:${artifact.artifactId}]
Name:      ${artifact.name}
${artifact.projectName ? "Product:   " + artifact.projectName + "\n" : ""}${artifact.type ? "Type:      " + artifact.type + "\n" : ""}${artifact.status ? "Status:    " + artifact.status + "\n" : ""}${artifact.priority ? "Priority:  " + artifact.priority + "\n" : ""}
${artifact.description ? "Description\n===========\n" + artifact.description.replace(/<[^>]*>/g, '') : ""}`;

            return artifactString;
        }
    }
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(scheme, contentProvider));

    // register a command that opens an artifact document
    context.subscriptions.push(vscode.commands.registerCommand('spira.info', async (artifact: Artifact) => {
        let artifactToken = `${ArtifactToken[artifact.artifactType]}:${artifact.artifactId}`
        let uri = vscode.Uri.parse('spira:' + artifactToken);
        uri.toJSON
        let doc = await vscode.workspace.openTextDocument(uri); // calls back into the provider
        await vscode.window.showTextDocument(doc, { preview: false });
    }));


    context.subscriptions.push(vscode.commands.registerCommand('spira.setupCredentials', () => {
        setupCredentialsCommand.run();
    }));


    context.subscriptions.push(vscode.commands.registerCommand('spira.newTask', () => {
        //get the selected text
        let editor = vscode.window.activeTextEditor;
        let text = '';
        if (editor) {
            let selection: vscode.Selection = editor.selection;
            text = editor.document.getText(selection);
        }
        //run with the selected text
        newTaskCommand.run(text);
    }));

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
    vscode.commands.executeCommand('spira.refresh', true);
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