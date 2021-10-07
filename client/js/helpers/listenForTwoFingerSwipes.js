"use strict";

// onTwoFingerSwipe will be called with a cardinal direction ("n", "e", "s" or
// "w") as its only argument.
function listenForTwoFingerSwipes(onTwoFingerSwipe) {
	let history = [];

	document.body.addEventListener(
		"touchmove",
		function (event) {
			if (event.touches.length !== 2) {
				return;
			}

			const now = window.performance.now();

			if (history.length > 0 && history[history.length - 1].timestamp === now) {
				// Touches with the same timestamps don't help us see the speed of
				// movement. Ignore them.
				return;
			}

			const a = event.touches.item(0);
			const b = event.touches.item(1);
			history.push({
				timestamp: window.performance.now(),
				center: [(a.screenX + b.screenX) / 2, (a.screenY + b.screenY) / 2],
			});
		},
		{passive: true}
	);

	document.body.addEventListener(
		"touchend",
		function () {
			if (event.touches.length >= 2) {
				return;
			}

			try {
				const direction = getSwipe(history);

				if (direction) {
					onTwoFingerSwipe(direction);
				}
			} finally {
				history = [];
			}
		},
		{passive: true}
	);

	document.body.addEventListener(
		"touchcancel",
		function () {
			history = [];
		},
		{passive: true}
	);
}

// Returns the cardinal direction ("n", "e", "s", or "w") of the swipe or null
// if there is no swipe.
function getSwipe(hist) {
	if (hist.length < 4 || hist[hist.length - 1].timestamp - hist[0].timestamp > 1000) {
		return null;
	}

	const directionCounts = {n: 0, e: 0, s: 0, w: 0};

	for (let i = 1; i < hist.length; ++i) {
		const previous = hist[i - 1];
		const current = hist[i];

		// Speed is in pixels/millisecond
		const speed =
			distance(previous.center, current.center) /
			Math.abs(previous.timestamp - current.timestamp);

		if (speed > 0 && speed < 0.2) {
			return null;
		}

		const direction = getCardinalDirection(previous.center, current.center);
		++directionCounts[direction];
	}

	let max = null;

	for (const [direction, count] of Object.entries(directionCounts)) {
		if (max === null || count > max[1]) {
			max = [direction, count];
		}
	}

	return max[0];
}

function distance([x1, y1], [x2, y2]) {
	return Math.hypot(x1 - x2, y1 - y2);
}

function getCardinalDirection([x1, y1], [x2, y2]) {
	// If θ is the angle of the vector then this is tan(θ)
	const tangent = (y2 - y1) / (x2 - x1);

	// All values of |tan(-45° to 45°)| are less than 1, same for 145° to 225°
	if (Math.abs(tangent) < 1) {
		return x1 < x2 ? "e" : "w";
	}

	return y1 < y2 ? "s" : "n";
}

export default listenForTwoFingerSwipes;
