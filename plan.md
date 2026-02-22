# Plan de Actualización simba.js v9.0.0

## Estado Actual ✅
- [x] Migración de ESLint a Biome completada en proyecto local
- [x] Configuración de Biome funcional en proyecto local
- [x] Scripts de lint actualizados en proyecto local
- [x] Dependencias de ESLint removidas del proyecto local
- [x] **Node.js 20+ como versión mínima** (actualizado de 16 → 20)
- [x] **Función biome.js creada** y eslint.js obsoleto
- [x] **Templates actualizados** - Biome funcionando en ejemplos generados
- [x] **Scripts npm actualizados** - lint y lint:ci usando Biome
- [x] **GitHub Actions actualizado** - usando Node.js 20 y Biome
- [x] **.biomeignore creado** - separación limpia de archivos ignorados

## Fases de Actualización

### Fase 1: Actualización de Node.js y Compatibilidad
**Prioridad: Alta**

#### 1.1 Versión Mínima de Node.js
- [x] Actualizar `engines.node` de `>=16.0.0` a `>=20.0.0` 
- [x] Justificación: Node.js 16 está en End of Life (abril 2024)
- [x] **Node.js 20 LTS con soporte hasta abril 2026** (ACTUALIZACIÓN DIRECTA)
- [x] Salteamos Node.js 18 y vamos directo a 20 para mejor longevidad

#### 1.2 Revisión de APIs de Node.js
- [ ] Verificar uso de APIs deprecadas
- [ ] Actualizar imports a protocolo `node:` (ya completado con Biome)
- [ ] Revisar compatibilidad con nuevas características de Node.js 20+
- [ ] **Aprovechar fetch nativo disponible desde Node.js 18** (incluido en 20)
- [ ] **Evaluar node:test como alternativa a Jest** (estable en Node.js 20)

### Fase 2: Actualización de Dependencias Principales
**Prioridad: Alta**

#### 2.1 Dependencies
- [ ] `colors@1.4.0` → Evaluar migración a `chalk@5.x` (más moderno, ESM-first)
- [ ] `underscore@1.13.7` → Reemplazar con métodos nativos de JavaScript (ES2022+)
- [ ] `yargs@17.7.2` → Actualizar a `yargs@17.7.x` más reciente
- [ ] `prompts@2.4.2` → Verificar versión más reciente
- [ ] `cli-progress@3.12.0` → Verificar versión más reciente

#### 2.2 DevDependencies
- [ ] `jest@29.7.0` → Actualizar a versión más reciente
- [ ] `standard-version@9.5.0` → Considerar migración a `@changesets/cli`
- [ ] `knex@3.1.0` → Actualizar versión
- [ ] `mongodb@6.8.0` → Actualizar versión
- [ ] `pg@8.12.0` → Actualizar versión

### Fase 3: Migración Completa de ESLint a Biome en Plantillas
**Prioridad: Alta** ✅ **COMPLETADA**

#### 3.1 Refactorización del Generador de Configuración
- [x] **CRÍTICO**: Renombrar `lib/src/functions/eslint.js` → `lib/src/functions/biome.js`
- [x] Reescribir función para generar `biome.json` en lugar de `.eslintrc`
- [x] Eliminar generación de `.eslintignore`
- [x] Remover completamente referencias a Prettier (Biome lo incluye)
- [x] Actualizar `lib/src/functions/index.js` para importar biome en lugar de eslint

#### 3.2 Actualización de Dependencias en Generador Principal
- [x] Modificar `lib/src/index.js` - Sección de devPackages:
  - [x] Remover: `eslint`, `eslint-config-*`, `eslint-plugin-*`, `prettier`
  - [x] Añadir: `@biomejs/biome`
- [x] Actualizar función `packageJson.js` para incluir Biome en devDependencies
- [x] Remover referencias a TypeScript ESLint plugins en proyectos TypeScript

#### 3.3 Migración de Todas las Plantillas de Proyectos
- [x] **Express con PostgreSQL**: Migrar configuración completa
  - [x] Actualizar `lib/src/functions/api/express.js`
  - [x] Reemplazar configuración ESLint por Biome
  - [x] Actualizar scripts en package.json generado
