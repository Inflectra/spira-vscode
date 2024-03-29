# Devnotes
Some basic information about how this plugin is structured
## Registration
### `package.json`
`package.json` is where the basic commands, views, keyboard shortcuts, and settings are registered in VS Code. It is the fundamental starting point of *all* VS Code extensions. 
### `extension.ts`
`extension.ts` is what is first run when the extension is activated as specified with the `activationEvents` field in `package.json`. All of the functionality behind commands are registered here. 
___
## Viewing Artifacts
### `artifact.ts`
`artifact.ts` contains the 'model' objects such as Artifact and Project which are used throughout the plugin
### `spiraartifactprovider.ts`
`spiraartifactprovider.ts` is where data is retrieved from Spira, and displayed in the panel on the left.
___
## Creating Tasks
### `newtaskcommand.ts`
Called when the user calls for the creation of a new task, it facilitates the prompts for the name and project of the task. It also posts the new task to Spira. 

## How to Package and Publish
- follow the steps here: https://code.visualstudio.com/api/working-with-extensions/publishing-extension

Do not bother with any of the scripts in the package.json - these are there to be used by the tool referenced in the above link
