import {CONFIG,cents,integer,total,validate,today,invoiceNumber,payeeMismatch} from './model.mjs';
import {dictionaries} from './i18n.mjs';
import {prepareInvoicePrint} from './print.mjs';
let lang='en', dirty=false, manualNumber=false, showErrors=false;
const blank=()=>({vendorType:'individual',legalName:'',businessName:'',contact:'',ein:'',street:'',cityStateZip:'',phone:'',email:'',invoiceNo:invoiceNumber(''),invoiceDate:today(),statement:false,statementDescription:dictionaries[lang].statementDefault,statementTotal:'',from:'',to:'',statementCount:'',items:[{description:'',upc:'',qty:'',price:''}],payment:'ach',holder:'',bank:'',routing:'',account:'',accountConfirm:'',recipient:'',zelle:'',zelleConfirm:'',certified:false});
let state=blank();
const root=document.querySelector('#app'), printout=document.querySelector('#printout');
const t=key=>dictionaries[lang][key]??key;
const money=n=>new Intl.NumberFormat(lang==='en'?'en-US':'zh-CN',{style:'currency',currency:'USD'}).format(n/100);
function el(tag,text='',props={}) {const e=document.createElement(tag);e.textContent=text;for(const [k,v] of Object.entries(props))e.setAttribute(k,String(v));return e;}
// Vendor sends the PDF themselves; mailto carries only our address and the invoice number, never form data.
function mailSubject(){return encodeURIComponent(`${t('emailSubject')} ${state.invoiceNo||''}`.trim());}
function mailtoHref(){return `mailto:${CONFIG.email}?subject=${mailSubject()}`;}
// mailto does nothing on computers without a desktop mail app, so webmail compose links and a copy button are offered too.
function gmailHref(){return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONFIG.email)}&su=${mailSubject()}`;}
function outlookHref(){return `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(CONFIG.email)}&subject=${mailSubject()}`;}
function copyAddress(b){const show=k=>{b.textContent=t(k);setTimeout(()=>{b.textContent=t('copyAddress');},3000);};const select=()=>{const r=document.createRange();r.selectNodeContents(document.getElementById('email-address'));const sel=getSelection();sel.removeAllRanges();sel.addRange(r);show('copyManual');};if(navigator.clipboard?.writeText)navigator.clipboard.writeText(CONFIG.email).then(()=>show('copied'),select);else select();}
function button(text,fn,props={}) {const b=el('button',text,{type:'button',...props});b.addEventListener('click',fn);return b;}
function field(key,label=key,help='',required=true,options={}) {
 const box=el('div','',{class:'field'}), l=el('label',t(label)+(required?' *':''),{for:key});
 const input=el('input','',{id:key,name:key,autocomplete:'off',maxlength:options.maxlength??120,...options});
 input.value=state[key]??''; if(required)input.setAttribute('aria-required','true');
 input.setAttribute('aria-describedby',`${key}-help ${key}-error`);
 input.addEventListener('input',()=>change(key,input.value));
 box.append(l,input,el('span',help?t(help):'',{id:`${key}-help`,class:'help'}),el('span','',{id:`${key}-error`,class:'error'}));return box;
}
function grid(...fields){const g=el('div','',{class:'grid'});g.append(...fields);return g;}
function card(step,key){const c=el('section','',{class:'card'}), h=el('h2');h.append(el('span',step,{class:'step','aria-hidden':'true'}),document.createTextNode(t(key)));c.append(h);root.append(c);return c;}
function choices(key,values){const fs=el('fieldset','',{id:key}),legend=el('legend',t(key));fs.append(legend);const group=el('div','',{class:'choices'});values.forEach(([value,label])=>{const l=el('label'),i=el('input','',{type:'radio',name:key,value,id:`${key}-${value}`});i.checked=state[key]===value;i.addEventListener('change',()=>{state[key]=value;dirty=true;if(key==='vendorType')autofill();render();});l.append(i,document.createTextNode(t(label)));group.append(l);});fs.append(group);return fs;}
function checkbox(key,label,fn){const wrap=el('div','',{class:'check'}), i=el('input','',{type:'checkbox',id:key,name:key});i.checked=state[key];i.addEventListener('change',()=>{state[key]=i.checked;dirty=true;fn();});wrap.append(i,el('label',t(label),{for:key}));return wrap;}
function autofill(){if(!manualNumber)state.invoiceNo=invoiceNumber(state.legalName);const input=document.getElementById('invoiceNo');if(input)input.value=state.invoiceNo;}
function change(key,value){state[key]=value;dirty=true;if(key==='invoiceNo')manualNumber=true;if(key==='legalName'||key==='contact')autofill();update();}
function render(){
 root.replaceChildren();document.documentElement.lang=lang==='en'?'en':'zh-CN';document.title=t('pageTitle');
 document.getElementById('home-link').textContent=t('home');
 document.querySelectorAll('[data-language]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.language===lang));
 root.append(el('h1',t('heading')));const intro=el('p',t('intro')+' ');intro.append(el('a',CONFIG.email,{href:`mailto:${CONFIG.email}`}));root.append(intro,el('p',t('requiredNote'),{class:'sub'}));
 const how=el('section','',{class:'card howto'});const steps=el('ol');for(const s of t('howSteps'))steps.append(el('li',s.replace('{email}',CONFIG.email)));how.append(el('h2',t('howHeading')),steps);root.append(how);
 const bill=el('section','',{class:'card'});bill.append(el('h2',`${t('billTo')} · ${t('readOnly')}`),el('div',`${CONFIG.company}\n${CONFIG.address}`,{class:'bill'}));root.append(bill);
 const from=card('1','fromHeading');from.append(choices('vendorType',[['individual','individual'],['business','business']]));
 const fs=[field('legalName',state.vendorType==='business'?'businessLegalName':'legalName','nameHelp')];
 if(state.vendorType==='business')fs.push(field('contact','contact','contactHelp'),field('ein','ein','einHelp',false,{maxlength:10}));else fs.push(field('businessName','businessName','',false));
 fs.push(field('street','street','addressHelp'),field('cityStateZip','cityStateZip','addressHelp'),field('phone','phone','phoneHelp',true,{type:'tel',maxlength:30}),field('email','email','emailHelp',true,{type:'email'}));from.append(grid(...fs));
 const invoice=card('2','invoiceHeading');invoice.append(el('p',t('claim'),{class:'claim'}),grid(field('invoiceNo','invoiceNo','numberHelp',true,{maxlength:60}),field('invoiceDate','invoiceDate','dateHelp',true,{type:'date'})));
 const items=card('3','itemsHeading');items.append(checkbox('statement','statement',render),el('p',t('statementHelp'),{class:'help'}));
 if(state.statement){items.append(grid(field('statementDescription','statementDescription','',true,{maxlength:160}),field('statementTotal','statementTotal','',true,{inputmode:'decimal'}),field('from','from','',true,{type:'date'}),field('to','to','',true,{type:'date'}),field('statementCount','statementCount','',true,{inputmode:'numeric'})),el('p',t('statementNote'),{class:'note'}));}
 else {
 const table=el('table','',{class:'items-table',id:'items','aria-label':t('itemsHeading')}),head=el('thead'),hr=el('tr');['#',t('item')+' *',t('qty')+' *',t('unitPrice')+' *',t('amount'),''].forEach(s=>hr.append(el('th',s,{scope:'col'})));head.append(hr);table.append(head);const body=el('tbody'),example=el('tr','',{class:'example'});['—',t('example'),'1','25.00','25.00',t('notCounted')].forEach(s=>example.append(el('td',s)));body.append(example);
 state.items.forEach((row,i)=>{const tr=el('tr');tr.append(el('td',String(i+1)));for(const [k,label] of [['description','item'],['qty','qty'],['price','unitPrice']]){const id=`item-${i}-${k}`,td=el('td'),f=field(id,label,'',true,{maxlength:k==='description'?160:k==='qty'?6:12,inputmode:k==='description'?'text':k==='qty'?'numeric':'decimal'}),input=f.querySelector('input');input.value=row[k];input.addEventListener('input',()=>{state.items[i][k]=input.value;delete state[id];update();});td.append(f);if(k==='description'){const upcId=`item-${i}-upc`,upc=field(upcId,'upc','',false,{maxlength:12,inputmode:'numeric'}),input=upc.querySelector('input');upc.classList.add('item-upc');input.value=row.upc??'';input.addEventListener('input',()=>{state.items[i].upc=input.value;delete state[upcId];update();});td.append(upc);}tr.append(td);}tr.append(el('td','',{class:'money',id:`amount-${i}`,'data-label':t('amount')}));const td=el('td');td.append(button(t('remove'),()=>{state.items.splice(i,1);dirty=true;render();},{'aria-label':`${t('remove')} ${i+1}`}));tr.append(td);body.append(tr);});table.append(body);items.append(table,button(t('addRow'),()=>{if(state.items.length>=200){document.getElementById('row-limit').textContent=t('rowLimit');return;}state.items.push({description:'',upc:'',qty:'',price:''});dirty=true;render();document.getElementById(`item-${state.items.length-1}-description`).focus();},{id:'add-row'}),el('p','',{id:'row-limit',class:'error','aria-live':'polite'}),el('p','',{id:'counts',class:'help'}));
 }
 const totals=el('div','',{class:'totals'}),tax=el('p',t('salesTax'));tax.append(el('span',money(0)));const due=el('p',t('totalDue'),{class:'total'});due.append(el('span','',{id:'total'}));totals.append(tax,due);items.append(totals,el('p',t('taxNote'),{class:'help'}));
 const pay=card('4','paymentHeading');pay.append(choices('payment',[['ach','ach'],['zelle','zelleChoice']]),el('p','',{id:'zelle-limit',class:'note'}));const payFields=el('div','',{id:'payment-fields'});pay.append(payFields);renderPayment();pay.append(el('p','',{id:'name-warning',class:'note',hidden:true}),el('p',t('privacy'),{class:'privacy'}),el('p',t('paymentNote'),{class:'note'}));
 const confirm=card('5','confirmHeading'),cert=el('div','',{class:'cert'});cert.append(checkbox('certified','certified',update));cert.querySelector('label').append(el('span',' *',{class:'req'}));const list=el('ol');t(state.vendorType==='business'?'certBusiness':'certIndividual').forEach(s=>list.append(el('li',s)));cert.append(list,el('p',t('certNote'),{id:'cert-note',class:'cert-note'}));confirm.append(cert);
 confirm.append(el('div','',{id:'validation',class:'summary','aria-live':'polite'}),el('p',t('printHelp'),{class:'help'}));const actions=el('div','',{class:'actions'});actions.append(button(t('clear'),()=>{if(window.confirm(t('clearConfirm')))reset();}),button(t('download'),download,{id:'download',class:'primary','aria-disabled':'true'}));confirm.append(actions,el('p','',{id:'download-hint',class:'download-hint','aria-live':'polite'}),el('p','',{id:'download-status','aria-live':'polite'}));
 const box=el('div','',{class:'email-box'}),to=el('p',t('emailTo')+' ',{class:'email-to'});to.append(el('strong',CONFIG.email,{id:'email-address'}));const copy=button(t('copyAddress'),()=>copyAddress(copy),{id:'copy-email'});to.append(' ',copy);
 const link=(id,label,href)=>{const a=el('a',label,{id,class:'button',href:href(),target:'_blank',rel:'noopener'});a.addEventListener('click',()=>{a.href=href();});return a;};
 const mail=link('email-us',t('emailUs'),mailtoHref);mail.removeAttribute('target');mail.removeAttribute('rel');const links=el('div','',{class:'actions'});links.append(link('email-gmail',t('emailGmail'),gmailHref),link('email-outlook',t('emailOutlook'),outlookHref),mail);
 box.append(el('h3',t('emailHeading')),to,links,el('p',t('emailHelp2'),{class:'help'}));confirm.append(box);update();
}
function renderPayment(){const fields=document.getElementById('payment-fields');fields.replaceChildren(state.payment==='ach'?grid(field('holder','holder','holderHelp'),field('bank'),field('routing','routing','routingHelp',true,{inputmode:'numeric',maxlength:9}),field('account','account','accountHelp',true,{type:'password',inputmode:'numeric',maxlength:17}),field('accountConfirm','accountConfirm','accountHelp',true,{type:'password',inputmode:'numeric',maxlength:17})):grid(field('recipient','recipient','holderHelp'),field('zelle','zelle','zelleHelp'),field('zelleConfirm','zelleConfirm','zelleHelp')));}
function update(){
 const n=total(state);document.getElementById('total').textContent=money(n);state.items.forEach((r,i)=>{const a=document.getElementById(`amount-${i}`);if(a)a.textContent=money((integer(r.qty)?Number(r.qty):0)*(cents(r.price)??0));});
 const count=document.getElementById('counts');if(count)count.textContent=`${state.items.length} ${t('rows')} · ${state.items.reduce((s,r)=>s+(integer(r.qty)?Number(r.qty):0),0)} ${t('units')}`;
 const z=document.getElementById('payment-zelle');z.disabled=n>50000;document.getElementById('zelle-limit').textContent=t(n>50000?'zelleLimit':'zelleWithin');
 if(n>50000&&state.payment==='zelle'){state.payment='ach';document.getElementById('payment-ach').checked=true;z.checked=false;renderPayment();}
 const warning=document.getElementById('name-warning');warning.hidden=!payeeMismatch(state);warning.textContent=t('nameMismatch');
 const errors=validate(state);document.getElementById('download').setAttribute('aria-disabled',errors.length>0);
 // Tell the vendor why no PDF appears: the confirmation is required, then any other field errors.
 const missingCert=!state.certified,hint=document.getElementById('download-hint');if(hint)hint.textContent=missingCert?t('downloadNeedsConfirm'):errors.length?t(showErrors?'downloadNeedsFix':'downloadNeedsFields'):'';
 document.querySelector('.cert')?.classList.toggle('missing',missingCert&&showErrors);document.getElementById('cert-note')?.classList.toggle('missing',missingCert&&showErrors);
 document.querySelectorAll('[aria-invalid]').forEach(i=>i.removeAttribute('aria-invalid'));document.querySelectorAll('.field .error').forEach(e=>e.textContent='');
 const summary=document.getElementById('validation');summary.replaceChildren();
 if(showErrors&&errors.length){summary.append(el('p',t('errorHeading')));const ul=el('ul');for(const e of errors){const input=document.getElementById(e.field),error=document.getElementById(`${e.field}-error`);if(input)input.setAttribute('aria-invalid','true');if(error)error.textContent=t(e.key);const label=input?.closest('.field')?.querySelector('label')?.textContent??t(e.field==='items'?'itemsHeading':e.field);const a=el('a',`${label}: ${t(e.key)}`,{href:`#${e.field}`});a.addEventListener('click',ev=>{ev.preventDefault();focusField(e.field);});const li=el('li');li.append(a);ul.append(li);}summary.append(ul);}
}
function focusField(key){const e=document.getElementById(key);if(!e)return;if(!e.matches('input,button,select'))e.setAttribute('tabindex','-1');e.focus();e.scrollIntoView({block:'center',behavior:'instant'});}
function reset(){state=blank();dirty=manualNumber=showErrors=false;printout.replaceChildren();render();}
const preparePrint=()=>prepareInvoicePrint(state,lang,printout);
async function download(){showErrors=true;update();const errors=validate(state);if(errors.length){focusField(errors[0].field);return;}try{const name=await preparePrint();document.title=name;document.getElementById('download-status').textContent=`${t('saveAs')}: ${name}.pdf. ${t('afterDownload')} ${CONFIG.email}.`;window.print();}catch{document.getElementById('download-status').textContent=t('printFailure');}}
document.querySelectorAll('[data-language]').forEach(b=>b.addEventListener('click',()=>{const oldDefault=t('statementDefault');lang=b.dataset.language;if(state.statementDescription===oldDefault)state.statementDescription=t('statementDefault');render();}));
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
window.addEventListener('pagehide',()=>{state=blank();printout.replaceChildren();root.replaceChildren();dirty=false;});
window.addEventListener('pageshow',e=>{if(e.persisted)reset();});
render();