- [x] **Express con MongoDB**: Migrar configuración completa
- [x] **Express con GraphQL + PostgreSQL**: Migrar configuración completa
- [x] **Express con GraphQL + MongoDB**: Migrar configuración completa
- [x] **Fastify con PostgreSQL**: Migrar configuración completa
  - [x] Actualizar `lib/src/functions/api/fastify.js`
- [x] **Fastify con MongoDB**: Migrar configuración completa
- [x] **Fastify con GraphQL + PostgreSQL**: Migrar configuración completa
- [x] **Fastify con GraphQL + MongoDB**: Migrar configuración completa

#### 3.4 Configuración de Biome para Proyectos TypeScript
- [x] Crear configuración específica de `biome.json` para TypeScript
- [x] Habilitar `unsafeParameterDecoratorsEnabled` para proyectos GraphQL
- [x] Configurar reglas específicas para TypeScript
- [x] Asegurar compatibilidad con decoradores de type-graphql

#### 3.5 Scripts de NPM Generados
- [x] Reemplazar todos los scripts de lint:
  - [x] `"lint": "eslint src/* --ext .ts --fix"` → `"lint": "biome check --write src/"`
  - [x] `"lint:ci": "biome check src/"`
- [x] Remover scripts de Prettier:
  - [x] Eliminar `"format"`, `"format:check"`, etc.
- [x] Actualizar scripts de CI en GitHub Actions generadas

#### 3.6 Archivos de Configuración Generados
- [x] **ELIMINAR generación de**:
  - [x] `.eslintrc` (todas las variantes)
  - [x] `.eslintignore`
  - [x] `.prettierrc`
  - [x] `.prettierignore`
- [x] **AÑADIR generación de**:
  - [x] `biome.json` con configuración optimizada para cada tipo de proyecto
  - [x] `.biomeignore` con patrones de archivos a ignorar
  - [x] Configuración específica para proyectos con/sin GraphQL

#### 3.7 Actualización de GitHub Actions Templates
- [x] Modificar `lib/src/functions/ghat.js` (GitHub Actions)
- [x] Reemplazar pasos de ESLint por Biome en workflows generados
- [x] Actualizar comandos de lint en CI/CD
- [x] Asegurar que Biome se instale correctamente en CI

### Fase 4: Actualización de Dependencias y Templates Modernos
**Prioridad: Alta** (Elevada de Media a Alta)

#### 4.1 Dependencias de Desarrollo Generadas (Post-Biome)
- [ ] **TypeScript**: Actualizar a v5.5+ (última estable)
- [ ] **@types/node**: Actualizar a versiones compatibles con Node.js 20+ (v20.x)
- [ ] **Jest**: Actualizar a v29.7+ con mejoras de performance
- [ ] **ts-jest**: Actualizar a versión compatible con Jest v29.7+
- [ ] **Prisma**: Actualizar a v5.18+ (últimas mejoras de performance y nuevas features)
- [ ] **@prisma/client**: Mantener sincronizado con Prisma CLI
- [ ] **nodemon**: Actualizar a v3.1+
- [ ] **ts-node**: Actualizar a v10.9+ con mejores optimizaciones
- [ ] **tsconfig-paths**: Actualizar a v4.2+
- [ ] **standard-version**: Actualizar a v9.5+
- [ ] **VERIFICAR**: Cero dependencias de ESLint en todos los proyectos generados
- [ ] **VERIFICAR**: Cero dependencias de Prettier en todos los proyectos generados
- [ ] **VERIFICAR**: `@biomejs/biome` se incluye correctamente en todos los templates

#### 4.2 Dependencias de Producción - Express Templates
- [ ] **Express**: Actualizar a v4.19+ (últimas mejoras de seguridad)
- [ ] **cors**: Actualizar a v2.8.5+ 
- [ ] **http-errors**: Actualizar a v2.0+
- [ ] **debug**: Actualizar a v4.3.6+
- [ ] **swagger-ui-express**: Actualizar a v5.0+
- [ ] **zod**: Actualizar a v3.23+ (validación de schemas)
- [ ] **@types/express**: Actualizar a v4.17.21+
- [ ] **@types/cors**: Actualizar a v2.8.17+
- [ ] **@types/swagger-ui-express**: Actualizar a v4.1.6+

