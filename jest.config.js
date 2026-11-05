export default {
    transform: {},
    testEnvironment: 'node',
    verbose: true,
    injectGlobals: true,
    collectCoverage: true,
    coverageThreshold: {
        global: {
            statements: 70,
            branches: 70,
            functions: 70,
            lines: 70
        }
    }
};