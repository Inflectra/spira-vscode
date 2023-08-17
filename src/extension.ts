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

	//object used to hold information(tasks, incidents, &requirements)
	interface Info{
		[key:string]: number | string;
	};
	
	//array holding project names
	var projectNames: string[] = [];

	//command to verify the user credentials: Verify Credentials)
	let verifyCred = vscode.commands.registerCommand('fork-spira-vscode.verifyCred', async () => {

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

		retrieveInfo('Incidents');

		//testing whether the user can be authenticated
		try{
			await superagent.get(`${url}/Services/v7_0/RestService.svc/projects?username=${username}&api-key=${token}`)
			vscode.window.showInformationMessage('Credentials Are Verified')
			verified = true;
		}
		catch{
			vscode.window.showInformationMessage('Please Show Up')
			//vscode.window.showErrorMessage('Credentials Cannot Be Verified, Please Try Again')
		}
	});


	//Command to let user add Tasks to their Spira account: (Add Task)
	let addTask = vscode.commands.registerCommand('fork-spira-vscode.addTask', async () => {

		//only works if the user is verified first
		if (verified){

			//prompting the user to enter task name to be created
			let taskName = await vscode.window.showInputBox({
				ignoreFocusOut: true,
				placeHolder: "Develop New System",
				prompt:'Enter Your Task Name:'
			});

			//getting project list to show in dropdown
			await retrieveProjects();

			//prompting the user to choose which project to add task in
			let chosenProject = await vscode.window.showQuickPick(projectNames, {
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
	async function retrieveProjects(){
		let tempProjects = await superagent.get(`${url}/services/v7_0/RestService.svc/projects?username=${username}&api-key=${token}`)
		.set('Content-Type','application/json').set('accept','application/json');
		for(let i = 0; i<tempProjects.body.length; i++){ //loops through all projects
			//adding fields to key value pairs and array (for dropdown menu when adding tasks)
			projectList[tempProjects.body[i].Name] = tempProjects.body[i].ProjectId;
			projectNames.push(tempProjects.body[i].Name);
		}
	}

	//helper function to retrieve information (tasks, incidents, & requirements) to be displayed
	async function retrieveInfo(infoType:string|undefined){
		//infoType should either be 'Task', 'Incident', or 'Requirement'
		let tempList: Info[] = [];
		let tempData = await superagent.get(`${url}/services/v7_0/RestService.svc/${infoType}s?username=${username}&api-key=${token}`)
		.set('Content-Type','application/json').set('accept','application/json');
		for(let i = 0; i<tempData.body.length;i++){
			let tempInfo: Info = {};
			tempInfo['ID'] = tempData.body[i][`${infoType}Id`];
			tempInfo['Name'] = tempData.body[i]['Name'];
			tempInfo['Product'] = tempData.body[i]['ProjectName'];
			tempInfo['Type'] = tempData.body[i][`${infoType}TypeName`];
			tempInfo['Status'] = tempData.body[i][`${infoType}StatusName`];
			tempInfo['Description'] = tempData.body[i]['Description'];
			tempInfo['URL'] = `${url}/${tempData.body[i]['ProjectId']}/${infoType}/${tempData.body[i][tempInfo['ID']]}.aspx`;

			tempList.push(tempInfo);
		}
		console.log(tempList);
	}
}

// This method is called when extension is deactivated
export function deactivate() {}
