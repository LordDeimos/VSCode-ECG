// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as EventEmitter from 'events';

let emitter = new EventEmitter();

let delta:number = 0;
let count:number = 0;

setInterval(()=>{
	let editor = vscode.window.activeTextEditor;
	if(!editor) return;
	let currentDoc = editor.document;
	let diags = vscode.languages.getDiagnostics();
	let temp:number  =currentDoc.getText().length;
	for(let i:number = 0;i<diags.length;++i){
		for(let j:number = 0;j<diags[i][1].length;++j){
			if(vscode.DiagnosticSeverity[diags[i][1][j].severity]==="Error"){
				temp -= diags[i][1][j].range.end.character-diags[i][1][j].range.start.character;
			}
		}
	}
	delta = temp - count;
	count = temp;
	emitter.emit('ecg-change',delta);
},500);

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "helloworld-sample" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
