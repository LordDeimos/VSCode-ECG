// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as EventEmitter from 'events';
import * as gui from "./gui/index";

let emitter = new EventEmitter();

let delta = 0;
let count = 0;
let samples:Array<number> = [];
let hasBeenAboveThreshold = false;

const DISPLAY_NOTIFICATION_THRESHOLD = .4;

const interval:number = vscode.workspace.getConfiguration("code-ecg").get("updateInterval") || 500;
const maxsamples = 20;

let theRealAverage = 0;

emitter.on('ecg-change',(charpsec)=>{
	gui.webView.webview.postMessage({
		type: "update",
		data: charpsec
	});
});

let getMetrics = (e:object)=>{
	let editor = vscode.window.activeTextEditor;
	if(!editor) return;
	let currentDoc = editor.document;
	let diags = vscode.languages.getDiagnostics();
	let temp = 0;
	for(let diag of diags){
		for(let message of diag){
			if(message instanceof Array){
				for(let problem of message){
					if(vscode.DiagnosticSeverity[problem.severity]==="Error"){
						temp--;
					}
				}
			}
		}
	}
	if(samples.length==maxsamples){
		samples.shift();
	}
	samples.push(delta);
	// let average = samples.reduce((prev,curr)=>{
	// 	return prev+curr;
	// })/samples.length;

	theRealAverage = (theRealAverage * maxsamples + delta) / (maxsamples + 1);

	if (theRealAverage > DISPLAY_NOTIFICATION_THRESHOLD) hasBeenAboveThreshold = true;
	if (theRealAverage < DISPLAY_NOTIFICATION_THRESHOLD && hasBeenAboveThreshold) {
		vscode.window.showErrorMessage("YOUR BAD QUITE YOU'RE JOB",
			"I will",
			"Fuck off",
			"Fuck off or help me!"
		).then((result)=>{
			if(result==='I will'){
				if(vscode.window.activeTextEditor){
					vscode.window.activeTextEditor.hide();
				}
			}
			else if(result==="Fuck off or help me!"){
				vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('http://stackoverflow.alduino.dev/questions'));
			}
		});
		hasBeenAboveThreshold = false;
	}
	let min = Math.max(theRealAverage+temp,0.01);
	emitter.emit('ecg-change',(min)/(interval/1000));
	delta = 0;
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Welcome to Code-ECG, get typing...');
	let openmonitor = vscode.commands.registerCommand('extension.openmonitor', () => {

		gui.setup(context);
		gui.webView.webview.postMessage({
			type: "interval",
			data: interval
		});
		vscode.workspace.onDidChangeTextDocument((args)=>{
			++delta;
		});
		setInterval(getMetrics,interval);
	});
	context.subscriptions.push(openmonitor);
}

// this method is called when your extension is deactivated
export function deactivate() {}
