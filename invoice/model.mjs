// Pure invoice rules. No persistence, network, or floating-point money arithmetic.
export const CONFIG = Object.freeze({company:'AMSpirit LLC', address:'106 N Denton Tap Road, STE 210-#302\nCoppell, TX 75019', email:'thatday.mitbbs@gmail.com'});
export function cents(value) {
  const s=String(value).trim();
  if(!/^\d{1,9}(\.\d{1,2})?$/.test(s)) return null;
  const [whole, fraction='']=s.split('.');
  return Number(whole)*100+Number(fraction.padEnd(2,'0'));
}
export const integer = value => /^\d{1,6}$/.test(String(value)) && Number(value)>=1;
export const email = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export function routing(value) {
  return /^\d{9}$/.test(value) && !/^0+$/.test(value) &&
    [0,1,2,3,4,5,6,7,8].reduce((sum,i)=>sum+Number(value[i])*[3,7,1][i%3],0)%10===0;
}
export function zelle(value) {
  return email(value) ? value.toLowerCase() : /^\d{10}$/.test(value.replace(/[ ()+.-]/g,'')) ? value.replace(/[ ()+.-]/g,'') : null;
}
export function dateValid(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10)===s; }
export function today(d=new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function invoiceNumber(name, date=today()) {
  const initials=name.trim().split(/\s+/).filter(Boolean).map(p=>Array.from(p)[0]).join('').slice(0,12)||'INV';
  return `${initials.toUpperCase()}-${date.replaceAll('-','')}-01`;
}
export function total(state) {
  if(state.statement) return cents(state.statementTotal)??0;
  return state.items.reduce((sum,row)=>sum+(integer(row.qty)?Number(row.qty):0)*(cents(row.price)??0),0);
}
export function validate(s) {
  const errors=[]; const add=(field,key)=>errors.push({field,key});
  const required=['legalName','street','cityStateZip','phone','email','invoiceNo','invoiceDate','signature','signatureDate'];
  if(s.vendorType==='business') required.push('contact','title');
  if(!['individual','business'].includes(s.vendorType)) add('vendorType','required');
  if(!['ach','zelle'].includes(s.payment)) add('payment','required');
  required.forEach(k=>{if(!String(s[k]??'').trim())add(k,'required');});
  if(s.email&&!email(s.email))add('email','emailInvalid');
  if(s.phone && !/^[+\d ()-]{7,30}$/.test(s.phone))add('phone','phoneInvalid');
  if(s.vendorType==='business'&&s.ein&&!/^\d{2}-\d{7}$/.test(s.ein))add('ein','einInvalid');
  ['invoiceDate','signatureDate'].forEach(k=>{if(s[k]&&!dateValid(s[k]))add(k,'dateInvalid');});
  if(s.statement) {
    ['statementDescription','statementTotal','from','to','statementCount'].forEach(k=>{if(!String(s[k]??'').trim())add(k,'required');});
    if(!cents(s.statementTotal))add('statementTotal','moneyInvalid');
    if(!integer(s.statementCount))add('statementCount','quantityInvalid');
    ['from','to'].forEach(k=>{if(!dateValid(s[k]))add(k,'dateInvalid');});
    if(s.from>s.to)add('to','dateOrder');
  } else {
    if(!s.items.length||s.items.length>200)add('items','rowLimit');
    s.items.forEach((r,i)=>{
      if(!r.description.trim()||r.description.length>160)add(`item-${i}-description`,'descriptionInvalid');
      if(!integer(r.qty))add(`item-${i}-qty`,'quantityInvalid');
      if(!cents(r.price))add(`item-${i}-price`,'moneyInvalid');
    });
  }
  if(!Number.isSafeInteger(total(s))||total(s)<=0||total(s)>99999999999)add(s.statement?'statementTotal':'items','totalInvalid');
  if(s.payment==='ach') {
    ['holder','bank','routing','account','accountConfirm'].forEach(k=>{if(!s[k]?.trim())add(k,'required');});
    if(!routing(s.routing??''))add('routing','routingInvalid');
    if(!/^\d{4,17}$/.test(s.account??''))add('account','accountInvalid');
    if(s.account!==s.accountConfirm)add('accountConfirm','matchInvalid');
  } else {
    if(total(s)>50000)add('payment','zelleLimit');
    if(!s.recipient?.trim())add('recipient','required');
    if(!zelle(s.zelle??''))add('zelle','zelleInvalid');
    if(!zelle(s.zelleConfirm??'')||zelle(s.zelle)!==zelle(s.zelleConfirm))add('zelleConfirm','matchInvalid');
  }
  if(!s.certified)add('certified','certRequired');
  return errors;
}
export function filename(s) {return `AMSpirit-Invoice-${s.legalName}-${s.invoiceNo}`.replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-').slice(0,160);}
