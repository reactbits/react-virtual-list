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

	const frame = rafDebounce(() => update(getState()));
	const requestFrame = frame.request;

	viewport.addEventListener('scroll', requestFrame);
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
	function requestAnimationFrameFallback(fn) {
		return window.setTimeout(fn, 20);
	};

const cancelAnimationFrameImpl =
	window.cancelAnimationFrame ||
	window.mozCancelAnimationFrame ||
	window.webkitCancelAnimationFrame ||
	window.clearTimeout;

function rafDebounce(fn) {
	let scheduled = false;

	const fnWrapper = () => {
		fn();
		scheduled = false;
	};

	return {
		request: () => {
			if (!scheduled) {
				requestAnimationFrameImpl(fnWrapper);
				scheduled = true;
			}
		},
		cancel: () => {
			cancelAnimationFrameImpl(fnWrapper);
		}
	};
}

function addResizeListeners(elem, fn) {
	window.addEventListener('resize', fn);

	if (elem === window) {
		return () => {
			window.removeEventListener('resize', fn);
		};
	}

	function makeHash(el) {
		return [el.style.width, el.style.height, el.clientWidth, el.clientHeight].join('');
	}

	let lastHash = '';

	const intervalId = setInterval(() => {
		const now = makeHash(elem);
		if (now !== lastHash) {
			lastHash = now;
			fn();
		}
	}, 100);

	return () => {
		clearInterval(intervalId);
		window.removeEventListener('resize', fn);
	};
}
