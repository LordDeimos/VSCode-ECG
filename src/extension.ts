// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as EventEmitter from 'events';
import * as gui from "./gui/index";

let emitter = new EventEmitter();

let delta = 0;
let count = 0;
let samples:Array<number> = [];

const interval = 500;
const maxsamples = 20;

setInterval(()=>{
	let editor = vscode.window.activeTextEditor;
	if(!editor) return;
	let currentDoc = editor.document;
	let diags = vscode.languages.getDiagnostics();
	let temp  =currentDoc.getText().length;
	//Need to determine what happens when there are multiple errors/warnings
	for(let diag of diags){
		for(let message of diag){
			if(message instanceof Array){
				for(let problem of message){
					if(vscode.DiagnosticSeverity[problem.severity]==="Error"){
						temp -= problem.range.end.character-problem.range.start.character;
					}
				}
			}
		}
	}
	delta = temp - count;
	count = temp;
	if(samples.length==maxsamples){
		samples.shift();
	}
	samples.push(delta);
	let average = samples.reduce((prev,curr,i,samples)=>{
		return prev+curr;
	})/samples.length;
	emitter.emit('ecg-change',average/(interval/1000));
},interval);

emitter.on('ecg-change',(charpsec)=>{
	console.log(Math.abs(charpsec));
});


export function activate(context: vscode.ExtensionContext) {
	console.log('Welcome to Code-ECG, get typing...');

	let openmonitor = vscode.commands.registerCommand('extension.openmonitor', () => {
		vscode.window.showInformationMessage('Hello World!');

		gui.setup(context);
		// let webView = vscode.window.createWebviewPanel("ecgGraph", "ECG Graph", vscode.ViewColumn.Beside, {});
		// webView.reveal();

	});

	context.subscriptions.push(openmonitor);
}

// this method is called when your extension is deactivated
export function deactivate() {}
