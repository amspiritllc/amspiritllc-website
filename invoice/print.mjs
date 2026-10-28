import {CONFIG,cents,total,filename,zelle,payeeMismatch,formatPhone,formatDate} from './model.mjs';
import {dictionaries} from './i18n.mjs';

// Measured Letter pages, generated from memory only. All user values are text nodes.
export async function prepareInvoicePrint(state,lang,printout) {
 await document.fonts.ready;
 const t=key=>dictionaries[lang][key],money=n=>new Intl.NumberFormat(lang==='en'?'en-US':'zh-CN',{style:'currency',currency:'USD'}).format(n/100);
 const el=(tag,text='',className='')=>{const node=document.createElement(tag);node.textContent=text;if(className)node.className=className;return node;};
 const lines=(node,values)=>values.filter(Boolean).forEach(value=>node.append(el('div',value)));
 const section=(title,values)=>{const node=el('section','','print-party');node.append(el('h2',title));lines(node,values);return node;};
 const footerText=(footer,index,count)=>{footer.replaceChildren(el('span',`${state.legalName} · ${t('invoiceLabel')} ${state.invoiceNo}`),el('span',`${t('page')} ${index} ${t('of')} ${count} · ${t('totalDue')} ${money(total(state))}`));};
 printout.replaceChildren();let body,page,footer;const pages=[];
 function next(){
  page=el('section','','print-page');body=el('div','','print-body');footer=el('footer','','print-footer');footerText(footer,'000','000');
  const heading=el('div','','print-heading'),issuer=el('div','','print-issuer');issuer.append(el('div',state.legalName,'print-vendor'));lines(issuer,[state.street,state.cityStateZip,`${formatPhone(state.phone)} · ${state.email}`,state.vendorType==='business'&&state.ein?`EIN ${state.ein}`:'']);
  const doc=el('div','','print-document');doc.append(el('h1',t('invoice')));const meta=el('table','','print-meta');
  for(const [label,value]of [[t('printInvoiceNo'),state.invoiceNo],[t('invoiceDate'),formatDate(state.invoiceDate,lang)],[t('terms'),t('dueUponReceipt')]]){const row=el('tr');row.append(el('td',label),el('td',value));meta.append(row);}
  doc.append(meta);heading.append(issuer,doc);body.append(heading);page.append(body,footer);printout.append(page);pages.push(page);
 }
 const fits=()=>body.getBoundingClientRect().bottom<=footer.getBoundingClientRect().top-12;
 function add(node){body.append(node);if(!fits()){node.remove();next();body.append(node);if(!fits())throw Error('pagination');}}
 next();const parties=el('div','','print-columns');parties.append(section(t('billTo'),[CONFIG.company,...CONFIG.address.split('\n')]),section(t('vendorContact'),[state.vendorType==='business'?state.contact:state.legalName,state.vendorType==='individual'?state.businessName:'',formatPhone(state.phone),state.email]));add(parties);
 if(state.statement){const statement=section(t('statementHeading'),[state.statementDescription,`${t('from')}: ${formatDate(state.from,lang)}`,`${t('to')}: ${formatDate(state.to,lang)}`,`${t('statementCount')}: ${state.statementCount}`,t('statementNote')]);statement.classList.add('print-statement');add(statement);}
 else {
  let table,tbody;
  function newTable(){table=el('table','','print-table');const head=el('thead'),row=el('tr');['#',t('description'),t('qty'),t('printUnitPrice'),t('printAmount')].forEach(label=>{const th=el('th',label);th.scope='col';row.append(th);});head.append(row);tbody=el('tbody');table.append(head,tbody);body.append(table);}
  newTable();state.items.forEach((item,i)=>{
   const row=el('tr'),description=el('td',item.description);if(item.upc)description.append(el('small',`UPC ${item.upc}`,'print-upc'));
   row.append(el('td',String(i+1)),description,el('td',item.qty),el('td',money(cents(item.price))),el('td',money(Number(item.qty)*cents(item.price))));
   tbody.append(row);if(!fits()){row.remove();if(!tbody.children.length)table.remove();next();newTable();tbody.append(row);if(!fits())throw Error('pagination');}
  });
 }
 const below=el('div','','print-below'),note=el('div','','print-note');
 if(!state.statement)note.append(el('p',`${state.items.length} ${t('lineItems')} · ${state.items.reduce((sum,item)=>sum+Number(item.qty),0)} ${t('units')}`,'print-counts'));
 note.append(el('p',t('printResaleNote')));const totals=el('table','','print-totals');
 for(const [label,value,className]of [[t('subtotal'),total(state),''],[t('salesTax'),0,''],[t('totalDue'),total(state),'print-due']]){const row=el('tr','',className);row.append(el('td',label),el('td',money(value)));totals.append(row);}
 below.append(note,totals);add(below);
 const remit=el('section','','print-remit');remit.append(el('h2',`${t('remitPayment')} · ${state.payment==='ach'?'ACH':'Zelle'}`));
 const fields=state.payment==='ach'?[['holder',state.holder],['bank',state.bank],['routing',state.routing],['account',state.account]]:[['recipient',state.recipient],['zelle',zelle(state.zelle)]];
 for(const [key,value]of fields){const cell=el('div');cell.append(el('span',`${t(key)}: `),document.createTextNode(value));remit.append(cell);}
 const mismatch=payeeMismatch(state);if(mismatch)remit.append(el('p',`${t('printNameMismatch')}: ${mismatch}`,'print-name-warning'));add(remit);
 const terms=el('p','','print-terms');terms.append(el('strong',t('vendorTerms')+'. '),document.createTextNode(t('vendorTermsText').replace('{vendor}',state.legalName)));add(terms);
 pages.forEach((p,i)=>footerText(p.querySelector('footer'),i+1,pages.length));
 if(pages.some(p=>p.querySelector('.print-body').getBoundingClientRect().bottom>p.querySelector('footer').getBoundingClientRect().top-12))throw Error('pagination');
 return filename(state);
}
