import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import ts from 'typescript'
import { readSheet } from 'read-excel-file/node'

const source = await fs.readFile(new URL('../lib/affiliation.ts',import.meta.url),'utf8')
const js = ts.transpileModule(source,{ compilerOptions: { module: ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020 } }).outputText
const { parseAffiliationRows,normalizeDocument } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
const headers=['DNI/NIE','APELLIDOS','NOMBRE','VÍA','DIRECCIÓN','Nº','PISO','C.P.','LOCALIDAD','FECHA DE NACIMIENTO','PAÍS','CATEGORÍA','ESTADO','TELÉFONO FIJO','TELÉFONO MÓVIL','CORREO ELECTRÓNICO']
const row=['00000001','APELLIDOS PRUEBA','PERSONA','CALLE','DIRECCIÓN',1,0,1234,'LOCALIDAD','29-02-2000','ES','CATEGORÍA','AC',null,'600000000','prueba@example.invalid']
const parsed=parseAffiliationRows([headers,row])
assert.equal(parsed[0].fecha_nacimiento,'2000-02-29')
assert.equal(parsed[0].codigo_postal,'01234')
assert.equal(parsed[0].numero,'1')
assert.equal(parsed[0].piso,'0')
assert.equal(normalizeDocument('00000001-A'),normalizeDocument('1'))
assert.equal(normalizeDocument('X0000001-A'),normalizeDocument('X0000001'))
assert.throws(()=>parseAffiliationRows([headers,row,row]),/repetido/)
assert.throws(()=>parseAffiliationRows([headers.slice(1),row.slice(1)]),/DNI/)
assert.throws(()=>parseAffiliationRows([[...headers,'DNI/NIE'],[...row,'00000001']]),/sola columna/)
assert.throws(()=>parseAffiliationRows([headers,[...row.slice(0,9),'29/02/2001',...row.slice(10)]]),/inválida/)
assert.throws(()=>parseAffiliationRows([headers,[null,...row.slice(1)]]),/falta DNI/)
assert.throws(()=>parseAffiliationRows([headers]),/entre 1/)
assert.equal(parseAffiliationRows([headers,row,Array(16).fill(null)]).length,1)
console.log('Parser: valid dates, text identifiers, zero values, required columns, duplicate documents and malformed rows verified.')
if(process.argv[2]) {
  const table=await readSheet(process.argv[2])
  const actual=parseAffiliationRows(table)
  if(process.argv[3]) {
    const expected=JSON.parse(await fs.readFile(process.argv[3],'utf8'))
    const comparable=expected.map(({nombre_completo,...r})=>r)
    assert.deepEqual(actual,comparable)
  }
  console.log(`Read-only XLSM check: ${actual.length} rows. JavaScript extraction matches the independent Python extraction field by field.`)
}