#### 4.3 Dependencias de Producción - Fastify Templates  
- [ ] **Fastify**: Actualizar a v4.28+ (mejor performance, nuevas features)
- [ ] **@fastify/swagger**: Actualizar a v8.15+
- [ ] **@fastify/swagger-ui**: Actualizar a v4.0+
- [ ] **@fastify/cors**: Actualizar a v9.0+
- [ ] **fastify-type-provider-zod**: Actualizar a v2.0+ (mejor integración TypeScript)

#### 4.4 Dependencias GraphQL (Cuando aplique)
- [ ] **@apollo/server**: Actualizar a v4.11+ (mejor performance, nuevas features)
- [ ] **graphql**: Actualizar a v16.9+
- [ ] **type-graphql**: Actualizar a v2.0.0-rc.2+ (soporte mejorado para decoradores)
- [ ] **reflect-metadata**: Actualizar a v0.2+
- [ ] **class-validator**: Actualizar a v0.14+
- [ ] **@as-integrations/fastify**: Para proyectos Fastify + GraphQL

#### 4.5 Dependencias de Base de Datos
- [ ] **PostgreSQL**: 
  - [ ] **pg**: Actualizar a v8.12+
  - [ ] **@types/pg**: Actualizar versión compatible
- [ ] **MongoDB**:
  - [ ] **mongodb**: Actualizar a v6.8+ (driver nativo)
- [ ] **MySQL**:
  - [ ] **mysql2**: Actualizar a versión más reciente
- [ ] **SQLite**:
  - [ ] **sqlite3**: Actualizar versión
- [ ] **SQL Server**:
  - [ ] **tedious**: Actualizar versión

#### 4.6 Modernización de Templates de Código

##### 4.6.1 TypeScript Configuration Templates
- [ ] **tsconfig.json**: Actualizar para TypeScript 5.5+
  - [ ] Habilitar `"moduleResolution": "bundler"` donde sea apropiado
  - [ ] Actualizar `"target": "ES2022"` o superior
  - [ ] Habilitar `"allowImportingTsExtensions"` para mejor DX
  - [ ] Configurar `"verbatimModuleSyntax"` para mejor tree-shaking

##### 4.6.2 Prisma Schema Templates
- [ ] **Prisma Schema**: Actualizar sintaxis para v5.18+
  - [ ] Usar nuevos tipos de datos disponibles
  - [ ] Implementar nuevas features de relaciones
  - [ ] Optimizar generación de cliente

##### 4.6.3 Jest Configuration Templates
- [ ] **jest.config.ts**: Modernizar para Jest v29.7+
  - [ ] Configurar `extensionsToTreatAsEsm` para mejor soporte ESM
  - [ ] Actualizar preset de ts-jest
  - [ ] Optimizar configuración de transformers

##### 4.6.4 Docker Templates
- [ ] **Dockerfile**: Actualizar imagen base de Node.js
  - [ ] Usar `node:20-alpine` como base (estándar)
  - [ ] Considerar `node:22-alpine` para proyectos que quieran la última versión
  - [ ] Optimizar layers para mejor cache
  - [ ] Implementar mejores prácticas de seguridad

##### 4.6.5 GitHub Actions Templates  
- [ ] **Workflows**: Actualizar para Node.js 20+
  - [ ] Matrix testing con Node.js 20, 22 (foco en LTS)
  - [ ] Usar Node.js 20 como base estándar
  - [ ] Actualizar actions a versiones v4+
  - [ ] Optimizar cache de dependencies

#### 4.7 Templates de Código Moderno

##### 4.7.1 Express Server Template
- [ ] Implementar mejores prácticas de Express v4.19+
- [ ] Usar nuevas APIs de middleware
- [ ] Mejorar manejo de errores async/await
- [ ] Optimizar configuración de CORS y seguridad

##### 4.7.2 Fastify Server Template  
- [ ] Aprovechar nuevas features de Fastify v4.28+
- [ ] Implementar plugins modernos
- [ ] Optimizar configuración de schemas
- [ ] Mejorar integración con TypeScript

##### 4.7.3 GraphQL Resolvers Template
- [ ] Actualizar para Apollo Server v4.11+
- [ ] Implementar mejores prácticas de type-graphql v2.0+
- [ ] Optimizar configuración de context
- [ ] Mejorar manejo de errores GraphQL

