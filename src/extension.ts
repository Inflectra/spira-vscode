// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';

// The module 'superagent' is used to make API calls to Spira Rest Web Service
import * as superagent from "superagent";

// This method is called when extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	//variable to store if the user has been verified
	var verified = false;

	//url, username, and API token are used to verify the user
	var url:string | undefined;
	var username:string | undefined;
	var token:string | undefined;

	//object holding the projects the user is permitted to see
	interface Projects {
		[key: string]: number;
	 };
	var projectList:Projects = {};
	
	//array holding project names
	var projectNames: string[] = [];

	//variable to hold the project user chooses when adding projects (may be deleted and moved to local scope)
	var chosenProject:string;

	//command to verify the user credentials: Verify Credentials)
	let verifyCred = vscode.commands.registerCommand('tempextdemo.verifyCred', async () => {

		//prompting the user to enter their url
		url = await vscode.window.showInputBox({
            ignoreFocusOut: true,
            placeHolder: "http://doctor/SpiraPlan",
            prompt: "Base URL for accessing Spira Please omit the last slash as shown above ex. https://example.com/example/Spira",
        });

		//prompting the user to enter their username
        username = await vscode.window.showInputBox({
            ignoreFocusOut: true,
            placeHolder: "fredbloggs",
            prompt: "Please enter your Spira username",
        });

		//prompting the user to enter their API token
        token = await vscode.window.showInputBox({
            ignoreFocusOut: true,
            placeHolder: "{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}",
            prompt: "Marked 'RSS Token' in your profile, RSS Feeds must be enabled for this to work",
        });

		//testing whether the user can be authenticated
		try{
			await superagent.get(`${url}/Services/v7_0/RestService.svc/projects?username=${username}&api-key=${token}`)
			vscode.window.showInformationMessage('Credentials Are Verified')
			verified = true;
		}
		catch{
			vscode.window.showErrorMessage('Credentials Cannot Be Verified, Please Try Again')
		}
	});


	//Command to let user add Tasks to their Spira account: (Add Task)
	let addTask = vscode.commands.registerCommand('tempextdemo.addTask', async () => {

		//only works if the user is verified first
		if (verified){

			//prompting the user to enter task name to be created
			let taskName = await vscode.window.showInputBox({
				ignoreFocusOut: true,
				placeHolder: "Develop New System",
				prompt:'Enter Your Task Name:'
			});

			//getting project list to show in dropdown
			await retrieveProjects(url,username,token);

			//prompting the user to choose which project to add task in
			chosenProject = await vscode.window.showQuickPick(projectNames, {
				ignoreFocusOut: true,
				placeHolder: "Select a project to create the task in"
			}) ?? "" //circumvents the type error warning

			//posts the task onto Spira
			try{
				await superagent.post(`${url}/Services/v7_0/RestService.svc/projects/${projectList[chosenProject]}/tasks?username=${username}&api-key=${token}`)
				.send({TaskId :null, TaskStatusId: 1, TaskTypeId: 1, Name: taskName}); //TaskId, TaskStatusId, and TaskTypeId are all defaults
				vscode.window.showInformationMessage('Task Added Successfully');
			}

			catch(error){
				vscode.window.showErrorMessage('An Error Occurred');
			}
		}

		else{
			vscode.window.showErrorMessage('Please Verify Your Credentials First');
		}
	});

	//adding commands so they are unloaded when extension is deactivated
	context.subscriptions.push(verifyCred);
	context.subscriptions.push(addTask);

	//helper function to retrieve lists of projects the user can see
	async function retrieveProjects(url:string | undefined,username:string | undefined,token:string | undefined){
		let tempProjects = await superagent.get(`${url}/services/v7_0/RestService.svc/projects?username=${username}&api-key=${token}`)
		.set('Content-Type','application/json').set('accept','application/json');
		for(let i = 0; i<tempProjects.body.length; i++){
			//adding fields to key value pairs and array (for dropdown menu when adding tasks)
			projectList[tempProjects.body[i].Name] = tempProjects.body[i].ProjectId;
			projectNames.push(tempProjects.body[i].Name);
		}
	}
}

// This method is called when extension is deactivated
export function deactivate() {}
