import _ from 'lodash';
import React, {PropTypes} from 'react';
import {findDOMNode} from 'react-dom';
import shallowCompare from 'react-addons-shallow-compare';

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
			start: 0,
			end: 0
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
		return shallowCompare(this, nextProps, nextState);
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
					start,
					end
				});
			},
			total: props.total,
			itemHeight: props.itemHeight,
			bufferSize: props.bufferSize
		});
	}

	resolveViewport(target) {
		if (!target) {
			return this.context.viewport || window;
		}
		if (_.isElement(target)) {
			return target;
		}
		if (React.isValidElement(target)) {
			return findDOMNode(target);
		}
		if (typeof target === 'string') {
			return document.querySelector(target) || window;
		}
		return window;
	}

	render() {
		const {component: Component, componentProps, className} = this.props;
		const {contentHeight, topOffset, start, end} = this.state;
		const style = {
			height: contentHeight,
			paddingTop: topOffset
		};
		return (
			<Component {...componentProps} className={className} style={style}>
				{this.props.renderContent({start, end})}
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
	total: PropTypes.number.isRequired,
	itemHeight: PropTypes.number.isRequired,
	bufferSize: PropTypes.number
};

Viewport.defaultProps = {
	component: 'div',
	componentProps: {},
	viewport: null, // means take from context automatically
	bufferSize: 10
};

Viewport.contextTypes = {
	viewport: PropTypes.any
};

export default Viewport;
