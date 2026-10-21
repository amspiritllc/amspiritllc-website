import {categories,parseCatalog,selectItems,hasPrice,inquiry} from './catalog-model.mjs';
const grid=document.getElementById('catalog-grid'),count=document.getElementById('result-count'),search=document.getElementById('search'),sort=document.getElementById('sort'),filters=document.getElementById('filters'),empty=document.getElementById('empty');
let items=[],selected='all';
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
const money=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
filters.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.category;render();}));
function render(){
 filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.category===selected));
 const visible=selectItems(items,{category:selected,query:search.value,sort:sort.value});grid.replaceChildren();
 count.textContent=`${visible.length} ${visible.length===1?'item':'items'}${selected!=='all'?' · '+categories[selected]:''}`;empty.hidden=visible.length>0;grid.setAttribute('aria-busy','false');
 for(const p of visible){
  const card=el('article','', 'product-card'),visual=el('div','', 'product-visual'),img=el('img');card.id=p.id;img.src=p.image;img.alt=p.name+' — illustrative sample';if(!p.id.startsWith('sample-'))img.alt=p.name;img.width=600;img.height=450;img.loading='lazy';img.decoding='async';img.addEventListener('error',()=>{img.remove();const placeholder=el('div','', 'image-placeholder');placeholder.append(el('span','Image unavailable'));visual.append(placeholder);},{once:true});visual.append(img);
  const body=el('div','', 'product-body'),category=el('p',categories[p.category],'product-category'),heading=el('h2',p.name),description=el('p',p.description,'product-description'),price=el('p',hasPrice(p)?money.format(p.price):'Currently unavailable',hasPrice(p)?'price':'price unavailable'),link=el('a','Ask about this item','inquiry');link.href=inquiry(p);link.setAttribute('aria-label','Ask about this item: '+p.name);const arrow=el('span','↗','inquiry-arrow');arrow.setAttribute('aria-hidden','true');link.append(arrow);body.append(category,heading,description,price,link);card.append(visual,body);grid.append(card);
 }
 let structured=document.getElementById('catalog-structured-data');if(!structured){structured=document.createElement('script');structured.id='catalog-structured-data';structured.type='application/ld+json';document.head.append(structured);}
 structured.textContent=JSON.stringify({'@context':'https://schema.org','@type':'ItemList',itemListElement:visible.map((p,i)=>({'@type':'ListItem',position:i+1,item:{'@type':'Product','@id':'https://www.amspiritllc.com/products/#'+p.id,name:p.name,description:p.description,image:'https://www.amspiritllc.com'+p.image}}))}).replaceAll('<','\\u003c');
}
search.addEventListener('input',render);sort.addEventListener('change',render);document.getElementById('reset').addEventListener('click',()=>{selected='all';search.value='';sort.value='featured';render();search.focus();});
try{
 const response=await fetch('/products/products.json',{credentials:'omit',cache:'no-store'});if(!response.ok)throw new Error('Catalog unavailable');items=parseCatalog(await response.json());
 const param=new URLSearchParams(location.search).get('category');if(Object.hasOwn(categories,param))selected=param;
 document.getElementById('sample-notice').textContent=items.length&&items.every(p=>p.id.startsWith('sample-'))?'Preview catalog · Fictional sample items and prices for design review. Not offers for sale.':'Prices and availability may change. Please contact us to confirm product details.';render();
}catch{count.textContent='Collection unavailable';grid.setAttribute('aria-busy','false');document.getElementById('sample-notice').textContent='The collection is unavailable right now. Please contact our sales team.';document.getElementById('catalog-error').hidden=false;filters.hidden=true;search.disabled=true;sort.disabled=true;}
