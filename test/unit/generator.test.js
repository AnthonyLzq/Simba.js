const { join } = require('node:path')
const { mkdtemp, rm } = require('node:fs/promises')
const { tmpdir } = require('node:os')

const {
  buildEntityNames,
  buildEntityFields,
  buildEntityContext
} = require('../../lib/src/utils/entity')
const titleCase = require('../../lib/src/utils/titleCase')
const { renderTemplate, TEMPLATES_DIR } = require('../../lib/src/utils/renderTemplate')
const mkdirs = require('../../lib/src/utils/mkdirs')
const writeFile = require('../../lib/src/utils/writeFile')

// ─── titleCase ───────────────────────────────────────────────────────────────

describe('titleCase', () => {
  it('converts hyphenated names', () => {
    expect(titleCase('my-cool-app')).toBe('My Cool App')
  })

  it('handles single word', () => {
    expect(titleCase('backend')).toBe('Backend')
  })

  it('handles multiple hyphens', () => {
    expect(titleCase('a-b-c-d')).toBe('A B C D')
  })

  it('handles already capitalized segments', () => {
    expect(titleCase('My-App')).toBe('My App')
  })
})

// ─── buildEntityNames ────────────────────────────────────────────────────────

describe('buildEntityNames', () => {
  it('returns correct variants for User', () => {
    const result = buildEntityNames('User')

    expect(result).toEqual({
      pascal: 'User',
      camel: 'user',
      plural: 'users',
      pluralPascal: 'Users'
    })
  })

  it('returns correct variants for Product', () => {
    const result = buildEntityNames('Product')

    expect(result).toEqual({
      pascal: 'Product',
      camel: 'product',
      plural: 'products',
      pluralPascal: 'Products'
    })
  })

  it('handles irregular plurals', () => {
    const result = buildEntityNames('Category')

    expect(result.plural).toBe('categories')
    expect(result.pluralPascal).toBe('Categories')
  })

  it('capitalizes first letter if lowercase is passed', () => {
    const result = buildEntityNames('order')

    expect(result.pascal).toBe('Order')
    expect(result.camel).toBe('order')
  })
})

// ─── buildEntityFields ───────────────────────────────────────────────────────

describe('buildEntityFields', () => {
  it('returns lastName + name for User', () => {
    const { fields, isUser } = buildEntityFields('User')

    expect(isUser).toBe(true)
    expect(fields).toHaveLength(2)
    expect(fields.map(f => f.name)).toEqual(['lastName', 'name'])
  })

  it('returns name + description for non-User entities', () => {
    const { fields, isUser } = buildEntityFields('Product')

    expect(isUser).toBe(false)
    expect(fields).toHaveLength(2)
    expect(fields.map(f => f.name)).toEqual(['name', 'description'])
  })

  it('provides sample and update data for User', () => {
    const { sampleData, updateData } = buildEntityFields('User')

    expect(sampleData).toHaveProperty('lastName')
    expect(sampleData).toHaveProperty('name')
    expect(updateData).toHaveProperty('lastName')
    expect(updateData).toHaveProperty('name')
  })

  it('provides sample and update data for custom entity', () => {
    const { sampleData, updateData } = buildEntityFields('Product')

    expect(sampleData).toHaveProperty('name')
    expect(sampleData).toHaveProperty('description')
    expect(updateData).toHaveProperty('name')
    expect(updateData).toHaveProperty('description')
  })

  it('all fields have prismaType and zodType', () => {
    const { fields } = buildEntityFields('Product')

    for (const f of fields) {
      expect(f).toHaveProperty('prismaType')
      expect(f).toHaveProperty('zodType')
    }
  })
})

// ─── buildEntityContext ──────────────────────────────────────────────────────

describe('buildEntityContext', () => {
  it('defaults to User when no arg is passed', () => {
    const ctx = buildEntityContext()

    expect(ctx.Entity).toBe('User')
    expect(ctx.entity).toBe('user')
    expect(ctx.entities).toBe('users')
    expect(ctx.isDefaultEntity).toBe(true)
  })

  it('builds correct context for a custom entity', () => {
    const ctx = buildEntityContext('Product')

    expect(ctx.Entity).toBe('Product')
    expect(ctx.entity).toBe('product')
    expect(ctx.entities).toBe('products')
    expect(ctx.EntitiesPlural).toBe('Products')
    expect(ctx.isDefaultEntity).toBe(false)
    expect(ctx.entityFields).toHaveLength(2)
  })

  it('exposes entityFields, sampleData, updateData', () => {
    const ctx = buildEntityContext('Order')

    expect(Array.isArray(ctx.entityFields)).toBe(true)
    expect(typeof ctx.sampleData).toBe('object')
    expect(typeof ctx.updateData).toBe('object')
  })
})

// ─── renderTemplate ──────────────────────────────────────────────────────────

describe('renderTemplate', () => {
  it('renders a simple template with data', () => {
    const ctx = buildEntityContext('User')
    const result = renderTemplate('api/express/network/routes/home.ts.ejs')

    expect(result).toContain('Welcome')
    expect(typeof result).toBe('string')
  })

  it('renders entity-dependent templates correctly', () => {
    const ctx = buildEntityContext('Product')
    const result = renderTemplate('api/express/network/routes/entity.ts.ejs', {
      graphQL: false,
      dbIsSQL: true,
      ...ctx
    })

    expect(result).toContain('Product')
    expect(result).toContain('product')
    expect(result).toContain('products')
    expect(result).not.toContain('User')
  })

  it('throws on non-existent template', () => {
    expect(() => renderTemplate('does/not/exist.ejs')).toThrow()
  })
})

// ─── mkdirs ──────────────────────────────────────────────────────────────────

describe('mkdirs', () => {
  let tmpDir

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'simba-test-'))
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('creates a single directory', async () => {
    const dir = join(tmpDir, 'foo')
    await mkdirs(dir)

    const { stat } = require('node:fs/promises')
    const stats = await stat(dir)

    expect(stats.isDirectory()).toBe(true)
  })

  it('creates multiple directories in parallel', async () => {
    const dirs = [
      join(tmpDir, 'a'),
      join(tmpDir, 'b'),
      join(tmpDir, 'c')
    ]
    await mkdirs(...dirs)

    const { stat } = require('node:fs/promises')

    for (const d of dirs) {
      const stats = await stat(d)
      expect(stats.isDirectory()).toBe(true)
    }
  })

  it('creates nested directories recursively', async () => {
    const deep = join(tmpDir, 'x', 'y', 'z')
    await mkdirs(deep)

    const { stat } = require('node:fs/promises')
    const stats = await stat(deep)

    expect(stats.isDirectory()).toBe(true)
  })

  it('does not throw if directory already exists', async () => {
    const dir = join(tmpDir, 'existing')
    await mkdirs(dir)
    await expect(mkdirs(dir)).resolves.not.toThrow()
  })
})

// ─── writeFile ───────────────────────────────────────────────────────────────

describe('writeFile', () => {
  let tmpDir

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'simba-test-'))
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('writes content to a file', async () => {
    const file = join(tmpDir, 'test.txt')
    await writeFile(file, 'hello world')

    const { readFile } = require('node:fs/promises')
    const content = await readFile(file, 'utf8')

    expect(content).toBe('hello world')
  })

  it('writes UTF-8 content correctly', async () => {
    const file = join(tmpDir, 'unicode.txt')
    const content = 'Hola señor 🦁'
    await writeFile(file, content)

    const { readFile } = require('node:fs/promises')
    const result = await readFile(file, 'utf8')

    expect(result).toBe(content)
  })
})
