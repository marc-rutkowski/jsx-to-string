import React from 'react';
import stringify from 'json-stringify-pretty-compact';

function isDefaultProp (defaultProps, key, value) {
  if (!defaultProps) {
    return false;
  }
  return defaultProps[key] === value;
}

function stringedObject (object, opts) {
  let result;
  if (Array.isArray(object)) {
    result = object.map(item => stringedObject(item));
  } else if (typeof object === 'object') {
    result = {};
    Object.keys(object).map(key => {
      let value = object[key];
      if (React.isValidElement(value)) {
        value = jsxToString(value, opts);
      } else if (Array.isArray(value)) {
        value = value.map(function (item) {
          return stringedObject(item, opts);
        });
      } else if (typeof value === 'object') {
        value = stringedObject(value, opts);
      } else if (typeof value === 'function') {
        value = '...';
      }
      result[key] = value;
    });
  } else {
    result = object;
  }
  return result;
}

const _JSX_REGEXP = /"<.+>"/g;

function jsxToString (component, options) {

  const baseOpts = {
    displayName: component.type.displayName || component.type.name ||
      component.type,
    ignoreProps: [],
    keyValueOverride: {},
    spacing: 0
  };

  let opts = {...baseOpts, ...options};

  let componentData = {
    name: opts.displayName
  };

  delete opts.displayName;

  if (component.props) {
    var indentation = new Array(opts.spacing + 3).join(' ');
    componentData.props = Object.keys(component.props).filter(key => {
      return (key !== 'children' &&
        ! isDefaultProp(component.type.defaultProps, key,
          component.props[key]) &&
        ! opts.ignoreProps.indexOf(key) > -1)
    }).map(key => {
      if (key === 'children' ||
        isDefaultProp(component.type.defaultProps, key, component.props[key]) ||
        opts.ignoreProps.indexOf(key) > -1) {
        return '';
      } else {
        let value = component.props[key];
        if (typeof value === 'string') {
          return `${key}="${value}"`;
        } else if (React.isValidElement(value)) {
          opts.spacing += 2;
          value = jsxToString(value, opts);
          opts.spacing -= 2;
        } else if (typeof value === 'object') {
          value = stringify(stringedObject(value, opts));
          // remove string quotes from embeded JSX values
          value = value.replace(_JSX_REGEXP, function (match) {
            return match.slice(1, match.length - 1);
          });
        } else if (typeof value === 'function') {
          value = '...';
        }
        return `${key}={${opts.keyValueOverride[key] || value}}`
      }
    }).join('\n' + indentation);
    if (componentData.props.length > 0) {
      componentData.props = ' ' + componentData.props;
    }
  }

  if (component.props.children) {
    opts.spacing += 2;
    let indentation = new Array(opts.spacing + 1).join(' ');
    if (typeof component.props.children === 'string') {
      componentData.children = component.props.children;
    } else if (typeof component.props.children === 'object' &&
      !Array.isArray(component.props.children)) {
      componentData.children = jsxToString(component.props.children, opts);
    } else {
      componentData.children = component.props.children
        .filter((child) => child)
        .map((child) => {
          return (typeof child === 'string')
            ? child
            : jsxToString(child, opts);
          })
        .join(`\n${indentation}`);
    }
    return `<${componentData.name}${componentData.props}>\n` +
      `${indentation}${componentData.children}\n` +
      `${indentation.slice(0, -2)}</${componentData.name}>`;
  } else {
    return `<${componentData.name}${componentData.props} />`;
  }
}

export default jsxToString;
