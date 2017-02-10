const NOOP = () => {};

// If a browser doesn't support the `options` argument to
// add/removeEventListener, we need to check, otherwise we will
// accidentally set `capture` with a truthy value.
const PASSIVE = (() => {
	if (typeof window === 'undefined') return false;
	let hasSupport = false;
	try {
		document.createElement('div').addEventListener('test', NOOP, {
			get passive() {
				hasSupport = true;
				return false;
			}
		});
	} catch (err) {
	}
	return hasSupport;
})() ? {passive: true} : false;

export default function ViewportDOM({viewport = window, content, total, itemHeight, update, bufferSize = 0}) {
	function getViewBox() {
		const top = getScrollTop(viewport);
		const height = getHeight(viewport);
		return {
			top,
			height,
			bottom: top + height
		};
	}

	function getContentBox() {
		const top = topFromWindow(content) - topFromWindow(viewport);
		const height = total * itemHeight;
		return {
			top,
			height,
			bottom: top + height
		};
	}

	function getState() {
		const viewBox = getViewBox();
		const contentBox = getContentBox();
		const visualBox = getVisualBox(viewBox, contentBox);

		const start = Math.max(0,  Math.floor(visualBox.top / itemHeight) - bufferSize);
		const end = Math.min(total, Math.ceil(visualBox.bottom / itemHeight) + bufferSize);

		return {
			contentHeight: contentBox.height,
			topOffset: (start * itemHeight),
			start,
			end
		};
	}

	const frame = requestFrameDebounce(() => update(getState()));
	const requestFrame = frame.request;

	viewport.addEventListener('scroll', requestFrame, PASSIVE);
	const removeResizeListeners = addResizeListeners(viewport, requestFrame);

	function dispose() {
		viewport.removeEventListener('scroll', requestFrame);
		removeResizeListeners();
		frame.cancel();
	}

	// initialize
	update(getState());

	return {
		getState,
		dispose
	};
}

function getVisualBox(view, list) {
	return {
		top: Math.max(0, Math.min(view.top - list.top)),
		bottom: Math.max(0, Math.min(list.height, view.bottom - list.top))
	};
}

function topFromWindow(elem) {
	if (!elem || elem === window) {
		return 0;
	}

	let y = 0;

	while (elem) {
		y += elem.offsetTop;
		elem = elem.offsetParent;
	}

	return y;
}

function getHeight(elem) {
	return elem.clientHeight || elem.innerHeight;
}

function getScrollTop(elem) {
	return typeof elem.scrollTop === 'undefined' ? elem.scrollY || elem.pageYOffset : elem.scrollTop;
}

const requestAnimationFrameImpl =
	window.requestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	function requestAnimationFramePolyfill(fn) {
		return setTimeout(fn, 15);
	};

const cancelAnimationFrameImpl =
	window.cancelAnimationFrame ||
	window.mozCancelAnimationFrame ||
	window.webkitCancelAnimationFrame ||
	window.clearTimeout;

function requestFrameDebounce(fn) {
	let pending = null;

	const run = () => {
		pending = null;
		fn();
	};

	const cancel = () => {
		if (pending) {
			cancelAnimationFrameImpl(pending);
			pending = null;
		}
	};

	return {
		request: () => {
			cancel();
			pending = requestAnimationFrameImpl(run);
			return cancel;
		},
		cancel
	};
}

function addResizeListeners(elem, fn) {
	window.addEventListener('resize', fn);

	if (elem === window) {
		return () => {
			window.removeEventListener('resize', fn);
		};
	}

	const removeElementListener = listenElementResize(elem, fn);

	return () => {
		removeElementListener();
		window.removeEventListener('resize', fn);
	};
}

function listenElementResize(elem, fn) {
	let lastHeight = 0;

	const intervalId = setInterval(() => {
		const now = getHeight(elem);
		if (now !== lastHeight) {
			lastHeight = now;
			fn();
		}
	}, 100);

	return () => {
		clearInterval(intervalId);
	};
}
