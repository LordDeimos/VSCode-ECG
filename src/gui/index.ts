import { window, StatusBarAlignment } from "vscode";

const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);

export function guiTest() {
	console.log("Running test?");
	statusBarItem.text = "Hai";
	statusBarItem.show();
}