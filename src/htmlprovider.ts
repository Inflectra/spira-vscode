import * as vscode from 'vscode';
import { Artifact, ArtifactType } from './artifact';

export class SpiraHtmlProvider implements vscode.TextDocumentContentProvider {
    private _onDidChange: vscode.EventEmitter<vscode.Uri>;
    private artifact: Artifact;

    constructor() {
        this._onDidChange = new vscode.EventEmitter<vscode.Uri>();
    }

    provideTextDocumentContent(uri: vscode.Uri): Thenable<string> {
        return new Promise(resolve => {
            resolve(this.generateHtml());
        });
    }

    /**
     * Actually generate the html about the given artifact
     */
    private generateHtml(): string {
        let out: string = `<html><style>th {padding-right: 20px; text-align: left;}</style><body><h1><a href="${this.getArtifactUrl()}">
        ${this.getShorthandArtifact(this.artifact.artifactType)}:${this.artifact.artifactId} - ${this.artifact.name}</h1></a><table>`;
        //only show information if it exists
        if (this.artifact.type) {
            out += `<tr><th>Type</th><td>${this.artifact.type}</td></tr>`;
        }
        if (this.artifact.projectName) {
            out += `<tr><th>Project</th><td>${this.artifact.projectName}</td></tr>`;
        }
        if (this.artifact.status) {
            out += `<tr><th>Status</th><td>${this.artifact.status}</td></tr>`;
        }
        if (this.artifact.priorityName) {
            out += `<tr><th>Priority</th><td>${this.artifact.priorityName}</td></tr>`;
        }
        if (this.artifact.description) {
            out += `<tr><th>Description</th><td>${this.artifact.description}</td></tr>`;
        }
        out += `</table></body></html>`;
        return out;
    }

    /**
     * Returns the url of the artifact on the web
     */
    private getArtifactUrl(): string {
        let url = `${vscode.workspace.getConfiguration().get<string>("spira.credentials.url")}/`;
        url += `${this.artifact.projectId}/${this.artifact.artifactType}/${this.artifact.artifactId}.aspx`;
        return url;
    }

    /**
    * Returns the shorthand of the artifact type, ex: IN for incident, TK for task, RQ for requirement
    * @param type Type of artifact
    */
    private getShorthandArtifact(type: ArtifactType): string {
        switch (type) {
            case ArtifactType.Requirement: return "RQ";
            case ArtifactType.Incident: return "IN";
            case ArtifactType.Task: return "TK";
        }
    }

    public update(uri: vscode.Uri) {
        this._onDidChange.fire(uri);
    }

    get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }

    /**
     * Tailors the document about the given artifact
     * @param artifact The artifact to display information about
     */
    setArtifact(artifact: Artifact): void {
        this.artifact = artifact;
    }
}