'use strict'

const Ajv = require('ajv')
const fs = require('fs')
const path = require('path')
const pack = require('ajv-pack')

const ajv = new Ajv({
  sourceCode: true, // this option is required by ajv-pack
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true
})

const defaultInitOptions = {
  bodyLimit: 1024 * 1024, // 1 MiB
  caseSensitive: true,
  ignoreTrailingSlash: false,
  maxParamLength: 100,
  onProtoPoisoning: 'error',
  pluginTimeout: 10000,
  requestIdHeader: 'request-id',
  requestIdLogLabel: 'reqId'
}

function customRule0 (schemaParamValue, validatedParamValue, validationSchemaObject, currentDataPath, validatedParamObject, validatedParam) {
  validatedParamObject[validatedParam] = schemaParamValue
  return true
}

// We add a keyword that allow us to set default values
ajv.addKeyword('setDefaultValue', {
  modifying: true,
  validate: customRule0,
  errors: false
})

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    bodyLimit: { type: 'integer', default: defaultInitOptions.bodyLimit },
    caseSensitive: { type: 'boolean', default: defaultInitOptions.caseSensitive },
    http2: { type: 'boolean' },
    https: {
      if: {
        not: {
          oneOf: [
            { type: 'boolean' },
            { type: 'null' },
            {
              type: 'object',
              additionalProperties: false,
              required: ['allowHTTP1'],
              properties: {
                allowHTTP1: { type: 'boolean' }
              }
            }
          ]
        }
      },
      then: { setDefaultValue: true }
    },
    ignoreTrailingSlash: { type: 'boolean', default: defaultInitOptions.ignoreTrailingSlash },
    maxParamLength: { type: 'integer', default: defaultInitOptions.maxParamLength },
    onProtoPoisoning: { type: 'string', default: defaultInitOptions.onProtoPoisoning },
    pluginTimeout: { type: 'integer', default: defaultInitOptions.pluginTimeout },
    requestIdHeader: { type: 'string', default: defaultInitOptions.requestIdHeader },
    requestIdLogLabel: { type: 'string', default: defaultInitOptions.requestIdLogLabel }
  }
}

const validate = ajv.compile(schema)

const moduleCode = `// This file is autogenerated by ${__filename.replace(__dirname, 'build')}, do not edit
/* istanbul ignore file */
// constant needed for customRule0 to work
const self = {}

${pack(ajv, validate)}

${customRule0.toString()}

module.exports.defaultInitOptions = ${JSON.stringify(defaultInitOptions)}
`

fs.writeFileSync(path.join(__dirname, '..', 'lib', 'configValidator.js'), moduleCode)
