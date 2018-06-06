import * as vscode from 'vscode';
import * as request from 'request';

export class SpiraArtifactProvider implements vscode.TreeDataProvider<Artifact> {
    /**
     * The URL used to access REST services
     */
    restServiceUrl: string = "/services/v5_0/RestService.svc/";

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
        this.populateArtifacts();
    }

    /**
     * Get the URL entered by the user
     */
    getUrl(): string {
        return vscode.workspace.getConfiguration().get<string>("spira.credentials.url");
    }

    /**
     * Get the username entered by the user
     */
    getUsername(): string {
        return vscode.workspace.getConfiguration().get<string>("spira.credentials.username");
    }

    /**
     * Get the RSS Token (api-key) entered by the user
     */
    getToken(): string {
        return vscode.workspace.getConfiguration().get<string>("spira.credentials.rsstoken");
    }

    /**
     * Makes a call to Spira and retrieves the requirements, tasks, 
     * and incidents assigned to the user
     */
    populateArtifacts(): void {
        //set to true when its respective request is completed
        let fulfilled = {
            requirements: false,
            incidents: true,
            tasks: true
        };
        this.populateAssignedRequirements(fulfilled);
        //TODO: Make not temporary
        //this.requirements.push(new Artifact("Add Spira Integration", ArtifactType.Requirement,
        //    -1, "LIS", 1, "des", "low", "In Progress", "Requirement"));
        this.tasks.push(new Artifact("Have lunch", ArtifactType.Task,
            -1, "LIS", 1, "des", "low", "In Progress", "Feature"));
        this.incidents.push(new Artifact("So Broken...", ArtifactType.Incident,
            -1, "LIS", 1, "des", "low", "In Progress", "Bug"));
    }

    /**
     * Populate all of the requirements assigned to the user
     */
    populateAssignedRequirements(fulfilled: any): void {
        this.requirements = [];
        //get the url the request will be sent to
        let url: string = `${this.getUrl()}${this.restServiceUrl}requirements?username=${this.getUsername()}&api-key=${this.getToken()}`;
        //perform the GET request
        request(url, { json: true }, (error, response, body) => {
            //for each assigned requirement
            body.forEach(element => {
                let name = element.Name, id = element.RequirementId, projectId = element.ProjectId, projectName = element.ProjectName;
                let description = element.Description, priorityName = element.ImportanceName, status = element.StatusName, type = element.RequirementTypeName;
                console.log(name);

                //actually create the new requirement
                let newRequirement: Artifact = new Artifact(name, ArtifactType.Requirement, projectId, projectName, id, description, priorityName, status, type);
                this.requirements.push(newRequirement);
            });
            //set requirements as done
            fulfilled.requirements = true;
            //if all requests are done, move on
            if (fulfilled.requirements && fulfilled.tasks && fulfilled.incidents) {
                this.populateHeaders();
                //update the onDidChangeTreeData event
                this.eventEmitter.fire();
            }
        });
    }

    getAssignedIncidents(): Artifact[] {
        let out: Artifact[] = [];

        return out;
    }

    getAssignedTasks(): Artifact[] {
        let out: Artifact[] = [];

        return out;
    }

    /**
     * Adds a header for the artifact type if there is at least one assigned
     */
    populateHeaders() {
        this.headers = [];
        if (this.requirements.length > 0) {
            this.headers.push(new Artifact("REQUIREMENTS", ArtifactType.Requirement, 0, "", 0, "", "", "", "header"));
        }
        if (this.tasks.length > 0) {
            this.headers.push(new Artifact("TASKS", ArtifactType.Task, 0, "", 0, "", "", "", "header"));
        }
        if (this.incidents.length > 0) {
            this.headers.push(new Artifact("INCIDENTS", ArtifactType.Incident, 0, "", 0, "", "", "", "header"));
        }
    }

    getChildren(element: Artifact): Thenable<Artifact[]> {
        return new Promise(resolve => {
            //if it is the root
            if (!element) {
                resolve(this.headers);
            }
            //artifact only has children if it is a header
            else if (!element.artifactId) {
                resolve(this.getApropriateArray(element.artifactType));
            }
            else {
                resolve(undefined);
            }
        });
    }

    refresh() {
        this.populateArtifacts();
    }

    /**
     * Returns the apropriate artifact array from the given type
     * @param type The type of artifact
     */
    getApropriateArray(type: ArtifactType) {
        if (type === ArtifactType.Requirement) {
            return this.requirements;
        }
        else if (type === ArtifactType.Task) {
            return this.tasks;
        }
        return this.incidents;
    }

    getTreeItem(element: Artifact): vscode.TreeItem {
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
        super(name, type === "header" ? 1 : 0);
    }

    get tooltip(): string {
        //Tooltip if this is a header
        if (this.type === "header") {
            return `Click to expand/collapse ${this.artifactType + 's'}`;
        }
        //if artifact is anything else
        else {
            return `${this.projectName} | ${this.artifactType}:${this.artifactId}`;
        }
    }
}

enum ArtifactType {
    Requirement = "Requirement",
    Incident = "Incident",
    Task = "Task",
}
