/*
 * polynode
 *
 * Released under MIT license. Copyright 2021 Jorge Duarte Rodriguez <info@malagadev.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
 * to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies
 * or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
 * FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 * $Id:$
 *
 * @flow
 * @format
 *
 */

const injector = require('awilix');

const LogService = require('polynode-service-log-default');

const DEFAULT_DEPENDENCIES = { log: injector => injector.asFunction(LogService).singleton() };

const injectDefaultDeps = composer => {
  console.log('[polynode/composer] Injecting default deps...');
  for (const depName of Object.keys(DEFAULT_DEPENDENCIES)) {
    console.log('[polynode/composer] - ' + depName + ' ...');
    const depInjectorMethod = DEFAULT_DEPENDENCIES[depName];

    composer.integrate({
      injector: composer =>
        composer.registerDependency({
          [depName]: depInjectorMethod,
        }),
    });
  }
};

type ComposerModule = {
  injector: (composer: PolynodeComposerType, opts?: {}) => PolynodeComposerType,
  onStart?: (composer: PolynodeComposerType) => void,
};

const PolynodeComposer = function() {
  this.container = null;
  this.startHandlers = [];

  this.create = function(
    firstModule: ComposerModule = null,
    omitDefaultDeps: boolean = false,
    opts?: { inject?: {} } = {}
  ) {
    this.container = injector.createContainer();
    if (!omitDefaultDeps) {
      injectDefaultDeps(this);
    }

    if (firstModule) {
      return this.integrate(firstModule, opts);
    }
    return this;
  };

  this.integrate = function(cModule: ComposerModule, opts?: { inject?: {} } = {}) {
    console.log('[PolynodeComposer] integrate() - Module is: ', cModule, 'opts: ', opts);
    const instance = cModule.injector(this, opts);
    if ('onStart' in cModule) {
      instance.startHandlers.push(() => cModule.onStart(instance));
    }
    return instance;
  };

  this.registerDependency = function(deps: {}) {
    console.log('[PolynodeComposer] registerDependency() - Deps are: ', deps);
    this.container.register(
      Object.keys(deps).reduce((res, depName) => {
        const depObj = deps[depName](injector);
        return { ...res, [depName]: depObj };
      }, {})
    );
    return this;
  };

  this.exec = function() {
    return this.startHandlers.map(handler => handler());
  };

  return this.create();
};

module.exports = PolynodeComposer();
