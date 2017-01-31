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

	const requestFrame = rafDebounce(() => update(getState()));

	function dispose() {
		viewport.removeEventListener('scroll', requestFrame);
		viewport.removeEventListener('resize', requestFrame);
	}

	viewport.addEventListener('scroll', requestFrame);
	viewport.addEventListener('resize', requestFrame);

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

function rafDebounce(fn) {
	let scheduled = false;

	const fnWrapper = () => {
		fn();
		scheduled = false;
	};

	return () => {
		if (!scheduled) {
			requestAnimationFrame(fnWrapper);
			scheduled = true;
		}
	};
}
