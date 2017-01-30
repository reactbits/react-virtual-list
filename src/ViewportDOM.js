export default function ViewportDOM({viewport = window, content, total, itemHeight, update, bufferSize = 0}) {
	function getState() {
		const absTopOffset = getTop(viewport) - getTop(content) + getScrollTop(viewport);
		const viewportHeight = getHeight(viewport);
		const visibleHeight = Math.min(viewportHeight, viewportHeight + absTopOffset);

		const visibleCount = Math.ceil(visibleHeight / itemHeight) + 1;
		let start = Math.max(0, Math.floor(absTopOffset / itemHeight));
		let end = start + visibleCount;

		if (bufferSize) {
			start = Math.max(0, start - bufferSize);
			end = end + bufferSize;
		}

		return {
			contentHeight: total * itemHeight,
			topOffset: start * itemHeight,
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
		dispose,
	};
}

function getTop(el) {
	if (el === window) {
		return 0;
	}

	let y = 0;

	while (!!el) {
		y += el.offsetTop;
		el = el.offsetParent;
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
