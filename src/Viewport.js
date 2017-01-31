import React, {PropTypes} from 'react';
import {findDOMNode} from 'react-dom';

import ViewportDOM from './ViewportDOM';

const nullViewport = {
	dispose() {}
};

class Viewport extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			contentHeight: 0,
			topOffset: 0,
			items: []
		};

		this.viewport = nullViewport;
	}

	componentDidMount() {
		this.makeViewport(this.props);
	}

	componentWillUnmount() {
		this.viewport.dispose();
	}

	shouldComponentUpdate(nextProps, nextState) {
		return !(this.state.contentHeight === nextState.contentHeight
				 && this.state.items.length === nextState.items.length
				 && this.state.topOffset === nextState.topOffset);
	}

	componentWillReceiveProps(nextProps) {
		this.makeViewport(nextProps);
	}

	makeViewport(props = this.props) {
		this.viewport.dispose();

		this.viewport = ViewportDOM({
			viewport: this.resolveViewport(props.viewport),
			content: findDOMNode(this),
			update: ({topOffset, contentHeight, start, end}) => {
				this.setState({
					topOffset,
					contentHeight,
					items: props.items.slice(start, end)
				});
			},
			total: props.items.length,
			itemHeight: props.itemHeight,
			bufferSize: props.bufferSize
		});
	}

	resolveViewport(selector) {
		if (typeof selector === 'string') {
			return document.querySelector(selector) || window;
		}
		return selector || window;
	}

	render() {
		const {component: Component, componentProps, className} = this.props;
		const {items, contentHeight, topOffset} = this.state;
		const style = {
			height: contentHeight,
			paddingTop: topOffset
		};
		return (
			<Component {...componentProps} className={className} style={style}>
				{this.props.renderContent(items)}
			</Component>
		);
	}
}

Viewport.propTypes = {
	component: PropTypes.any,
	componentProps: PropTypes.object,
	className: PropTypes.string,
	viewport: PropTypes.any,
	renderContent: PropTypes.func.isRequired,
	items: PropTypes.array,
	itemHeight: PropTypes.number.isRequired,
	bufferSize: PropTypes.number
};

Viewport.defaultProps = {
	component: 'div',
	componentProps: {},
	viewport: window,
	items: [],
	bufferSize: 0
};

export default Viewport;
