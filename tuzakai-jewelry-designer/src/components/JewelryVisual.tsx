import type { JewelryDesignInput } from '@workspace/api-client-react';

const palette: Record<string, string> = {
  pink:'#e6a5ae', blush:'#e8b6b4', rose:'#d78b9f', red:'#b95360', blue:'#85a9b5',
  green:'#8fa794', ivory:'#f3e6d0', white:'#eee9dc', black:'#474146', purple:'#a38cae',
  gold:'#c8a45f', silver:'#aaaab0', amber:'#c99066', clear:'#d7d8d0', peach:'#e3ad91',
};
function colorOf(value:string) {
  const found=Object.keys(palette).find(k=>value.toLowerCase().includes(k));
  return found ? palette[found] : '#d99da8';
}
function Flower({cx,cy,r,fill,pearl}:{cx:number;cy:number;r:number;fill:string;pearl:boolean}) {
  return <g>{Array.from({length:6},(_,i)=><ellipse key={i} cx={cx} cy={cy-r*.56} rx={r*.42} ry={r*.68} fill={fill} stroke="#b77e82" strokeWidth="1.4" transform={`rotate(${i*60} ${cx} ${cy})`} opacity=".9"/>)}<circle cx={cx} cy={cy} r={pearl?r*.33:r*.24} fill={pearl?'#f9f3e8':'#e6c687'} stroke="#c6a99b" strokeWidth="1.4"/><circle cx={cx-r*.08} cy={cy-r*.08} r={r*.08} fill="#fff9f1" opacity=".8"/></g>;
}
function Motif({cx,cy,r,input}:{cx:number;cy:number;r:number;input:JewelryDesignInput}) {
  const fill=colorOf(input.color), pearl=/pearl/i.test(input.decoration), shape=input.shape.toLowerCase();
  if(shape.includes('flower')||shape.includes('floral')) return <Flower cx={cx} cy={cy} r={r} fill={fill} pearl={pearl}/>;
  if(shape.includes('heart')) return <g><path d={`M ${cx} ${cy+r*.8} C ${cx-r*1.5} ${cy-r*.15},${cx-r*.9} ${cy-r*1.2},${cx} ${cy-r*.55} C ${cx+r*.9} ${cy-r*1.2},${cx+r*1.5} ${cy-r*.15},${cx} ${cy+r*.8} Z`} fill={fill} stroke="#ad7c7d" strokeWidth="2"/>{pearl&&<circle cx={cx} cy={cy} r={r*.22} fill="#f8f3ea"/>}</g>;
  if(shape.includes('star')) return <g><polygon points={Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.47:r;return `${cx+Math.cos(a)*rr},${cy+Math.sin(a)*rr}`}).join(' ')} fill={fill} stroke="#ad7c7d" strokeWidth="2"/>{pearl&&<circle cx={cx} cy={cy} r={r*.2} fill="#f8f3ea"/>}</g>;
  if(shape.includes('oval')) return <ellipse cx={cx} cy={cy} rx={r*.75} ry={r} fill={fill} stroke="#ad7c7d" strokeWidth="2"/>;
  if(shape.includes('square')||shape.includes('geometric')) return <rect x={cx-r*.7} y={cy-r*.7} width={r*1.4} height={r*1.4} rx="5" transform={`rotate(45 ${cx} ${cy})`} fill={fill} stroke="#ad7c7d" strokeWidth="2"/>;
  return <g><circle cx={cx} cy={cy} r={r} fill={fill} stroke="#ad7c7d" strokeWidth="2"/>{pearl&&<circle cx={cx} cy={cy} r={r*.26} fill="#f8f3ea" stroke="#d5bbae"/>}</g>;
}
export function JewelryVisual({input}:{input:JewelryDesignInput}) {
  const metal=/silver|steel/i.test(input.finding)?'#a9aab2':'#bd9656';
  const type=input.jewelryType.toLowerCase();
  const pearl=/pearl/i.test(input.decoration);
  return <svg viewBox="0 0 360 260" role="img" aria-label={`${input.color} ${input.shape} ${input.jewelryType} with ${input.decoration} and ${input.finding}`}>
    <defs><linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f5e3ae"/><stop offset=".55" stopColor={metal}/><stop offset="1" stopColor="#846c5b"/></linearGradient></defs>
    {type.includes('earring') ? [105,255].map((cx,i)=><g key={i}>
      {/hook/i.test(input.finding)?<path d={`M${cx-5} 53 C${cx-11} 31 ${cx+12} 28 ${cx+12} 46 C${cx+12} 56 ${cx+4} 57 ${cx+1} 49`} fill="none" stroke="url(#metal)" strokeWidth="4" strokeLinecap="round"/>:<circle cx={cx} cy="45" r="7" fill="url(#metal)"/>}
      <circle cx={cx} cy="69" r="6" fill="none" stroke={metal} strokeWidth="3"/><path d={`M${cx} 75V91`} stroke={metal} strokeWidth="3"/>
      <Motif cx={cx} cy={139} r={43} input={input}/>
      {pearl&&<g><path d={`M${cx} 180v9`} stroke={metal} strokeWidth="2"/><circle cx={cx} cy="199" r="10" fill="#faf4e8" stroke="#d4c3ae" strokeWidth="2"/></g>}
    </g>) : type.includes('bracelet')||type.includes('anklet')||type.includes('necklace') ?
      <g><ellipse cx="180" cy="123" rx={type.includes('necklace')?126:101} ry={type.includes('necklace')?83:66} fill="none" stroke="url(#metal)" strokeWidth="5"/>{Array.from({length:11},(_,i)=>{let a=(i/11)*Math.PI*2;let rx=type.includes('necklace')?126:101,ry=type.includes('necklace')?83:66;return <circle key={i} cx={180+Math.cos(a)*rx} cy={123+Math.sin(a)*ry} r={pearl?6:3} fill={pearl?'#f8f2e8':metal} stroke="#cbbab0"/>})}<Motif cx={180} cy={type.includes('necklace')?206:190} r={type.includes('necklace')?25:20} input={input}/></g> :
    type.includes('ring') ? <g><ellipse cx="180" cy="155" rx="79" ry="62" fill="none" stroke="url(#metal)" strokeWidth="13"/><Motif cx={180} cy={84} r={32} input={input}/></g> :
    type.includes('keychain') ? <g><circle cx="180" cy="56" r="28" fill="none" stroke="url(#metal)" strokeWidth="8"/><path d="M180 84v36" stroke={metal} strokeWidth="5"/><Motif cx={180} cy={165} r={46} input={input}/></g> :
    type.includes('hair') ? <g><path d="M80 186 Q180 210 280 186" fill="none" stroke="url(#metal)" strokeWidth="12" strokeLinecap="round"/><Motif cx={180} cy={128} r={43} input={input}/></g> :
    <g>{type.includes('brooch')&&<path d="M105 192h150" stroke={metal} strokeWidth="5"/>}<circle cx="180" cy="75" r="9" fill="none" stroke={metal} strokeWidth="4"/><Motif cx={180} cy={145} r={48} input={input}/></g>}
  </svg>;
}