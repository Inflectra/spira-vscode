import * as vscode from 'vscode';

export class SpiraArtifactProvider implements vscode.TreeDataProvider<Artifact> {

    /**
     * Manages the refresh event so we can update when neccessary
     */
    eventEmitter: vscode.EventEmitter<Artifact | undefined> = new vscode.EventEmitter<Artifact | undefined>();
    /*
     * An optional event to signal that an element or root has changed. This will trigger the view to update the changed 
     * element/root and its children recursively (if shown). To signal that root has changed, do not pass any argument or pass undefined or null.
     */
    onDidChangeTreeData: vscode.Event<Artifact | undefined> = this.eventEmitter.event;

    //arrays which hold the three artifact types
    requirements: Artifact[] = [];
    tasks: Artifact[] = [];
    incidents: Artifact[] = [];
    /**
     * Fake 'header' artifacts where artifacts of the same type are displayed under
     */
    headers: Artifact[] = [];

    constructor(context: vscode.ExtensionContext) {
        console.log('constructor!');
        this.populateArtifacts();
        this.populateHeaders();
    }

    /**
     * Makes a call to Spira and retrieves the requirements, tasks, 
     * and incidents assigned to the user
     */
    populateArtifacts(): void {
        //TODO: Make not temporary
        this.requirements.push(new Artifact("Add Spira Integration", ArtifactType.Requirement,
         -1, "LIS", 1, "des", "low", "In Progress", "Requirement"));
        this.tasks.push(new Artifact("Have lunch", ArtifactType.Task,
        -1, "LIS", 1, "des", "low", "In Progress", "Feature"));
        this.incidents.push(new Artifact("So Broken...", ArtifactType.Incident,
        -1, "LIS", 1, "des", "low", "In Progress", "Bug"));
    }

    /**
     * Adds a header for the artifact type if there is at least one assigned
     */
    populateHeaders() {
        this.headers = [];
        if(this.requirements.length > 0) {
            this.headers.push(new Artifact("REQUIREMENTS", ArtifactType.Requirement, 0, "", 0, "", "", "", ""));
        }
        if(this.tasks.length > 0) {
            this.headers.push(new Artifact("TASKS", ArtifactType.Task, 0, "", 0, "", "", "", ""));
        }
        if(this.incidents.length > 0) {
            this.headers.push(new Artifact("INCIDENTS", ArtifactType.Incident, 0, "", 0, "", "", "", ""));
        }
    }

    getChildren(element: Artifact): Thenable<Artifact[]> {
        console.log('getChildren!');
        return new Promise(resolve => {
            //if it is the root
            if(!element) {
                resolve(this.headers);
            }
            //artifact only has children if it is a header
            else if(!element.artifactId) {
                resolve(this.getApropriateArray(element.artifactType));
            }
            else {
                resolve(undefined);
            }
        });
    }

    refresh() {
        console.log('refreshed');
        this.populateArtifacts();
        this.populateHeaders();
        //update the onDidChangeTreeData event
        this.eventEmitter.fire();
    }

    /**
     * Returns the apropriate artifact array from the given type
     * @param type The type of artifact
     */
    getApropriateArray(type: ArtifactType) {
        if(type === "RQ") {
            return this.requirements;
        }
        else if(type === "TK") {
            return this.tasks;
        }
        return this.incidents;
    }

    getTreeItem(element: Artifact): vscode.TreeItem {
        console.log('tree item!');
        return element;
    }
}

/**
 * An Artifact in Spira
 */
class Artifact extends vscode.TreeItem {
    /**
     * @param name Name of the artifact
     * @param artifactType Either RQ, IN, TK
     * @param projectId Project ID
     * @param projectName Name of the project
     * @param artifactId ID of the artifact
     * @param description Description of the artifact
     * @param priorityName Priority of the artifact
     * @param status Workflow status
     * @param type Type ex. change request, bug, feature
     */
    constructor(public name: string, public artifactType: ArtifactType, 
        public projectId: number, public projectName: string, public artifactId: number, public description: string, public priorityName: string, public status: string, public type: string) {
            //1 is a constant for collapsed - https://code.visualstudio.com/docs/extensionAPI/vscode-api#TreeItemCollapsibleState
            super(name, 1);
    }

    get tooltip(): string {
        return `${this.projectName} | ${this.artifactType}:${this.artifactId}`;
    }
}

enum ArtifactType {
    Requirement = "RQ",
    Incident = "IN",
    Task = "TK",
}
