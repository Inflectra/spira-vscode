import { Command, ExtensionContext, window } from 'vscode';
import { SpiraArtifactProvider } from './spiraartifactprovider';
import { Project } from './artifact';
import { SpiraConstants } from './constants';
import * as request from 'request';

export class NewTaskCommand implements Command {
    title = "Spira - Create New Task";
    command = "spira.newTask";
    constructor(public context: ExtensionContext, public spiraProvider: SpiraArtifactProvider) {

    }

    public async run(name: string): Promise<void> {
        let projects: Project[], projectNames: string[], userId: number;

        //get projects array from the provider
        projects = this.spiraProvider.projects;
        userId = this.spiraProvider.userId;
        if (projects.length === 0) {
            projects = await this.spiraProvider.populateProjects();
            projectNames = this.getProjectNames(projects);
        }
        else {
            projectNames = this.getProjectNames(projects);
        }
        if (userId === -1) {
            userId = await this.spiraProvider.populateUserId();
        }

        const taskName: string = await window.showInputBox({
            ignoreFocusOut: true,
            placeHolder: "Develop new book entry screen",
            value: name,
            prompt: "Enter name of task above"
        });

        const project: string = await window.showQuickPick(projectNames, {
            ignoreFocusOut: true,
            placeHolder: "Select a project to create the task in"
        });

        let projectId: number = this.getProjectId(projects, project);
        //default task type and status
        let taskStatus = 1, taskType = 1;
        let body = {
            "Name": taskName,
            "OwnerId": userId,
            "TaskStatusId": taskStatus,
            "TaskTypeId": taskType
        };
        let requestUrl: string = `${this.spiraProvider.getUrl()}${SpiraConstants.restServiceUrl}projects/${projectId}/tasks?username=${this.spiraProvider.getUsername()}&api-key=${this.spiraProvider.getToken()}`;
        request.post(requestUrl, { method: "POST", json: true, body: body, headers: { "Content-Type": "application/json", accept: "application/json" } }, (error, response, body) => {
            if (body.Name === taskName && taskName) {
                window.showInformationMessage("New task posted successfully!");
                this.spiraProvider.refresh();
            }
            else {
                window.showErrorMessage("New Task failed to beam up :(");
            }
        });

    }

    /**
     * Returns the project ID of the given project name
     */
    private getProjectId(projects: Project[], projectName: string): number {
        let out = -1;
        projects.forEach(e => {
            if (e.getProjectName() === projectName) {
                out = e.getProjectId();
                return;
            }
        });

        //should never happen
        if (out === -1) {
            console.log("ERROR!!!");
            window.showErrorMessage("Please select a project when creating a new task");
        }
        return out;
    }

    /**
     * Returns an array with the names of the given projects
     */
    private getProjectNames(projects: Project[]): string[] {
        let out: string[] = [];
        projects.forEach(e => {
            out.push(e.getProjectName());
        });
        return out;
    }


    /**
     * 
     * @param taskName Name of the new task
     * @param projectId Project ID of the task to be created
     * @returns true if successful, false otherwise
     */
    private postTask(taskName: string, projectId: number): boolean {

        return false;
    }

}