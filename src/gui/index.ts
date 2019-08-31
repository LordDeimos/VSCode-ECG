import { window, StatusBarAlignment, ViewColumn, Uri, ExtensionContext } from "vscode";
import * as fs from "fs";
import * as path from "path";

const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);


let value = 0;

export function setup(context: ExtensionContext) {
	let webView = window.createWebviewPanel("ecgGraph", "ECG Graph", ViewColumn.Beside, {});
	statusBarItem.show();
	webView.reveal();

	const viewPath = Uri.file(path.join(context.extensionPath, "src", "gui", "view.html"));
	webView.webview.html = fs.readFileSync(viewPath.fsPath, "utf8");

	setInterval(update, 100);
}

export function set(val: number) {
	value = val;
}

function update() {

}