import { window, StatusBarAlignment, ViewColumn, Uri, ExtensionContext, WebviewPanel } from "vscode";

const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);

export let webView: WebviewPanel;

export function setup(context: ExtensionContext) {
	webView = window.createWebviewPanel("ecgGraph", "ECG Graph", ViewColumn.Beside, {
	    enableScripts: true
	});
	statusBarItem.show();
	webView.reveal();
	webView.webview.html = html();
}

export function update(val: number) {
	webView.webview.postMessage({
		type: "update",
		data: val
	});
}

/**
 * Had to do this because TypeScript won't import it for some reason
 */
function html():string{
	return `<!doctype html>
	<html>
		<!-- stupid vscode forcing me to make this a propert html document -->
		<head>
			<title>yea nah</title>
		</head>
		<body>
			<div style="background:#1e1e1e;position:fixed;top:0;left:0;right:0;bottom:0;padding:1em">
					<h1 style="margin:0;font-family:'Comic Sans MS';"><span id="vsecg-text">VSECG</span> is the best extension eva</h1>
					<canvas id="graph" width=300 height=150></canvas>
					<canvas id="speedo" style="background:transparent no-repeat center center;background-size:cover;background-image:url(https://alduino.dev/speedo.png)" width=150 height=150></canvas>
				</div>
				
				<script>
				const $graph = document.getElementById("graph"),
					$speedo = document.getElementById("speedo");
				const graphCtx = $graph.getContext("2d"),
					speedoCtx = $speedo.getContext("2d");
				let interval = 500;
	
				let themeValues = {
					light: "#9cdcfe",
					dark: "#5689d688",
					background: "#1e1e1e",
					foreground: "#d4d4d433",
					red: "#ea4e2755"
				};
				
				window.onmessage = function(message) {
					const {type, data} = message.data;
					switch (type) {
						case "update":
							update(data);
							break;
						case "interval":
							interval=data;
							break;
						case "theme":
							themeValues = data;
							break;
						case "display_mode":
							changeDisplayMode(data);
							break;
					}
				}
	
				function changeDisplayMode(mode) {
					if (mode) {
						$graph.style.display = "none";
						$speedo.style.display = "";
					} else {
						$graph.style.display = "";
						$speedo.style.display = "none";
					}
				}
				
				const colours = [
					"#333",
					"#777",
					"#aaa",
					"#777",
					"#333"
				];
				
				let textIndex = 0;
				setInterval(() => {
					const $text = document.getElementById("vsecg-text");
					const content = $text.textContent;
					$text.textContent = "";
					for (let i = 0; i < content.length; i++) {
						const letter = content[i];
						const $el = document.createElement("span");
						$el.textContent = letter;
						$el.style.color = colours[(textIndex - i) % colours.length];
						$text.appendChild($el);
					}
					textIndex++;
				}, 100);
				
				const values = [];
				
				let currentIndex = 0;
				
				const spacing = 7;
				
				let scale = 1;
				let updateTime = 0;
				
				function update(value) {
					console.log("value: " + value);
					values[currentIndex] = value;
					currentIndex++;
					updateTime = performance.now();
					if (currentIndex > $graph.width / spacing) currentIndex = 0;
				}
				
				function frame() {
					requestAnimationFrame(frame);
				
					const secondLastRealValue = values[currentIndex - 2];
					const lastRealValue = {index: currentIndex - 1, value: values[currentIndex - 1]};
					const timeDiff = (performance.now() - updateTime) / interval;
				
					const prediction = lastRealValue.value - (secondLastRealValue - lastRealValue.value) * timeDiff;
				
					scale = Math.max(...values, Number.isNaN(prediction) ? 0 : prediction) / $graph.height;
					if (scale < .01) scale = .01;
				
					graphCtx.clearRect(0, 0, $graph.width, $graph.height);
					speedoCtx.clearRect(0, 0, $speedo.width, $speedo.height);
	
					drawGraph(prediction);
					drawSpeedo(prediction || values[values.length - 1]);
				}
				
				function drawGraph(prediction) {			
					graphCtx.lineWidth = 1;
					graphCtx.strokeStyle = themeValues.foreground;
					graphCtx.lineCap = "round";
				
					const points = values.map((line, i) => ({
						x: (i - 1) * spacing,
						y: $graph.height - line / scale
					}));
				
					const lastRealValue = {index: currentIndex - 1, value: values[currentIndex - 1]};
					const timeDiff = (performance.now() - updateTime) / interval;
	
					for (let i = 0; i < values.length - 1; i++) {
						if (values[i] > 1.4) continue;
	
						graphCtx.fillStyle = themeValues.red;
						graphCtx.fillRect(i * spacing, 0, spacing, $graph.height);
					}
	
					if (Math.floor(scale * 100) !== 0) {
						for (let i = 0; i < $graph.height; i += Math.floor(scale * 100) / scale / 10) {
							graphCtx.beginPath();
							graphCtx.moveTo(0, $graph.height - i);
							graphCtx.lineTo($graph.width - spacing * 2, $graph.height - i);
							graphCtx.stroke();
						}
					}
	
					graphCtx.lineWidth = 3;
					graphCtx.strokeStyle = themeValues.light;
				
					points[currentIndex] = {
						x: (lastRealValue.index + timeDiff) * spacing,
						y: $graph.height - prediction / scale
					};
	
					graphCtx.fillStyle = themeValues.dark;
				
					if (currentIndex > 2) {
						graphCtx.beginPath();
						graphCtx.moveTo(-10, $graph.height);
						for (let i = 0; i < currentIndex - 1; i++) {
							const cx = (points[i].x + points[i + 1].x) / 2;
							const cy = (points[i].y + points[i + 1].y) / 2;
							graphCtx.quadraticCurveTo(points[i].x, points[i].y, cx, cy);
						}
						graphCtx.quadraticCurveTo(points[currentIndex - 1].x, points[currentIndex - 1].y, points[currentIndex].x, points[currentIndex].y);
						graphCtx.stroke();
						graphCtx.lineTo(points[currentIndex].x, $graph.height);
						graphCtx.fill();
					}
				
					if (points.length - currentIndex > 2) {
						graphCtx.beginPath();
						graphCtx.moveTo(points[currentIndex + 1].x, $graph.height);
						for (let i = currentIndex + 1; i < points.length - 2; i++) {
							const cx = (points[i].x + points[i + 1].x) / 2;
							const cy = (points[i].y + points[i + 1].y) / 2;
							graphCtx.quadraticCurveTo(
								points[i].x,
								points[i].y, 
								cx, 
								cy
							);
						}
						graphCtx.quadraticCurveTo(
							points[points.length - 2].x, 
							points[points.length - 2].y,
							points[points.length - 1].x,
							points[points.length - 1].y
						);
						graphCtx.stroke();
						graphCtx.lineTo(points[points.length - 1].x, $graph.height);
						graphCtx.fill();
					}
				}
	
				function sigmoid(x) {
					return 1 / (1 + Math.exp(-x));
				}
				
				function drawSpeedo(prediction) {
					const length = Math.min($speedo.width / 2, $speedo.height);
	
					const max = 180 * Math.PI / 180;
	
					const currentValue = prediction;
					speedoCtx.lineWidth = 7;
					speedoCtx.lineCap = "round";
					speedoCtx.strokeStyle = "white";
					const angle = (2 + sigmoid(currentValue / 10)) * max;
					speedoCtx.beginPath();
					speedoCtx.moveTo($speedo.width / 2, $speedo.height / 2);
					speedoCtx.lineTo($speedo.width / 2 - Math.cos(angle) * length * .7, $speedo.height / 2 - Math.sin(angle) * length * .7);
					speedoCtx.stroke();
				}
				
				frame();
				
				function randomBm() {
					let u = 0, v = 0;
					while (u === 0) u = Math.random();
					while (v === 0) v = Math.random();
					return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
				}
				
				/*let val = 0;
				setInterval(() => {
					val = (7 * val + Math.max(0, randomBm() * 30)) / 8;
					window.postMessage({
						type: "update",
						data: val
					});
				}, interval);*/
			</script>
		</body>
	</html>`
}