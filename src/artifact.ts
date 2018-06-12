import { TreeItem, Command } from 'vscode';

/**
 * An Artifact in Spira
 */
export class Artifact extends TreeItem {
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
        this.command = new SpiraInfoCommand(this);
    }

    get tooltip(): string {
        //Tooltip if this is a header
        if (this.type === "header") {
            return `Click to expand/collapse ${this.artifactType + 's'}`;
        }
        //if artifact is anything else
        else {
            return `${this.projectName} | ${this.getShorthandArtifact(this.artifactType)}:${this.artifactId}`;
        }
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
}

export class SpiraInfoCommand implements Command {
    command: string = 'spira.info';
    title: string = 'Spira - Show Artifact Information';
    arguments: Artifact[] = [];

    constructor(artifact: Artifact) {
        this.arguments.push(artifact);
    }
}

/**
 * Way of displaying information about an artifact
 */
export class ArtifactInfo extends TreeItem {
    /**
     * 
     * @param label The text to show
     */
    constructor(public label: string) {
        super(label);
    }
}

export enum ArtifactType {
    Requirement = "Requirement",
    Incident = "Incident",
    Task = "Task"
}