##### 4.7.4 Database Connection Templates
- [ ] **Prisma**: Usar nuevas APIs de v5.18+
- [ ] **MongoDB**: Implementar mejores prácticas del driver v6.8+
- [ ] Optimizar connection pooling
- [ ] Mejorar manejo de transacciones

#### 4.8 Performance y Optimizaciones
- [ ] **Startup Time**: Optimizar tiempo de inicio de aplicaciones
- [ ] **Memory Usage**: Reducir uso de memoria en templates
- [ ] **Bundle Size**: Optimizar dependencias incluidas
- [ ] **Build Time**: Mejorar velocidad de compilación TypeScript

### Fase 5: Mejoras y Modernización
**Prioridad: Baja**

#### 5.1 Características Modernas de Node.js
- [ ] **Usar `fetch` nativo (Node.js 20 nativo)** - reemplazar axios/node-fetch donde sea apropiado
- [ ] **Evaluar `node:test` para testing** - alternativa moderna a Jest para casos simples
- [ ] Aprovechar nuevas APIs de Node.js 20+
- [ ] **Performance improvements** de Node.js 20 (mejor V8, startup más rápido)

#### 5.2 Mejoras de Código
- [ ] Refactorizar funciones para usar sintaxis moderna
- [ ] Mejorar manejo de errores
- [ ] Optimizar performance donde sea posible

#### 5.3 Documentación
- [ ] Actualizar README.md con nuevos requisitos de Node.js 20+
- [ ] Documentar migración de ESLint a Biome
- [ ] Actualizar ejemplos de configuración
- [ ] **Documentar beneficios de Node.js 20** (fetch nativo, mejor performance, etc.)

### Fase 6: Testing y Validación
**Prioridad: Alta**

#### 6.1 Tests de Compatibilidad
- [ ] Probar generación en Node.js 20 (versión mínima)
- [ ] Probar generación en Node.js 22 (última estable)
- [ ] Validar todos los tipos de proyectos generados
- [ ] **Verificar que fetch nativo funciona correctamente**

#### 6.2 Tests de Integración - Biome y Templates Modernos
- [ ] **CRÍTICO**: Verificar que todos los proyectos generados compilen sin errores de Biome
- [ ] **CRÍTICO**: Verificar que `npm run lint` funciona en todos los tipos de proyecto
- [ ] **CRÍTICO**: Verificar que `npm run lint:ci` funciona en CI/CD
- [ ] **CRÍTICO**: Verificar compatibilidad con nuevas versiones de dependencias
- [ ] **CRÍTICO**: Probar que TypeScript 5.5+ funciona correctamente
- [ ] **CRÍTICO**: Verificar que Prisma v5.18+ genera cliente correctamente
- [ ] **CRÍTICO**: Probar Express v4.19+ con nuevos middlewares
- [ ] **CRÍTICO**: Probar Fastify v4.28+ con nuevos plugins
- [ ] **CRÍTICO**: Verificar Apollo Server v4.11+ con type-graphql v2.0+
- [ ] Verificar que todos los tests unitarios pasen con Jest v29.7+
- [ ] Verificar que no hay conflictos entre Biome y nuevas dependencias
- [ ] Probar decoradores de TypeScript en proyectos GraphQL con nuevas versiones
- [ ] Verificar performance de aplicaciones generadas
- [ ] Probar build y startup time optimizados

#### 6.3 Tests de CI/CD
- [ ] Actualizar GitHub Actions para usar Node.js 20+
- [ ] Configurar matrix testing con múltiples versiones de Node.js (20, 22)
- [ ] Validar en diferentes sistemas operativos
- [ ] **Verificar que las optimizaciones de Node.js 20 mejoran el rendimiento de CI**

## Archivos Principales a Modificar

### Core del Generador (Migración Biome) ✅ COMPLETADO
- [x] `package.json` - Engines y dependencias
- [x] **`lib/src/functions/eslint.js` → `lib/src/functions/biome.js`** (RENOMBRADO Y ACTUALIZADO)
- [x] `lib/src/functions/packageJson.js` - Dependencias generadas (remover ESLint, añadir Biome)
- [x] `lib/src/index.js` - Lista de paquetes a instalar (actualizar devPackages)
- [x] `lib/src/functions/index.js` - Actualizar imports
- [x] `lib/src/functions/ghat.js` - GitHub Actions con Biome

