export const categories=Object.freeze({'consumer-electronics':'Consumer Electronics','computer-accessories':'Computer Accessories','office-products':'Office Products',gaming:'Gaming', 'home-goods':'Home Goods',other:'Other'});
const keys=['id','name','category','description','image','price','available','featured'];
const exactKeys=(o,allowed)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===allowed.length&&Object.keys(o).every(k=>allowed.includes(k));
export function parseCatalog(data){
 if(!exactKeys(data,['schema','generatedAt','items'])||data.schema!=='amspirit-showcase-v1'||typeof data.generatedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(data.generatedAt)||!Number.isFinite(Date.parse(data.generatedAt))||!Array.isArray(data.items)||data.items.length>500)throw new Error('Invalid catalog');
 const ids=new Set();
 for(const p of data.items){
  if(!exactKeys(p,keys)||typeof p.id!=='string'||!/^[a-z0-9-]{1,80}$/.test(p.id)||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>120||!Object.hasOwn(categories,p.category)||typeof p.description!=='string'||p.description.length>200||typeof p.image!=='string'||!/^\/products\/img\/[a-z0-9-]+\.webp$/.test(p.image)||typeof p.available!=='boolean'||(p.price!==null&&(typeof p.price!=='number'||!Number.isFinite(p.price)||p.price<0||p.price>999999.99))||typeof p.featured!=='number'||!Number.isFinite(p.featured)||p.featured<0||p.featured>100)throw new Error('Invalid catalog item');
  ids.add(p.id);
 }
 return data.items;
}
export const hasPrice=p=>p.available&&p.price!==null;
export function selectItems(items,{category='all',query='',sort='featured'}={}){
 const q=query.trim().toLocaleLowerCase('en-US');
 return items.filter(p=>(category==='all'||p.category===category)&&(!q||`${p.name} ${p.description} ${categories[p.category]}`.toLocaleLowerCase('en-US').includes(q))).sort((a,b)=>{
  if(sort==='low'||sort==='high'){if(hasPrice(a)!==hasPrice(b))return hasPrice(a)?-1:1;if(hasPrice(a)&&a.price!==b.price)return sort==='low'?a.price-b.price:b.price-a.price;}
  return b.featured-a.featured||a.name.localeCompare(b.name,'en');
 });
}
export const inquiry=p=>'mailto:sales@amspiritllc.com?subject='+encodeURIComponent('Inquiry: '+p.name);
