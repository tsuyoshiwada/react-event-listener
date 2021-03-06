// @flow

import React, {Component, PropTypes} from 'react';
import shallowCompare from 'react-addons-shallow-compare';
import * as supports from './supports';

function on(target: Object, eventName: string, callback: Function, capture?: boolean): void {
  if (supports.addEventListener) {
    target.addEventListener(eventName, callback, capture);
  } else if (supports.attachEvent) { // IE8+ Support
    target.attachEvent(`on${eventName}`, () => {
      callback.call(target);
    });
  }
}

function off(target: Object, eventName: string, callback: Function, capture?: boolean): void {
  if (supports.removeEventListener) {
    target.removeEventListener(eventName, callback, capture);
  } else if (supports.detachEvent) { // IE8+ Support
    target.detachEvent(`on${eventName}`, callback);
  }
}

type Props = {
  children?: React.Element<any>,
  target?: EventTarget,
  [event: string]: Function
};

const state = {};

function forEachListener(
  props: Props,
  iteratee: (eventName: string, listener: Function, capture?: boolean) => any
): void {
  for (const name in props) {
    if (name.substring(0, 2) === 'on' && props[name] instanceof Function) {
      const capture = name.substr(-7).toLowerCase() === 'capture';

      let eventName = name.substring(2).toLowerCase();
      eventName = capture ? eventName.substring(0, eventName.length - 7) : eventName;

      iteratee(eventName, props[name], capture);
    }
  }
}

export default class EventListener extends Component {
  static propTypes = {
    /**
     * You can provide a children too.
     */
    children: PropTypes.node,
    /**
     * The DOM target to listen to.
     */
    target: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.string,
    ]),
  };

  componentDidMount(): void {
    this.addListeners();
  }

  shouldComponentUpdate(nextProps: Props): boolean {
    return shallowCompare({
      props: this.props,
      state: state,
    }, nextProps, state);
  }

  componentWillUpdate(): void {
    this.removeListeners();
  }

  componentDidUpdate(): void {
    this.addListeners();
  }

  componentWillUnmount(): void {
    this.removeListeners();
  }

  addListeners(): void {
    this.applyListeners(on);
  }

  removeListeners(): void {
    this.applyListeners(off);
  }

  applyListeners(onOrOff: Function): void {
    const {
      target,
    } = this.props;

    if (target) {
      let element = target;

      if (typeof target === 'string') {
        element = window[target];
      }

      forEachListener(this.props, onOrOff.bind(null, element));
    }
  }

  render() {
    return this.props.children || null;
  }
}
