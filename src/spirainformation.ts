import * as vscode from 'vscode';
import { ArtifactInfo, ArtifactType, Artifact } from './artifact';

/**
 * View which shows information about the given artifact
 */
export class SpiraInformationProvider implements vscode.TreeDataProvider<ArtifactInfo> {
    /**
     * Artifact to display information about
     */
    artifact: Artifact;

    //begin property names
    /**
     * Sample: IN:1 - Cannot log into the application
     */
    name: string;
    /**
     * Sample: Feature, Bug, Incident, Enhancement, etc
     */
    type: string;
    /**
     * Sample: Library Information System, Sample Application One
     */
    project: string;
    /**
     * Sample: Assigned, In Progress, etc
     */
    status: string;
    /**
     * Sample: 1 - Critical, 2 - High, 4 - Low
     */
    priority: string;
    /**
     * Sample: When trying to log into the application with a valid username and password, the system throws a fatal exception
     */
    description: string;

    /**
     * Manages the refresh event so we can update when neccessary
     */
    eventEmitter: vscode.EventEmitter<ArtifactInfo | undefined> = new vscode.EventEmitter<ArtifactInfo | undefined>();
    /*
     * An optional event to signal that an element or root has changed. This will trigger the view to update the changed 
     * element/root and its children recursively (if shown). To signal that root has changed, do not pass any argument or pass undefined or null.
     */
    onDidChangeTreeData: vscode.Event<ArtifactInfo | undefined> = this.eventEmitter.event;


    constructor(context: vscode.ExtensionContext) {
        //update the fields then update the view
        this.initializeFields();
        this.eventEmitter.fire();
    }

    /**
     * Initialize the various variables to show information
     */
    initializeFields() {
        //if there is an artifact to show information about
        if (this.artifact) {
            //will always be a name, type, and project
            this.name = `${this.getShorthandArtifact(this.artifact.artifactType)}:${this.artifact.artifactId} - ${this.artifact.name}`;
            this.type = `Type: ${this.artifact.type}`;
            this.project = `Project: ${this.artifact.projectName}`;

            //only add the properties if they are specified
            if (this.artifact.status) {
                this.status = `Status: ${this.artifact.status}`;
            }
            if (this.artifact.priorityName) {
                this.priority = `Priority: ${this.artifact.priorityName}`;
            }
            if (this.artifact.description) {
                this.description = `Description: ${this.artifact.description}`;
            }
        }
        else {
            this.name = "Sorry, no information to show right now. Try clicking an assigned artifact!";
        }

    }

    /**
     * Returns all of the properties to show in a format VS Code can see
     */
    createChildrenArray(): ArtifactInfo[] {
        let out: ArtifactInfo[] = [];
        if (this.name) {
            out.push(new ArtifactInfo(this.name));
        }
        if (this.type) {
            out.push(new ArtifactInfo(this.type));
        }
        if (this.project) {
            out.push(new ArtifactInfo(this.project));
        }
        if (this.status) {
            out.push(new ArtifactInfo(this.status));
        }
        if (this.priority) {
            out.push(new ArtifactInfo(this.priority));
        }
        if (this.description) {
            out.push(new ArtifactInfo(this.description));
        }

        return out;

    }

    /**
     * Set the artifact to show information about and update the view
     */
    setArtifact(artifact: Artifact): void {
        this.artifact = artifact;
        this.initializeFields();
        this.eventEmitter.fire();
    }

    /**
     * Returns the shorthand of the artifact type, ex: IN for incident, TK for task, RQ for requirement
     * @param type Type of artifact
     */
    getShorthandArtifact(type: ArtifactType): string {
        switch (type) {
            case ArtifactType.Requirement: return "RQ";
            case ArtifactType.Incident: return "IN";
            case ArtifactType.Task: return "TK";
        }
    }

    getChildren(element: ArtifactInfo): Thenable<ArtifactInfo[]> {
        return new Promise(resolve => {
            //if it is the root
            if (!element) {
                resolve(this.createChildrenArray());
            }
            //otherwise, no children
            else {
                resolve(undefined);
            }
        });
    }

    getTreeItem(element: ArtifactInfo): vscode.TreeItem {
        return element;
    }
}