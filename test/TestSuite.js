'use strict';

var isEqual = require('lodash/isEqual');
var startsWith = require('lodash/startsWith');
var Component = require('../ui/Component');
var DefaultDOMElement = require('../ui/DefaultDOMElement');
var TestItem = require('./TestItem');
var Router = require('../ui/Router');

function TestSuite() {
  TestSuite.super.apply(this, arguments);

  var moduleNames = {};
  this.props.harness.getTests().forEach(function(t) {
    if (t.moduleName) {
      moduleNames[t.moduleName] = true;
    }
  });
  this.moduleNames = Object.keys(moduleNames);
}

TestSuite.Prototype = function() {

  this.didMount = function() {
    var document = DefaultDOMElement.wrapNativeElement(window.document);
    document.on('keypress', this.onKeypress, this);

    this.router.on('route:changed', this.onRouteChange, this);
    this.router.start();

    this.runTests();
  };

  this.dispose = function() {
    var document = DefaultDOMElement.wrapNativeElement(window.document);
    document.off(this);

    this.router.off(this);
  };

  this.getInitialState = function() {
    this.router = new Router();
    return this.router.readRoute();
  };

  this.render = function($$) {
    var el = $$('div').addClass('sc-test-suite');

    var state = this.state;

    var toolbar = $$('div').addClass('se-toolbar');
    var moduleSelect = $$('select').ref('moduleNames');
    moduleSelect.append($$('option').attr('value', '').append('---   All   --'));
    this.moduleNames.forEach(function(moduleName) {
      var option = $$('option').attr('value', moduleName).append(moduleName);
      if (moduleName === state.filter) option.attr('selected', true);
      moduleSelect.append(option);
    });
    moduleSelect.on('change', this.onModuleSelect);
    toolbar.append(moduleSelect);

    el.append(toolbar);
    var tests = $$('div').addClass('se-tests').ref('tests');
    this.props.harness.getTests().forEach(function(test) {
      tests.append($$(TestItem, { test: test }));
    });
    el.append(tests);

    return el;
  };

  this.didUpdate = function(oldProps, oldState) {
    if (!isEqual(oldState, this.state)) {
      this.runTests();
    }
  };

  this.runTests = function() {
    var testItems = this.refs.tests.getChildren();
    var tests = [];
    var filter = this.state.filter || '';
    testItems.forEach(function(testItem) {
      var t = testItem.props.test;
      if(startsWith(t.moduleName, filter)) {
        testItem.removeClass('sm-hidden');
        tests.push(t);
      } else {
        testItem.addClass('sm-hidden');
      }
    });
    this.props.harness.runTests(tests);
  };

  this.onModuleSelect = function() {
    var filter = this.refs.moduleNames.htmlProp('value');
    this.extendState({
      filter: filter
    });
    this.updateRoute();
  };

  this.onKeypress = function(event) {
    // console.log('####', event);
    var handled = false;
    if (event.key === 'r') {
      this.runTests();
      handled = true;
    }
    if (handled) {
      event.preventDefault();
    }
  };

  this.updateRoute = function() {
    this.router.writeRoute(this.state);
  };

  this.onRouteChange = function(newState) {
    this.setState(newState);
  };

};

Component.extend(TestSuite);

module.exports = TestSuite;