### Plantillas (Migración Completa a Biome + Modernización) ✅ BIOME COMPLETADO
- [x] **Todas las variantes funcionando con Biome**
- [x] **Scripts npm actualizados** - lint y lint:ci
- [x] **Configuración biome.json optimizada** 
- [x] **.biomeignore creado** con patrones apropiados
- [x] **Decoradores TypeScript** funcionando en proyectos GraphQL
- [ ] `lib/src/functions/tsconfig.js` - Configuración TypeScript 5.5+
- [ ] `lib/src/functions/tests.js` - Jest v29.7+ configuration
- [ ] `lib/src/functions/docker.js` - Docker con Node.js 20
- [ ] Actualizar todos los templates de código con mejores prácticas y nuevas versiones

### Documentación
- `README.md`
- `CHANGELOG.md`
- Documentación de ejemplos

## Consideraciones Especiales

### Breaking Changes
- **Node.js 16 → 20** es un breaking change significativo
- **Migración completa de ESLint a Biome en todos los proyectos generados**
- **Eliminación de Prettier (incluido en Biome)**
- **Salto de Node.js 18 - directamente a 20** para mejor longevidad
- **Fetch nativo disponible** - puede reemplazar dependencias como axios en algunos casos
- **Actualización masiva de dependencias puede causar breaking changes**:
  - Express v4.19+ puede tener cambios en APIs
  - Fastify v4.28+ puede tener cambios en plugins
  - TypeScript 5.5+ puede ser más estricto en tipos
  - Apollo Server v4.11+ tiene cambios en configuración
  - Prisma v5.18+ puede tener cambios en schema syntax
- Usuarios existentes deberán migrar sus proyectos de ESLint a Biome
- **Templates generados serán significativamente diferentes**

### Compatibilidad hacia Atrás
- Considerar mantener rama legacy para Node.js 16
- **Documentar proceso de migración de ESLint a Biome para usuarios existentes**
- **Proporcionar guía de migración automática o scripts de ayuda**
- **Mantener documentación de la versión anterior disponible**
- **Documentar migración de Node.js 16/18 → 20** con beneficios y pasos

### Testing Extensivo
- Cada tipo de proyecto debe ser probado exhaustivamente con nuevas dependencias
- **Probar compatibilidad entre versiones de dependencias actualizadas**
- **Verificar que templates modernos funcionan en producción**
- Validar en múltiples plataformas (Linux, macOS, Windows)
- Probar con diferentes package managers (npm, yarn, pnpm)
- **Testing de performance con nuevas versiones**
- **Verificar que no hay vulnerabilidades de seguridad**

## Cronograma Sugerido (Actualizado)

1. **Semana 1**: ✅ **Fase 1 - Actualización de Node.js 16 → 20 (COMPLETADA)**
2. **Semana 2**: ✅ **Fase 3 - Migración completa ESLint → Biome (COMPLETADA)**
3. **Semana 3**: Fase 2 - Actualización de dependencias principales  
4. **Semana 4**: Fase 4 - Actualización de dependencias en plantillas para Node.js 20
5. **Semana 5**: Fase 6 - Testing exhaustivo de Biome + Node.js 20 en todos los proyectos
6. **Semana 6**: Fase 5 - Mejoras con características de Node.js 20 y documentación

## Criterios de Éxito

- [x] Todos los tipos de proyectos se generan correctamente
- [x] **Biome funciona perfectamente en todos los proyectos generados**
- [x] **Cero dependencias de ESLint en proyectos generados**
- [x] **Cero dependencias de Prettier en proyectos generados**
- [x] **Scripts de lint funcionan en todos los proyectos**
- [x] **Decoradores de TypeScript funcionan correctamente en proyectos GraphQL**
- [x] **.biomeignore generado correctamente en todos los proyectos**
- [ ] Tests pasan en Node.js 20 y 22
- [ ] Documentación actualizada con guía de migración ESLint→Biome
- [ ] Performance igual o mejor que versión anterior
- [ ] **Aprovechamiento de características nativas de Node.js 20** (fetch, mejor performance)
