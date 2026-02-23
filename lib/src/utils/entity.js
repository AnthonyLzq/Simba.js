const pluralize = require('pluralize')

/**
 * Build all naming variants for a given entity name.
 *
 * @param {string} raw PascalCase entity name (e.g. "Product", "User")
 * @returns {EntityNames}
 */
const buildEntityNames = raw => {
  // Ensure PascalCase
  const pascal = raw.charAt(0).toUpperCase() + raw.slice(1)
  const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1)
  const plural = pluralize(camel)
  const pluralPascal = plural.charAt(0).toUpperCase() + plural.slice(1)

  return { pascal, camel, plural, pluralPascal }
}

/**
 * Build the field definitions for an entity.
 * - Default "User" gets `name` + `lastName`
 * - Any other entity gets `name` + `description`
 *
 * @param {string} entityPascal PascalCase entity name
 * @returns {EntityFieldSet}
 */
const buildEntityFields = entityPascal => {
  const isUser = entityPascal === 'User'

  const fields = isUser
    ? [
        { name: 'lastName', prismaType: 'String', zodType: 'z.string()' },
        { name: 'name', prismaType: 'String', zodType: 'z.string()' }
      ]
    : [
        { name: 'name', prismaType: 'String', zodType: 'z.string()' },
        {
          name: 'description',
          prismaType: 'String',
          zodType: 'z.string()'
        }
      ]

  const sampleData = isUser
    ? { lastName: "'Lzq'", name: "'Anthony'" }
    : { name: "'Test'", description: "'A test item'" }

  const updateData = isUser
    ? { lastName: "'Luzquiños'", name: "'Anthony'" }
    : { name: "'Updated'", description: "'Updated description'" }

  return { fields, sampleData, updateData, isUser }
}

/**
 * Build the full entity context object to pass into EJS templates.
 *
 * @param {string} raw PascalCase entity name (default: "User")
 * @returns {EntityContext}
 */
const buildEntityContext = (raw = 'User') => {
  const names = buildEntityNames(raw)
  const fieldSet = buildEntityFields(names.pascal)

  return {
    // Naming variants
    Entity: names.pascal,
    entity: names.camel,
    entities: names.plural,
    EntitiesPlural: names.pluralPascal,

    // Fields
    entityFields: fieldSet.fields,
    sampleData: fieldSet.sampleData,
    updateData: fieldSet.updateData,
    isDefaultEntity: fieldSet.isUser
  }
}

module.exports = { buildEntityNames, buildEntityFields, buildEntityContext }

/**
 * @typedef {Object} EntityNames
 * @property {string} pascal  e.g. "Product"
 * @property {string} camel   e.g. "product"
 * @property {string} plural  e.g. "products"
 * @property {string} pluralPascal e.g. "Products"
 */

/**
 * @typedef {Object} EntityField
 * @property {string} name
 * @property {string} prismaType
 * @property {string} zodType
 */

/**
 * @typedef {Object} EntityFieldSet
 * @property {EntityField[]} fields
 * @property {Object<string,string>} sampleData
 * @property {Object<string,string>} updateData
 * @property {boolean} isUser
 */

/**
 * @typedef {Object} EntityContext
 * @property {string} Entity PascalCase name
 * @property {string} entity camelCase name
 * @property {string} entities plural lowercase name
 * @property {string} EntitiesPlural plural PascalCase name
 * @property {EntityField[]} entityFields field definitions
 * @property {Object<string,string>} sampleData sample create data
 * @property {Object<string,string>} updateData sample update data
 * @property {boolean} isDefaultEntity true if entity is "User"
 */
