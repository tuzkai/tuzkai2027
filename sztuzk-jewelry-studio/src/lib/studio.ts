import { useEffect, useState } from 'react';

export type Project = { id:string; type:string; title:string; timestamp:string; content:unknown };
export type Context = { name?:string; ideaName?:string; type?:string; style?:string; color?:string; material?:string; materials?:string; occasion?:string; size?:string; skill?:string; price?:number; currency?:string; target?:string; preferredTypes?:string[]; businessTypes?:string[]; businessStyle?:string; businessBudget?:string; channel?:string; experience?:string; goal?:string; handoff?:'idea'|'business'|'design'|'pricing' };
const prefix='sztuzk-v1-';
export function useStored<T>(key:string, initial:T):[T,(value:T|((old:T)=>T))=>void] {
  const [value,setValue]=useState<T>(()=>{try{const raw=localStorage.getItem(prefix+key);return raw?JSON.parse(raw):initial}catch{return initial}});
  useEffect(()=>{try{localStorage.setItem(prefix+key,JSON.stringify(value))}catch{}},[key,value]);
  return [value,setValue];
}
export function readContext():Context {try{return JSON.parse(localStorage.getItem(prefix+'context')||'{}')}catch{return {}}}
export function writeContext(patch:Context){try{localStorage.setItem(prefix+'context',JSON.stringify({...readContext(),...patch}))}catch{}}
export function replaceContext(context:Context){localStorage.setItem(prefix+'context',JSON.stringify(context))}
export function addProject(type:string,title:string,content:unknown){const project:Project={id:crypto.randomUUID(),type,title,timestamp:new Date().toISOString(),content};const list=getProjects();localStorage.setItem(prefix+'projects',JSON.stringify([project,...list]));window.dispatchEvent(new Event('sztuzk-projects'));return project}
export function getProjects():Project[]{try{return JSON.parse(localStorage.getItem(prefix+'projects')||'[]')}catch{return []}}
export function deleteProject(id:string){localStorage.setItem(prefix+'projects',JSON.stringify(getProjects().filter(p=>p.id!==id)));window.dispatchEvent(new Event('sztuzk-projects'))}
export function download(name:string,data:unknown){const blob=new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export function formatResult(title:string,data:unknown){
  const label=(key:string)=>key.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,c=>c.toUpperCase());
  const render=(value:unknown,depth=0):string=>{
    const pad=' '.repeat(depth);
    if(Array.isArray(value)) return value.map((item,i)=>item!==null&&typeof item==='object'
      ?`${pad}${i+1}.\n${render(item,depth+2)}`
      :`${pad}${i+1}. ${String(item)}`).join('\n');
    if(value!==null&&typeof value==='object') return Object.entries(value).map(([key,item])=>item!==null&&typeof item==='object'
      ?`${pad}${label(key)}:\n${render(item,depth+2)}`
      :`${pad}${label(key)}: ${String(item)}`).join('\n');
    return `${pad}${String(value)}`;
  };
  const body=Array.isArray(data)
    ?data.map((item,i)=>`IDEA ${i+1}\n${render(item)}`).join('\n\n--------------------\n\n')
    :data!==null&&typeof data==='object'
      ?Object.entries(data).map(([key,value])=>`${label(key)}\n${render(value)}`).join('\n\n')
      :String(data);
  return `SZTUZK JEWELRY STUDIO\n${title}\n\n${body}\n\nIllustrative draft. Verify costs, details and platform rules before publishing.`;
}
export async function copy(data:unknown){await navigator.clipboard.writeText(typeof data==='string'?data:JSON.stringify(data,null,2))}
export const choose=<T,>(items:T[],seed:number)=>items[((seed%items.length)+items.length)%items.length];
export const hash=(...parts:unknown[])=>JSON.stringify(parts).split('').reduce((h,c)=>((h<<5)-h+c.charCodeAt(0))|0,0)>>>0;
export const typeOptions=['Earrings','Bracelet','Necklace','Ring','Anklet','Pendant','Hair Accessory'];
export const styleOptions=['Minimalist','Luxury','Traditional','Bridal','Modern','Boho','Cute','Statement'];
export const colors=['Gold','Silver','Pearl/White','Pink','Red','Blue','Green','Black','Multicolor'];
export const materials=['Resin','Pearl','Beads','Gemstones','Alloy','Acrylic','Charms','Chain'];
export const occasions=['Everyday','Wedding','Party','Eid','Gift','Office','Casual'];
export const budgets=['Under PKR 500','PKR 500–1,000','PKR 1,000–2,000','PKR 2,000–5,000','PKR 5,000+'];
export const skills=['Beginner','Intermediate','Advanced'];
export const preferredIdeaTypes=(types:string[])=>types.filter(t=>['Earrings','Bracelets','Necklaces'].includes(t));
export const ideaToDesignType=(type:string)=>({Earrings:'Earrings',Bracelets:'Bracelet',Necklaces:'Necklace',Rings:'Ring',Anklets:'Anklet',Pendants:'Pendant'} as Record<string,string>)[type]||'Earrings';
export const ideaToDesignMaterial=(material:string)=>material==='Gemstone'?'Gemstones':material;

