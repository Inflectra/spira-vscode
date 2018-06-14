import * as vscode from 'vscode';

export class SpiraHtmlProvider implements vscode.TextDocumentContentProvider {
    private _onDidChange: vscode.EventEmitter<vscode.Uri>;

    constructor() {
        this._onDidChange = new vscode.EventEmitter<vscode.Uri>();
    }

    provideTextDocumentContent(uri: vscode.Uri): Thenable<string> {
        return new Promise(resolve => {
            resolve("<p>Hello World!</p>");
        });
    }

    public update(uri: vscode.Uri) {
        this._onDidChange.fire(uri);
    }

    get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }
}