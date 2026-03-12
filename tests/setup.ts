/**
 * Test setup file for Mocha
 * Configures Chai with plugins
 */

import chai from 'chai';
import sinonChai from 'sinon-chai';

// Configure Chai plugins
chai.use(sinonChai);

// Export configured chai for use in tests
export { chai };
export const { expect } = chai;
