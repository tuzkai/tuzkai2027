import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { Link as WouterLink, useLocation } from 'wouter';
import { ArrowRight, Menu, X, ShoppingBag, Search, UserRound, Gem, Sparkles, Calculator, Store, FileText, Lightbulb, Check, Download, Copy, Save, House } from 'lucide-react';
import { useGetTuzakaiSiteSettings } from '@workspace/api-client-react';
import { addProject, copy, download, formatResult } from '../lib/studio';

export const toolLinks=[
 {path:'/jewelry-studio/design-generator',title:'Jewelry Design Generator',short:'Design Your Jewelry',desc:'Turn a first thought into a complete jewelry concept.',icon:Gem},
 {path:'/jewelry-studio/pricing-calculator',title:'Jewelry Pricing Calculator',short:'Calculate Your Price',desc:'Know your costs, fees, selling price and estimated profit.',icon:Calculator},
 {path:'/jewelry-studio/start-business',title:'Jewelry Business Starter',short:'Start Your Jewelry Business',desc:'Map your first steps with a simple, personal roadmap.',icon:Store},
 {path:'/jewelry-studio/etsy-listing',title:'Etsy Listing Generator',short:'Create Your Etsy Listing',desc:'Prepare a thoughtful listing draft, ready for your edits.',icon:FileText},
 {path:'/jewelry-studio/jewelry-ideas',title:'Jewelry Idea Generator',short:'Generate Jewelry Ideas',desc:'Find fresh product directions from your chosen materials.',icon:Lightbulb}
];
const nav=[['/','Home'],['/ai-tools','AI Tools'],['/digital-products','Digital Products'],['/categories','Categories'],['/about','About'],['/contact','Contact']] as const;
const footerGroups=[
  {title:'Navigation',links:nav},
  {title:'Shopping',links:[['/cart','Cart'],['/account','My Account'],['/account/purchases','My Purchases'],['/account/tools','My AI Tools'],['/account/licenses','Licenses']]},
  {title:'Support',links:[['/help-center','Help Center'],['/faq','FAQ'],['/contact','Contact Support']]},
  {title:'Legal',links:[['/privacy','Privacy Policy'],['/terms','Terms of Service'],['/refund-policy','Refund Policy'],['/license-terms','License Terms']]}
] as const;
const bottomNav=[{href:'/',label:'Home',icon:House},{href:'/shop',label:'Store',icon:Store},{href:'/ai-tools',label:'AI Tools',icon:Sparkles},{href:'/cart',label:'Cart',icon:ShoppingBag},{href:'/account',label:'Account',icon:UserRound}] as const;
const isCurrent=(location:string,href:string)=>href==='/'?location==='/':location===href||location.startsWith(`${href}/`);
export function SiteLink(props:ComponentProps<typeof WouterLink>){
  const href='href' in props ? props.href : props.to;
  if (href?.startsWith('/tuzakai/')) return <a {...(props as unknown as ComponentProps<'a'>)} href={href}/>;
  return <WouterLink {...props}/>;
}
const Link=SiteLink;
export function safeSiteUrl(value:string|null|undefined){if(!value)return null;try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)&&!url.hostname.toLowerCase().endsWith('jewelry.com')?url.href:null}catch{return null}}
export function SiteLayout({children}:{children:ReactNode}){
  const [open,setOpen]=useState(false);
  const [location]=useLocation();
  const {data:settings}=useGetTuzakaiSiteSettings();
  const socials=settings?.socialLinks ? Object.entries(settings.socialLinks).flatMap(([name,value])=>{const url=safeSiteUrl(value);return url?[{name,url}]:[]}) : [];
  const website=safeSiteUrl(settings?.websiteUrl);
  useEffect(()=>{setOpen(false);window.scrollTo(0,0)},[location]);
  useEffect(()=>{
    if(!open)return;
    const onKeyDown=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};
    document.addEventListener('keydown',onKeyDown);
    return ()=>document.removeEventListener('keydown',onKeyDown);
  },[open]);
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <div className="announcement">IDEAS ARE JUST THE BEGINNING <span>—</span> TUZAKAI BY SZTUZK</div>
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand site-brand" data-testid="link-logo" aria-label="TuzakAI by Sztuzk, home">TuzakAI<small>by Sztuzk</small></Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {nav.map(([href,label])=><Link key={href} href={href} className={isCurrent(location,href)?'active':''} aria-current={isCurrent(location,href)?'page':undefined} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ','-')}`}>{label}</Link>)}
          <Link href="/shop" className={`shop-nav-link ${isCurrent(location,'/shop')?'active':''}`} aria-current={isCurrent(location,'/shop')?'page':undefined} data-testid="link-nav-shop">Shop <ArrowRight size={13}/></Link>
        </nav>
        <div className="header-actions">
          <Link className="icon-button" aria-label="Search" title="Search" href="/search" data-testid="link-header-search"><Search size={19}/></Link>
          <Link className="icon-button" aria-label="Cart" title="Cart" href="/cart" data-testid="link-header-cart"><ShoppingBag size={19}/></Link>
          <Link className="icon-button account-icon" aria-label="Account" title="Account" href="/account" data-testid="link-header-account-icon"><UserRound size={19}/></Link>
          <Link className="header-account" href="/account" data-testid="link-header-account">Account</Link>
        </div>
        <button type="button" className="icon-button mobile-toggle" aria-label={open?'Close menu':'Open menu'} aria-controls="mobile-navigation" aria-expanded={open} data-testid="button-menu" onClick={()=>setOpen(!open)}>{open?<X size={22}/>:<Menu size={22}/>}</button>
      </div>
      {open&&<nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">
        <span className="eyebrow">Explore TuzakAI</span>
        <Link href="/shop" onClick={()=>setOpen(false)} className={isCurrent(location,'/shop')?'active':''} aria-current={isCurrent(location,'/shop')?'page':undefined} data-testid="link-mobile-shop">Shop</Link>
        {nav.map(([href,label])=><Link key={href} href={href} onClick={()=>setOpen(false)} className={isCurrent(location,href)?'active':''} aria-current={isCurrent(location,href)?'page':undefined} data-testid={`link-mobile-${label.toLowerCase().replaceAll(' ','-')}`}>{label}</Link>)}
        <div className="mobile-actions">
          <Link href="/search" onClick={()=>setOpen(false)} data-testid="link-mobile-search">Search</Link>
          <Link href="/cart" onClick={()=>setOpen(false)} data-testid="link-mobile-cart">Cart</Link>
          <Link href="/account" onClick={()=>setOpen(false)} data-testid="link-mobile-account">Account</Link>
          <Link href="/help-center" onClick={()=>setOpen(false)} data-testid="link-mobile-help">Help Center</Link>
        </div>
      </nav>}
    </header>
    {open&&<button type="button" className="shell-menu-backdrop" aria-label="Close navigation menu" data-testid="button-close-menu-backdrop" onClick={()=>setOpen(false)}/>}
    <main id="main-content" style={{minHeight:'60dvh'}}>{children}</main>
    <footer className="footer"><div className="container">
      <div className="footer-grid">
        <div className="footer-intro">
          <Link href="/" className="brand footer-brand" data-testid="link-footer-brand">TuzakAI<span>by Sztuzk</span></Link>
          <p>Useful tools for the ideas you can’t stop thinking about.</p>
          {website&&<a href={website} target="_blank" rel="noopener noreferrer" data-testid="link-footer-website">Website <ArrowRight size={13} style={{display:'inline'}}/></a>}
          {socials.length>0&&<div className="footer-socials">{socials.map(({name,url})=><a key={name} href={url} target="_blank" rel="noopener noreferrer" data-testid={`link-social-${name.toLowerCase().replaceAll(/[^a-z0-9]+/g,'-')}`}>{name.charAt(0).toUpperCase()+name.slice(1)} <ArrowRight size={12} style={{display:'inline'}}/></a>)}</div>}
        </div>
        {footerGroups.map(group=><div className="footer-column" key={group.title}><h2>{group.title}</h2>{group.links.map(([href,label])=><Link key={`${href}-${label}`} href={href} data-testid={`link-footer-${group.title.toLowerCase()}-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g,'-')}`}>{label}</Link>)}</div>)}
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} TuzakAI by Sztuzk.</span><span>Make room for the idea.</span></div>
    </div></footer>
    <nav className="mobile-bottom-nav" aria-label="Quick navigation">
      {bottomNav.map(({href,label,icon:Icon})=><Link href={href} key={href} aria-current={isCurrent(location,href)?'page':undefined} data-testid={`link-bottom-${label.toLowerCase().replaceAll(' ','-')}`}><Icon size={20} strokeWidth={1.8} aria-hidden="true"/><span>{label}</span></Link>)}
    </nav>
  </>;
}
export function PageHeading({kicker,title,description}:{kicker:string;title:string;description:string}){return <div className="tool-hero"><div className="eyebrow">{kicker}</div><h1>{title}</h1><p>{description}</p></div>}
export function FormField({label,children}:{label:string;children:ReactNode}){return <label className="field">{label}{children}</label>}
export function SelectField({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:string[]}){return <FormField label={label}><select className="input" value={value} onChange={e=>onChange(e.target.value)} data-testid={`select-${label.toLowerCase().replaceAll(/[^a-z]+/g,'-')}`}>{options.map(x=><option key={x} value={x}>{x}</option>)}</select></FormField>}
export function Chips({options,value,onChange,multiple=false}:{options:string[];value:string|string[];onChange:(v:any)=>void;multiple?:boolean}){return <div className="row" role="group">{options.map(x=><button key={x} type="button" className={`chip ${(multiple?(value as string[]).includes(x):value===x)?'active':''}`} aria-pressed={multiple?(value as string[]).includes(x):value===x} data-testid={`button-select-${x.toLowerCase().replaceAll(/[^a-z0-9]+/g,'-')}`} onClick={()=>onChange(multiple?((value as string[]).includes(x)?(value as string[]).filter(y=>y!==x):[...(value as string[]),x]):x)}>{x}</button>)}</div>}
export function ToolCard({item}:{item:typeof toolLinks[number]}){const Icon=item.icon;return <div className="card feature-card"><div className="tool-icon"><Icon size={22} strokeWidth={1.5}/></div><h3>{item.short}</h3><p>{item.desc}</p><Link className="link-arrow" href={item.path} data-testid={`link-tool-${item.path.split('/').pop()}`}>Explore tool <ArrowRight size={15}/></Link></div>}
export function Actions({content,title,type,extra}:{content:unknown;title:string;type:string;extra?:ReactNode}){const [status,setStatus]=useState('');const flash=(s:string)=>{setStatus(s);setTimeout(()=>setStatus(''),3000)};return <><div className="row" style={{marginTop:24}}><button className="btn btn-gold" onClick={()=>{try{addProject(type,title,content);flash('Project saved on this device')}catch{flash('Unable to save. Check browser storage settings or free some space.')}}} data-testid="button-save-result"><Save size={15}/> Save Project</button><button className="btn btn-outline" onClick={()=>copy(content).then(()=>flash('Copied to clipboard')).catch(()=>flash('Copy unavailable in this browser'))} data-testid="button-copy-result"><Copy size={15}/> Copy</button><button className="btn btn-outline" onClick={()=>{try{download(`sztuzk-${type.toLowerCase().replaceAll(' ','-')}.txt`,formatResult(title,content));flash('Download started')}catch{flash('Download unavailable in this browser')}}} data-testid="button-download-result"><Download size={15}/> Download Result</button>{extra}</div>{status&&<p role="status" className="fine" style={{color:'#7a633f'}}><Check size={14} style={{display:'inline',marginRight:6}}/>{status}</p>}</>}
export function EmptyResult({title='Your result will appear here',description='Choose your details and generate to see your first draft.'}:{title?:string;description?:string}){return <div className="card tool-panel" style={{textAlign:'center',padding:'65px 25px'}}><div className="tool-icon" style={{margin:'0 auto 20px',width:60,height:60}}><Sparkles size={27}/></div><h3 className="serif" style={{fontSize:26,margin:'0 0 12px'}}>{title}</h3><p className="muted" style={{fontSize:14,lineHeight:1.7,maxWidth:330,margin:'auto'}}>{description}</p></div>}
export function ResultFields({data}:{data:Record<string,unknown>}){return <div className="result-grid">{Object.entries(data).map(([key,value])=><div className="result-item" key={key}><div className="result-label">{key.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase())}</div><div className="result-value">{Array.isArray(value)?<ul style={{paddingLeft:18,margin:'5px 0'}}>{value.map((x,i)=><li key={i}>{String(x)}</li>)}</ul>:String(value)}</div></div>)}</div>}