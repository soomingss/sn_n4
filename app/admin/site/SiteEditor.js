"use client";

import Link from "next/link";
import {useState} from "react";
import {useRouter} from "next/navigation";

const settingFields = [
  ["company_name","회사명"],["company_name_en","영문 회사명"],["representative_name","대표자"],
  ["business_number","사업자등록번호"],["address","주소"],["phone","전화"],["fax","팩스"],
  ["email","이메일"],["kakao_channel_url","카카오톡 채널"],["map_place_name","지도 장소명"],["map_address","지도 주소"],
];

export default function SiteEditor({settings,pages,history}){
  const router=useRouter();
  const [settingValues,setSettingValues]=useState(Object.fromEntries(settingFields.map(([key])=>[key,settings[key]||""])));
  const [contentValues,setContentValues]=useState(()=>Object.fromEntries(pages.map((page)=>[page.key,{...page.values}])));
  const [historyValues,setHistoryValues]=useState(()=>history.map((item)=>({...item})));
  const [state,setState]=useState({saving:"",message:"",error:false});

  async function save(payload,key){
    if(state.saving)return;
    setState({saving:key,message:"",error:false});
    try{
      const res=await fetch("/api/admin/site",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data.message||"저장하지 못했습니다.");
      setState({saving:"",message:"저장되었습니다.",error:false});
      router.refresh();
    }catch(error){
      setState({saving:"",message:error.message||"저장하지 못했습니다.",error:true});
    }
  }

  return <>
    {state.message&&<div className={state.error?"loginError":"signupSuccess"} style={{marginBottom:"20px"}}>{state.message}</div>}

    <Block title="회사 기본정보">
      {settingFields.map(([key,label])=><Field key={key} label={label} value={settingValues[key]} onChange={(value)=>setSettingValues({...settingValues,[key]:value})}/>)}
      <SaveButton busy={state.saving==="settings"} onClick={()=>save({type:"settings",values:settingValues},"settings")}/>
    </Block>

    {pages.map((page)=><Block key={page.key} title={page.label}>
      {Object.entries(contentValues[page.key]||{}).map(([contentKey,value])=><Field key={contentKey} label={contentKey} value={value} multiline onChange={(next)=>setContentValues({...contentValues,[page.key]:{...contentValues[page.key],[contentKey]:next}})} action={<SaveButton compact busy={state.saving===`content:${page.key}:${contentKey}`} onClick={()=>save({type:"content",pageKey:page.key,contentKey,value:contentValues[page.key][contentKey]},`content:${page.key}:${contentKey}`)}/>}/>)}
    </Block>)}

    <Block title="연혁">
      {historyValues.map((item,index)=><div key={item.id} style={{display:"grid",gridTemplateColumns:"110px 1fr auto",gap:"12px",alignItems:"start",padding:"14px 0",borderBottom:"1px solid #e7e7e7"}}>
        <input value={item.year} onChange={(e)=>setHistoryValues(historyValues.map((row,i)=>i===index?{...row,year:e.target.value}:row))} style={inputStyle}/>
        <textarea rows={3} value={item.content} onChange={(e)=>setHistoryValues(historyValues.map((row,i)=>i===index?{...row,content:e.target.value}:row))} style={inputStyle}/>
        <SaveButton compact busy={state.saving===`history:${item.id}`} onClick={()=>save({type:"history",id:item.id,year:item.year,content:item.content},`history:${item.id}`)}/>
      </div>)}
    </Block>

    <div style={{marginTop:"28px"}}><Link href="/admin">← 관리자 업무로 돌아가기</Link></div>
  </>;
}

function Block({title,children}){return <section style={{marginTop:"28px",padding:"24px",border:"1px solid #e2e8e2",borderRadius:"12px",background:"#fff"}}><h2 style={{marginTop:0}}>{title}</h2>{children}</section>}

function Field({label,value,onChange,multiline=false,action=null}){
  return <div style={{display:"grid",gridTemplateColumns:"minmax(140px,220px) 1fr auto",gap:"12px",alignItems:"start",padding:"12px 0",borderBottom:"1px solid #eee"}}>
    <b style={{paddingTop:"10px"}}>{label}</b>
    {multiline?<textarea rows={3} value={value||""} onChange={(e)=>onChange(e.target.value)} style={inputStyle}/>:<input value={value||""} onChange={(e)=>onChange(e.target.value)} style={inputStyle}/>}
    {action}
  </div>;
}
function SaveButton({busy,onClick,compact=false}){return <button type="button" onClick={onClick} disabled={busy} style={{padding:compact?"10px 14px":"11px 20px",marginTop:compact?0:"18px",cursor:"pointer"}}>{busy?"저장 중...":"저장"}</button>}
const inputStyle={width:"100%",boxSizing:"border-box",padding:"10px 12px",border:"1px solid #ccd5cc",borderRadius:"6px",font:"inherit"};