// Deterministic demo generation boundary: replace these pure functions with a server-side AI service later.
export function generateJewelryIdea(input:{type:string;style:string;color:string;material:string;skill:string;preferredTypes?:string[];occasion?:string},count:number,variation=0){
  const types=input.type==='All'?(input.preferredTypes?.length?input.preferredTypes:['Earrings','Bracelets','Necklaces','Rings','Anklets','Pendants']):[input.type];
  const adjectives=['Solstice','Lune','Aurelia','Petal','Arc','Celeste','Serein','Dawn','Mira','Tide','Noor','Halo','Muse','Verve','Amara','Line','Isla','Bloom','Gleam','Oria'];
   return Array.from({length:count},(_,i)=>{const seed=hash(input,variation,i);const type=choose(types,i);const color=input.color==='Any'?choose(['Gold','Pearl','Silver','Pink','Blue'],seed):input.color;const mat=input.material==='Mixed'?choose(['Pearl','Resin','Beads','Gemstone','Alloy','Acrylic'],seed>>2):input.material;const name=`${choose(adjectives,(seed+i)%adjectives.length)} ${type}`;return {number:i+1,name,type,style:input.style,color,material:mat,skill:input.skill,occasion:input.occasion||'Everyday',concept:`A ${input.style.toLowerCase()} ${type.toLowerCase()} concept pairing ${mat.toLowerCase()} with ${color.toLowerCase()} accents for a considered, wearable finish.`,materials:`${mat}, compatible findings, finishing components`,colorCombination:`${color} with soft ivory or warm neutral accents`,estimatedMaterialCostRange:'Not available until you enter actual quantities and supplier costs in the pricing calculator.',suggestedRetailPriceRange:'Not available until you calculate from your own material, labor and selling costs.',packagingIdea:'A protective pouch and a simple care note.',photographyIdea:'Photograph against a warm neutral surface in indirect daylight.'}});
}
export function generateJewelryDesign(input:{type:string;style:string;color:string;materials:string[];occasion:string;budget:string;skill:string},variation=0){
  const seed=hash(input,variation);const name=`${choose(['The Lune','The Aurelia','The Solstice','The Mira','The Noor','The Serein'],seed)} ${input.type}`;
  const joined=input.materials.join(', ');
  return {designName:name,designDescription:`A ${input.style.toLowerCase()} ${input.type.toLowerCase()} design for ${input.occasion.toLowerCase()} moments. Layer ${joined.toLowerCase()} with ${input.color.toLowerCase()} detailing for a balanced, handmade finish. This is a demo concept, not a production specification.`,materialsNeeded:`${joined}, suitable findings, finishing tools`,colorCombination:`${input.color} paired with a complementary warm neutral`,approximateDifficulty:input.skill,estimatedMaterialCost:`Illustrative estimate only; your selected budget is ${input.budget}. Enter real costs in the calculator.`,suggestedSellingPriceRange:'Estimate unavailable without actual costs; calculate your own price.',packagingIdea:'Use a protective jewelry pouch, a care card, and recyclable outer packaging.',productPhotographyIdea:'Try indirect window light with a close-up of the details and an image showing scale.',etsyProductTitle:`${name} | ${input.style} Handmade ${input.type} | ${input.occasion} Jewelry`,instagramCaption:`Introducing ${name}: a ${input.style.toLowerCase()} idea in ${input.color.toLowerCase()}. A little inspiration for your next handmade piece.`,type:input.type,style:input.style,color:input.color,materials:joined,occasion:input.occasion};
}
export function generateBusinessPlan(input:{types:string[];style:string;budget:string;channel:string;experience:string;customer:string;goal:string}){
  const beginner=['Complete Beginner','Beginner'].includes(input.experience);
  const style=input.style;
  const material=input.types.includes('Resin Jewelry')?'Resin':input.style==='Luxury'?'Pearl':'Mixed';
  const occasion=input.types.includes('Bridal Jewelry')||input.customer==='Brides'?'Wedding':'Everyday';
  const skill=beginner?'Beginner':input.experience==='Some Experience'?'Intermediate':'Advanced';
  const niche=`${beginner?'Beginner-friendly ':''}${style.toLowerCase()} ${input.types.join(' & ')} for ${input.customer.toLowerCase()}`;
  const budgetApproach=input.budget==='Under PKR 10,000'
    ?'Start with 2–3 simple sample designs, buy small test quantities and reserve part of your budget for findings, packaging and platform fees. Confirm supplier prices before committing to a batch.'
    :`Within ${input.budget}, prototype a few designs before buying larger quantities. Allocate for materials, tools, packaging and selling fees using actual quotes.`;
  const channelPlan=input.channel==='Etsy'
    ?'For Etsy, check seller eligibility, current fees, shipping and listing rules; photograph each finished piece, then prepare a reviewed title, description and 13 suggested tags. Do not rely on promised rankings.'
    :`For ${input.channel}, check platform availability, policies and fees; show clear photos and verified product details before listing.`;
  const ideas=generateJewelryIdea({type:'All',preferredTypes:preferredIdeaTypes(input.types),style,color:'Any',material,skill,occasion},10,hash(input));
  return {recommendedNiche:niche,planningSummary:`Focus on ${style.toLowerCase()} ${input.types.join(' and ')} for ${input.customer.toLowerCase()}. As a ${input.experience.toLowerCase()} maker pursuing ${input.goal.toLowerCase()}, begin with ${beginner?'easy-to-assemble samples':'prototypes suited to your experience'} and verify costs before selling on ${input.channel}.`,productIdeas:ideas.map(i=>`${i.name} — ${i.style}, ${i.material}, ${i.skill} difficulty; for ${input.customer.toLowerCase()}`),starterMaterialList:[`Small test quantities of ${material.toLowerCase()} and other materials suitable for ${input.types.join(' and ')}`,'Compatible findings, clasps and appropriate tools','Protective packaging and care cards'],estimatedStartingBudget:`Planning bracket: ${input.budget}. Illustrative, not a cost forecast. ${budgetApproach}`,experienceApproach:beginner?`Choose beginner-friendly ${style.toLowerCase()} ${input.types.join(' and ')} with simple construction; practice and test quality before taking orders.`:`Use your ${input.experience.toLowerCase()} experience to prototype and test ${style.toLowerCase()} ${input.types.join(' and ')} before scaling.`,pricingApproach:'Record actual material quantities, labor time and packaging; use the pricing calculator to account for costs, desired margin and selling fees. No product price is suggested without your real costs.',packagingChecklist:['Protective pouch or box','Care instructions','Clear product label','Shipping protection'],brandingChecklist:[`Choose a consistent ${style.toLowerCase()} visual direction for ${input.customer.toLowerCase()}`,'Write a short, honest brand description','Photograph sample pieces','Check name availability before use'],socialMediaPlan:`Share process photos and verified ${style.toLowerCase()} ${input.types.join(' and ')} details for ${input.customer.toLowerCase()}. Measure what your audience responds to.`,first10Products:ideas.map(i=>i.name),thirtyDayActionPlan:[`Days 1–7: Choose ${style.toLowerCase()} ${input.types.join(' and ')} concepts and source samples within ${input.budget}.`,`Days 8–14: ${beginner?'Practice simple construction and make':'Prototype and refine'} 2–3 test pieces; track time and costs.`,`Days 15–21: Photograph finished designs for ${input.customer.toLowerCase()} and draft ${input.channel} listings.`,`Days 22–30: Review pricing and ${input.goal.toLowerCase()} milestones; publish only after checking ${input.channel} policies and actual costs.`],suggestedSellingChannels:channelPlan,experience:input.experience,goal:input.goal};
}
export function generateEtsyListing(input:Record<string,string>,variation=0){
 const title=`${input.name.trim()} | ${input.style.trim()} Handmade ${input.type.trim()} | ${input.occasion.trim()} Gift`.slice(0,140);
  const tags=[`${input.type} jewelry`,`${input.style} jewelry`,`${input.color} jewelry`,`${input.occasion} gift`,`${input.materials.split(',')[0].trim()} jewelry`,'handmade jewelry',`gift for ${input.target}`,'artisan jewelry','jewelry gift','small batch jewelry','unique accessory','everyday accessory','thoughtful gift'].map(t=>t.slice(0,20));
 if(variation%2) tags.reverse();
  const care=input.care||`Store separately in a dry place and handle gently. Confirm material-specific cleaning guidance for ${input.materials} before publishing.`;
  return {etsyTitle:title,productDescription:`${input.name} is a handmade ${input.type.toLowerCase()} concept in ${input.color.toLowerCase()}, designed with ${input.materials}. Its ${input.style.toLowerCase()} character makes it suitable for ${input.occasion.toLowerCase()} styling.\n\nDetails\nMaterials: ${input.materials}\nSize: ${input.size||'Add measured dimensions before publishing'}\nWeight: ${input.weight||'Add measured weight before publishing'}\nProcessing time: ${input.processing||'Confirm before publishing'}\n${input.personalization==='Yes'?'Personalization: Add exact options and instructions before publishing.':'Personalization is not offered in this draft.'}\n\nCare: ${care}\n\nThis is a draft. Verify all product details, photos, shop policies and platform requirements before publishing.`,materials:input.materials,keyFeatures:[`${input.style} ${input.type}`,`${input.color} finish`,`Suggested for ${input.target}`],sizeInformation:input.size||'Measure and add dimensions before publishing.',careInstructions:care,personalizationInstructions:input.personalization==='Yes'?'Specify exact options, character limits and how buyers submit requests.':'Not available in this draft.',tags,photoChecklist:['Clear front view','Close-up of materials and finish','Scale or worn view','Back / clasp detail','Packaging image if applicable'],shortProductSummary:`${input.style} ${input.type.toLowerCase()} in ${input.color.toLowerCase()} for ${input.target.toLowerCase()}.`,price:input.price?`${input.currency||'PKR'} ${input.price} (verify before publishing)`:'Not entered'};
}