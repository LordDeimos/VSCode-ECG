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

const uselessWebsites = [
	["http://heeeeeeeey.com/"],
	["http://tinytuba.com/"],
	["http://corndog.io/"],
	["http://thatsthefinger.com/"],
	["http://cant-not-tweet-this.com/"],
	["http://weirdorconfusing.com/"],
	["https://www.eyes-only.net/"],
	["http://eelslap.com/"],
	["http://www.staggeringbeauty.com/"],
	["http://burymewithmymoney.com/"],
	["http://endless.horse/"],
	["http://www.trypap.com/"],
	["http://www.republiquedesmangues.fr/"],
	["http://www.movenowthinklater.com/"],
	["http://www.partridgegetslucky.com/"],
	["http://www.rrrgggbbb.com/"],
	["http://beesbeesbees.com/"],
	["http://www.koalastothemax.com/"],
	["http://www.everydayim.com/"],
	["http://randomcolour.com/"],
	["http://cat-bounce.com/"],
	["http://chrismckenzie.com/"],
	["http://hasthelargehadroncolliderdestroyedtheworldyet.com/"],
	["http://ninjaflex.com/"],
	["http://ihasabucket.com/"],
	["http://corndogoncorndog.com/"],
	["http://www.hackertyper.com/"],
	["https://pointerpointer.com"],
	["http://imaninja.com/"],
	["http://www.ismycomputeron.com/"],
	["http://www.nullingthevoid.com/"],
	["http://www.muchbetterthanthis.com/"],
	["http://www.yesnoif.com/"],
	["http://iamawesome.com/"],
	["http://www.pleaselike.com/"],
	["http://crouton.net/"],
	["http://corgiorgy.com/"],
	["http://www.wutdafuk.com/"],
	["http://unicodesnowmanforyou.com/"],
	["http://www.crossdivisions.com/"],
	["http://tencents.info/"],
	["http://www.patience-is-a-virtue.org/"],
	["http://whitetrash.nl/"],
	["http://www.theendofreason.com/"],
	["http://pixelsfighting.com/"],
	["http://isitwhite.com/"],
	["http://onemillionlols.com/"],
	["http://www.omfgdogs.com/"],
	["http://oct82.com/"],
	["http://chihuahuaspin.com/"],
	["http://www.blankwindows.com/"],
	["http://dogs.are.the.most.moe/"],
	["http://tunnelsnakes.com/"],
	["http://www.trashloop.com/"],
	["http://www.ascii-middle-finger.com/"],
	["http://spaceis.cool/"],
	["http://www.donothingfor2minutes.com/"],
	["http://buildshruggie.com/"],
	["http://buzzybuzz.biz/"],
	["http://yeahlemons.com/"],
	["http://burnie.com/"],
	["http://wowenwilsonquiz.com"],
	["https://thepigeon.org/"],
	["http://notdayoftheweek.com/"],
	["http://www.amialright.com/"],
	["http://nooooooooooooooo.com/"]
];

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
			"Got something better to do?",
			"Fucking help me!"
		).then((result)=>{
			if(result==='I will'){
				if(vscode.window.activeTextEditor){
					vscode.window.activeTextEditor.hide();
				}
			}
			else if(result==="Fucking help me!"){
				vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('http://stackoverflow.alduino.dev/questions'));
			} else if (result === "Got something better to do?") {
				var website = uselessWebsites[Math.floor(Math.random() * uselessWebsites.length)][0];
				vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(website));
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
