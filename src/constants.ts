import { Artifact, ArtifactType } from './artifact';
import { Context } from 'vm';

export module SpiraConstants {
    export const URI: string = "Spira://authority/information";
    /**
    * The URL used to access REST services
    */
    export const restServiceUrl: string = "/services/v5_0/RestService.svc/";

    /**
     * Returns the token of the artifact type, ex: IN for incident, TK for task, RQ for requirement
     * @param type Type of artifact
     */
    export const getArtifactToken = (type: ArtifactType): string => {
        switch (type) {
            case ArtifactType.Requirement: return "RQ";
            case ArtifactType.Incident: return "IN";
            case ArtifactType.Task: return "TK";
        }
    }

    /**
     * Returns the url string of the artifact on the web
     */
    export const getArtifactUrl = (artifact: Artifact, context: any): string => {
        return `${context.globalState.get("spira-url")}/${artifact.projectId}/${artifact.artifactType}/${artifact.artifactId}.aspx`;
    }
}