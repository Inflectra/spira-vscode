import * as vscode from 'vscode';
import * as request from 'request';
import { Artifact, ArtifactType, Project } from './artifact';
import { SpiraConstants } from './constants';

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
    /**
     * Has which requests have failed
     */
    failed = {
        requirements: false,
        incidents: false,
        tasks: false
    };

    /**
     * Projects accessible to the user
     */
    projects: Project[] = [];

    /**
     * User ID of the authenticated user
     */
    userId: number = -1;

    constructor(public context: vscode.ExtensionContext, public runTimer: { run: boolean }) {
        this.populateArtifacts();
        this.populateProjects().then(e => {
            this.projects = e;
        });
        this.populateUserId();
    }

    /**
     * Get the URL entered by the user
     */
    getUrl(): string {
        return this.context.globalState.get("spira-url");
    }

    /**
     * Get the username entered by the user
     */
    getUsername(): string {
        return this.context.globalState.get("spira-username");
    }

    /**
     * Get the RSS Token (api-key) entered by the user
     */
    getToken(): string {
        return this.context.globalState.get("spira-token");
    }

    //returns true if showing artifact, false otherwise from settings
    showIncidents(): boolean {
        return vscode.workspace.getConfiguration().get<boolean>("spira.settings.showIncidents");
    }

    showRequirements(): boolean {
        return vscode.workspace.getConfiguration().get<boolean>("spira.settings.showRequirements");
    }

    showTasks(): boolean {
        return vscode.workspace.getConfiguration().get<boolean>("spira.settings.showTasks");
    }

    /**
     * Makes a call to Spira and retrieves the requirements, tasks, 
     * and incidents assigned to the user
     */
    populateArtifacts(): void {
        //set to true when its respective request is completed
        let fulfilled = {
            requirements: false,
            incidents: false,
            tasks: false
        };
        this.populateAssignedRequirements(fulfilled);
        this.populateAssignedIncidents(fulfilled);
        this.populateAssignedTasks(fulfilled);
    }

    /**
     * Populates all of the user available projects into the projects array
     */
    populateProjects(): Thenable<Project[]> {
        let projects: Project[] = [];
        let url: string = `${this.getUrl()}${SpiraConstants.restServiceUrl}projects?username=${this.getUsername()}&api-key=${this.getToken()}`;
        //perform the GET request
        return new Promise<Project[]>(resolve => {
            request(url, { json: true }, (error, response, body) => {
                //if bad things happened...
                if (!body || response.statusCode >= 400) {
                    return;
                }
                //for each project
                body.forEach(e => {
                    let name: string = e.Name, id: number = e.ProjectId;
                    projects.push(new Project(name, id));
                });
                resolve(projects);
            });
        });


    }

    /**
     * Populate the user ID of the user
     */
    populateUserId(): Thenable<number> {
        let url: string = `${this.getUrl()}${SpiraConstants.restServiceUrl}users?username=${this.getUsername()}&api-key=${this.getToken()}`;
        return new Promise<number>(resolve => {
            //perform the GET request
            request(url, { json: true }, (error, response, body) => {
                //if bad things happened...
                if (!body || response.statusCode >= 400) {
                    return;
                }
                this.userId = body.UserId;
                resolve(this.userId);
            });
        });

    }

    /**
     * Called when any of the artifact calls fails
     */
    error(): void {
        this.tasks = [];
        this.requirements = [];
        this.incidents = [];
        this.headers = [];

        this.eventEmitter.fire();
        //if all three have failed
        if (this.failed.requirements && this.failed.tasks && this.failed.incidents) {
            vscode.window.showErrorMessage("Please verify your credentials and try again. Check them by running 'spira.setupCredentials' in the command palette");
            this.failed.requirements = false;
            this.failed.tasks = false;
            this.failed.incidents = false;
            this.runTimer.run = false;
        }
    }

    /**
     * Populate all of the requirements assigned to the user with data from the server
     */
    populateAssignedRequirements(fulfilled: any): void {
        //only request if we show requirements
        if (this.showRequirements()) {

            //get the url the request will be sent to
            let url: string = `${this.getUrl()}${SpiraConstants.restServiceUrl}requirements?username=${this.getUsername()}&api-key=${this.getToken()}`;
            //perform the GET request
            request(url, { json: true }, (error, response, body) => {
                this.requirements = [];
                //if we got an error
                if (!body || response.statusCode >= 400) {
                    this.failed.requirements = true;
                    this.error();
                    return;
                }
                //for each assigned requirement
                body.forEach(element => {
                    //get the properties
                    let name = element.Name, id = element.RequirementId, projectId = element.ProjectId;
                    let projectName = element.ProjectName, description = element.Description, priorityName = element.ImportanceName;
                    let status = element.StatusName, type = element.RequirementTypeName;

                    //actually create the new requirement
                    let newRequirement: Artifact = new Artifact(name, ArtifactType.Requirement, projectId, projectName, id, description, priorityName, status, type, 0);
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
        else {
            this.requirements = [];
            //set requirements as done
            fulfilled.requirements = true;
            //if all requests are done, move on
            if (fulfilled.requirements && fulfilled.tasks && fulfilled.incidents) {
                this.populateHeaders();
                //update the onDidChangeTreeData event
                this.eventEmitter.fire();
            }
        }
    }

    /**
     * Populate all fo the incidents assigned to the user with data from the server
     */
    populateAssignedIncidents(fulfilled: any): void {
        //only request if we show incidents
        if (this.showIncidents()) {

            //get the url the request will be sent to
            let url: string = `${this.getUrl()}${SpiraConstants.restServiceUrl}incidents?username=${this.getUsername()}&api-key=${this.getToken()}`;
            //perform the GET request
            request(url, { json: true }, (error, response, body) => {
                this.incidents = [];
                //if we got an error
                if (!body || response.statusCode >= 400) {
                    this.failed.incidents = true;
                    this.error();
                    return;
                }
                //for each assigned incident...
                body.forEach(element => {
                    //get the properties
                    let name = element.Name, id = element.IncidentId, projectId = element.ProjectId;
                    let projectName = element.ProjectName, description = element.Description, priorityName = element.PriorityName;
                    let status = element.IncidentStatusName, type = element.IncidentTypeName;

                    //actually create the new incident
                    let newIncident: Artifact = new Artifact(name, ArtifactType.Incident, projectId, projectName, id, description, priorityName, status, type, 0);
                    this.incidents.push(newIncident);
                });
                //set incidents as done
                fulfilled.incidents = true;
                //if all requests are done, move on
                if (fulfilled.requirements && fulfilled.tasks && fulfilled.incidents) {
                    this.populateHeaders();
                    //update the onDidChangeTreeData event
                    this.eventEmitter.fire();
                }
            });
        }
        else {
            this.incidents = [];
            //set incidents as done
            fulfilled.incidents = true;
            //if all requests are done, move on
            if (fulfilled.requirements && fulfilled.tasks && fulfilled.incidents) {
                this.populateHeaders();
                //update the onDidChangeTreeData event
                this.eventEmitter.fire();
            }
        }
    }

    /**
     * Populate all of the tasks assigned to the user with data from the server
     */
    populateAssignedTasks(fulfilled: any): void {
        //Only request if we show tasks
        if (this.showTasks()) {
            //get the url the request will be sent to
            let url: string = `${this.getUrl()}${SpiraConstants.restServiceUrl}tasks?username=${this.getUsername()}&api-key=${this.getToken()}`;
            //perform the GET request
            request(url, { json: true }, (error, response, body) => {
                this.tasks = [];
                //if we got an error
                if (!body || response.statusCode >= 400) {
                    this.failed.tasks = true;
                    this.error();
                    return;
                }
                //for each assigned task
                body.forEach(element => {
                    //get the properties
                    let name = element.Name, id = element.TaskId, projectId = element.ProjectId;
                    let projectName = element.ProjectName, description = element.Description, priorityName = element.TaskPriorityName;
                    let status = element.TaskStatusName, type = element.TaskTypeName;

                    //actually create the new task
                    let newTask: Artifact = new Artifact(name, ArtifactType.Task, projectId, projectName, id, description, priorityName, status, type, 0);
                    this.tasks.push(newTask);
                });
                //set tasks as done
                fulfilled.tasks = true;
                //if all requests are done, move on
                if (fulfilled.requirements && fulfilled.tasks && fulfilled.incidents) {
                    this.populateHeaders();
                    //update the onDidChangeTreeData event
                    this.eventEmitter.fire();
                }
            });
        }
        else {
            this.tasks = [];
            //set tasks as done
            fulfilled.tasks = true;
            //if all requests are done, move on
            if (fulfilled.requirements && fulfilled.tasks && fulfilled.incidents) {
                this.populateHeaders();
                //update the onDidChangeTreeData event
                this.eventEmitter.fire();
            }
        }
    }


    /**
     * Adds a header for the artifact type if there is at least one assigned
     */
    populateHeaders() {
        this.headers = [];
        if (this.showRequirements()) {
            this.headers.push(new Artifact(`REQUIREMENTS (${this.requirements.length})`, ArtifactType.Requirement, 0, "", 0, "", "", "", "header", this.requirements.length === 0 ? 0 : 1));
        }
        if (this.showTasks()) {
            this.headers.push(new Artifact(`TASKS (${this.tasks.length})`, ArtifactType.Task, 0, "", 0, "", "", "", "header", this.tasks.length === 0 ? 0 : 1));
        }
        if (this.showIncidents()) {
            this.headers.push(new Artifact(`INCIDENTS (${this.incidents.length})`, ArtifactType.Incident, 0, "", 0, "", "", "", "header", this.incidents.length === 0 ? 0 : 1));
        }

        vscode.window.showInformationMessage("Successfully Retrieved Data from Spira");

    }

    /**
     * VS Code API method implemented from TreeDataProvider that returns the parent-child relationship between artifacts. 
     * VS Code passes in 
     * @param element 
     */
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
