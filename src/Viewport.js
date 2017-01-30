import React from 'react';
import {findDOMNode} from 'react-dom';

import ViewportDOM from './ViewportDOM';

class Viewport extends React.Component {
	constructor(props) {
		super(props);

		this.viewport = null;

		this.state = {
			contentHeight: 0,
			topOffset: 0,
			items: []
		};

		this.update = this.update.bind(this);
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
		if (this.viewport) {
			this.viewport.dispose();
		}
		this.viewport = ViewportDOM({
			viewport: props.viewport,
			content: findDOMNode(this),
			update: this.update,
			total: props.items.length,
			itemHeight: props.itemHeight,
			bufferSize: props.bufferSize,
		});
	}

	update({topOffset, contentHeight, start, end}) {
		this.setState({
			topOffset,
			contentHeight,
			items: this.props.items.slice(start, end),
		});
	}

	render() {
		const {items, contentHeight, topOffset} = this.state;
		const style = {
			boxSizing: 'border-box',
			height: contentHeight + 'px',
			paddingTop: topOffset + 'px'
		};
		return (
			<div className="viewport">
				<div className="viewport__content" style={style}>
					{this.props.children(items)}
				</div>
			</div>
		);
	}
}

Viewport.propTypes = {
	viewport: React.PropTypes.object,
	children: React.PropTypes.func.isRequired,
	items: React.PropTypes.array,
	itemHeight: React.PropTypes.number.isRequired,
	bufferSize: React.PropTypes.number,
};

Viewport.defaultProps = {
	viewport: window,
	items: [],
	bufferSize: 0,
};

export default Viewport;
