import test from 'node:test';
import assert from 'node:assert/strict';
import {cents,total,routing,validate,invoiceNumber,zelle,dateValid,filename,payeeMismatch,formatPhone,formatDate} from './model.mjs';
import {dictionaries} from './i18n.mjs';
const valid=()=>({vendorType:'individual',legalName:'Sample Vendor',street:'100 Example Street',cityStateZip:'Example TX 75000',phone:'5551234567',email:'vendor@example.com',invoiceNo:'SV-20261021-01',invoiceDate:'2026-10-21',signature:'Sample Vendor',signatureDate:'2026-10-21',items:[{description:'Sample item',qty:'3',price:'0.10'}],payment:'ach',holder:'Sample Vendor',bank:'Example Bank',routing:'021000021',account:'12345678',accountConfirm:'12345678',certified:true});
test('money is exact integer cents',()=>{assert.equal(cents('0.10'),10);assert.equal(total(valid()),30);for(const s of ['1.001','-1','1e2','NaN',''])assert.equal(cents(s),null);});
test('valid individual and business require confirmation but no signature fields',()=>{const s=valid();delete s.signature;delete s.signatureDate;assert.deepEqual(validate(s),[]);assert.deepEqual(validate({...s,vendorType:'business',contact:'Sample Person'}),[]);assert.ok(validate({...s,certified:false}).some(e=>e.key==='certRequired'));});
test('invalid bank, missing field, mismatch, zero quantity block',()=>{for(const patch of [{routing:'021000022'},{legalName:''},{accountConfirm:'99999'},{items:[{description:'Item',qty:'0',price:'1'}]}])assert.ok(validate({...valid(),...patch}).length);assert.equal(routing('000000000'),false);});
test('Zelle limit and confirmation',()=>{const s={...valid(),payment:'zelle',recipient:'Sample Vendor',zelle:'test@example.com',zelleConfirm:'test@example.com',items:[{description:'Item',qty:'1',price:'305'}]};assert.deepEqual(validate(s),[]);s.items[0].price='600';assert.ok(validate(s).some(e=>e.key==='zelleLimit'));assert.equal(zelle('(555) 123-4567'),'5551234567');});
test('statement mode dates and positive total',()=>{const s={...valid(),statement:true,statementDescription:'Statement',statementTotal:'45.67',from:'2026-10-01',to:'2026-10-21',statementCount:'3'};assert.equal(total(s),4567);assert.deepEqual(validate(s),[]);s.to='2026-09-01';assert.ok(validate(s).some(e=>e.key==='dateOrder'));});
test('200 row limit',()=>{const s=valid();s.items=Array.from({length:200},()=>({...s.items[0]}));assert.deepEqual(validate(s),[]);s.items.push(s.items[0]);assert.ok(validate(s).some(e=>e.key==='rowLimit'));});
test('safe filenames, initials and dates',()=>{assert.equal(invoiceNumber('Jane Doe','2026-10-21'),'JD-20261021-01');assert.equal(dateValid('2026-02-30'),false);assert.ok(!filename({...valid(),legalName:'A/B:C'}).includes('/'));});
test('Zelle optional US country prefix normalizes for confirmation',()=>{
 for(const value of ['5551234567','(555) 123-4567','1 555 123 4567','+1 555 123 4567'])assert.equal(zelle(value),'5551234567');
 for(const value of ['25551234567','+44 555 123 4567','555123456','155512345678','+1 555 123 ABCD'])assert.equal(zelle(value),null);
 assert.equal(zelle('Vendor@Example.com'),'vendor@example.com');
 assert.deepEqual(validate({...valid(),payment:'zelle',recipient:'Sample Vendor',zelle:'+1 555 123 4567',zelleConfirm:'(555) 123-4567'}),[]);
});
test('payee mismatch is shared by screen/PDF and never blocks payment validation',()=>{
 assert.equal(payeeMismatch({...valid(),holder:' sample VENDOR '}),null);
 assert.equal(payeeMismatch({...valid(),holder:'Different Name'}),'Different Name');
 assert.deepEqual(validate({...valid(),holder:'Different Name'}),[]);
 assert.equal(payeeMismatch({...valid(),holder:'Sample Vendor, Inc.'}),'Sample Vendor, Inc.');
 assert.equal(payeeMismatch({...valid(),payment:'zelle',recipient:'Alternate Payee'}),'Alternate Payee');
 assert.equal(payeeMismatch({...valid(),holder:''}),null);
 assert.equal(payeeMismatch({...valid(),legalName:'Sample Trading LLC',holder:'  SAMPLE   Trading, LLC. '}),null);
 assert.equal(payeeMismatch({...valid(),legalName:'O’Brien LLC',holder:"O'Brien LLC"}),null);
 assert.equal(payeeMismatch({...valid(),legalName:'Sample Trading LLC',holder:'Sample Trading Inc.'}),'Sample Trading Inc.');
});
test('optional UPC preserves leading zeros and rejects malformed values',()=>{
 for(const upc of [undefined,'','012345678905','01234565'])assert.deepEqual(validate({...valid(),items:[{...valid().items[0],upc}]}),[]);
 for(const upc of ['1e11','01234567890','<script>'])assert.ok(validate({...valid(),items:[{...valid().items[0],upc}]}).some(e=>e.field==='item-0-upc'));
});
test('printed phone and date formatting is stable',()=>{assert.equal(formatPhone('+1 555 123 4567'),'(555) 123-4567');assert.equal(formatDate('2026-10-21'),'Oct 21, 2026');assert.equal(formatDate('2026-10-21','zh'),'2026年10月21日');});
test('new print labels have bilingual parity',()=>{for(const key of ['upc','upcInvalid','description','printUnitPrice','printAmount','invoiceLabel','printInvoiceNo','terms','dueUponReceipt','vendorContact','lineItems','subtotal','remitPayment','vendorTerms','vendorTermsText','printResaleNote'])for(const lang of ['en','zh'])assert.ok(dictionaries[lang][key]);});
test('Chinese certification and PDF labels match requested bilingual wording',()=>{
 for(const key of ['certIndividual','certBusiness'])assert.equal(dictionaries.zh[key][1],'本发票及所附对账单（如有）中的商品、数量和金额真实且完整。');
 assert.equal(dictionaries.en.statementHeading,'Detailed statement attached');assert.equal(dictionaries.zh.statementHeading,'附详细对账单');
 for(const lang of ['en','zh'])for(const key of ['printRows','printUnits','printNameMismatch'])assert.ok(dictionaries[lang][key]);
});
