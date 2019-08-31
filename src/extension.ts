// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as EventEmitter from 'events';
import * as gui from "./gui/index";

let emitter = new EventEmitter();

let delta = 0;
let count = 0;
let samples:Array<number> = [];

const interval:number = vscode.workspace.getConfiguration("code-ecg").get("updateInterval") || 500;
const maxsamples = Math.round(0.5*interval);

emitter.on('ecg-change',(charpsec)=>{
	gui.webView.webview.postMessage({
		type: "update",
		data: charpsec
	});
});

let getMetrics = ()=>{
	let editor = vscode.window.activeTextEditor;
	if(!editor) return;
	let currentDoc = editor.document;
	let diags = vscode.languages.getDiagnostics();
	let temp  =currentDoc.getText().length;
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
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Welcome to Code-ECG, get typing...');
	let openmonitor = vscode.commands.registerCommand('extension.openmonitor', () => {

		gui.setup(context);
		gui.webView.webview.postMessage({
			type: "interval",
			data: interval
		});

		setInterval(getMetrics,interval);

	});

	context.subscriptions.push(openmonitor);
}

// this method is called when your extension is deactivated
export function deactivate() {}
