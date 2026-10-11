import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, BackHandler, Linking, Platform,
  Pressable, RefreshControl, SafeAreaView, ScrollView, StatusBar as NativeStatusBar,
  Text, TextInput, View
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { StatusBar } from "expo-status-bar";
import { checkConnections, getVideoModels, getVoiceOptions, type VideoModel, type VoiceOption } from "./src/api";
import { C, S } from "./src/styles";
import { Button, Card, Chip, Copy, Eyebrow, Gap, ServiceIndicator, TwoColumn } from "./src/ui";
import { composeVideoUrl, isTrustedStudioUrl, studioUrl } from "./src/studio-links.js";

type Tab = "home"|"video"|"voice"|"projects"|"profile";
type Studio = "video"|"voice";
type Browser = { studio:Studio; url:string; title:string }|null;
type Conn = {video:boolean|null;voice:boolean|null};
type IconName = React.ComponentProps<typeof Ionicons>["name"];
const NAV: {key:Tab;icon:IconName;active:IconName;title:string}[] = [
  {key:"home",icon:"home-outline",active:"home",title:"Нүүр"},
  {key:"video",icon:"videocam-outline",active:"videocam",title:"Видео"},
  {key:"voice",icon:"mic-outline",active:"mic",title:"Хоолой"},
  {key:"projects",icon:"folder-open-outline",active:"folder-open",title:"Төслүүд"},
  {key:"profile",icon:"person-outline",active:"person",title:"Профайл"}
];
function IconTile({name,bg,color}:{name:IconName;bg:string;color:string}){
 return <View style={{width:46,height:46,borderRadius:16,backgroundColor:bg,justifyContent:"center",alignItems:"center"}}>
  <Ionicons name={name} color={color} size={24}/>
 </View>;
}
function MiniPill({title,color=C.primary,bg=C.softViolet}:{title:string;color?:string;bg?:string}){
 return <View style={{alignSelf:"flex-start",backgroundColor:bg,borderRadius:20,paddingVertical:7,paddingHorizontal:11}}>
  <Text style={{fontSize:10,color,fontWeight:"800",letterSpacing:.35}}>{title}</Text>
 </View>;
}
function SectionTitle({label,title}:{label?:string;title:string}){
 return <View style={{marginBottom:12}}>{label?<Text style={[S.eyebrow,{marginBottom:5}]}>{label}</Text>:null}
 <Text style={{fontSize:19,fontWeight:"800",color:C.heading,letterSpacing:-.4}}>{title}</Text></View>;
}

const starters=[
  {label:"Бүтээгдэхүүний реклам",text:"Монгол бүтээгдэхүүнийг премиум кино реклам шиг харуул. Бодит гэрэлтүүлэг, зөөлөн хөдөлгөөн, 9:16 формат.",tag:"SOCIAL ADS"},
  {label:"Монгол киноны кадр",text:"Монгол тал нутагт нар мандах үе. Киноны өргөн план, салхинд найгах өвс, байгалийн зөөлөн хөдөлгөөн.",tag:"CINEMA"},
  {label:"Хотын cinematic",text:"Улаанбаатар хотын бороотой орой, неон гэрэл, бодит киноны камерын хөдөлгөөн, cinematic өнгө.",tag:"CREATOR"}
];
const emotions=[
  {value:"neutral",label:"Энгийн"},{value:"happy",label:"Баяртай"},{value:"sad",label:"Гунигтай"},
  {value:"excited",label:"Догдолсон"},{value:"angry",label:"Ууртай"},
  {value:"whisper",label:"Шивнээ"},{value:"thoughtful",label:"Бодолтой"},
  {value:"surprised",label:"Гайхсан"}
] as const;
type Emotion = typeof emotions[number]["value"];

export default function App() {
  const [tab,setTab]=useState<Tab>("home");
  const [browser,setBrowser]=useState<Browser>(null);
  const [health,setHealth]=useState<Conn>({video:null,voice:null});
  const [loadingHealth,setLoadingHealth]=useState(false);
  const [videoModels,setVideoModels]=useState<VideoModel[]>([]);
  const [voiceOptions,setVoiceOptions]=useState<VoiceOption[]>([]);
  const [modelError,setModelError]=useState("");
  const [voiceError,setVoiceError]=useState("");
  const [modelsLoading,setModelsLoading]=useState(false);
  const [voicesLoading,setVoicesLoading]=useState(false);
  const [videoPrompt,setVideoPrompt]=useState("");
  const [voiceScript,setVoiceScript]=useState("Өнөөдрийн жижиг санаа маргаашийн том бүтээл болж чадна.");
  const [selectedModel,setSelectedModel]=useState("");
  const [voiceName,setVoiceName]=useState("");
  const [emotion,setEmotion]=useState<Emotion>("neutral");
  const [copied,setCopied]=useState(false);
  const [filter,setFilter]=useState<"all"|"video"|"image"|"workflow">("all");
  const [search,setSearch]=useState("");
  const [showAllModels,setShowAllModels]=useState(false);
  const [showAllVoices,setShowAllVoices]=useState(false);
  const [refreshing,setRefreshing]=useState(false);

  const loadHealth=useCallback(async()=>{
    setLoadingHealth(true);
    try{const data=await checkConnections();setHealth({video:data.video==="ready",voice:data.voice==="ready"});}
    finally{setLoadingHealth(false);}
  },[]);
  const loadModels=useCallback(async()=>{
    setModelsLoading(true);setModelError("");
    try{
      const data=await getVideoModels();
      setVideoModels(data);
      setSelectedModel(current=>data.some(m=>m.slug===current)?current:(data.find(m=>m.apiVerified&&m.kind==="video")||data.find(m=>m.kind==="video")||data[0])?.slug||"");
    }catch{setModelError("Видео загварын жагсаалтыг серверээс авч чадсангүй.");}
    finally{setModelsLoading(false);}
  },[]);
  const loadVoices=useCallback(async()=>{
    setVoicesLoading(true);setVoiceError("");
    try{
      const voices=await getVoiceOptions();setVoiceOptions(voices);
      setVoiceName(current=>voices.some(v=>v.name===current)?current:voices[0]?.name||"");
    }catch{setVoiceError("Хоолойн жагсаалтыг серверээс авч чадсангүй.");}
    finally{setVoicesLoading(false);}
  },[]);
  useEffect(()=>{void loadHealth();},[loadHealth]);
  useEffect(()=>{if(tab==="video"&&videoModels.length===0)void loadModels();},[tab,videoModels.length,loadModels]);
  useEffect(()=>{if(tab==="voice"&&voiceOptions.length===0)void loadVoices();},[tab,voiceOptions.length,loadVoices]);
  useEffect(()=>{
    if(!browser)return;
    const subscription=BackHandler.addEventListener("hardwareBackPress",()=>{setBrowser(null);return true;});
    return()=>subscription.remove();
  },[browser]);
  function openStudio(studio:Studio,url:string,title:string) {
    if(!isTrustedStudioUrl(url,studio))return;
    setBrowser({studio,url,title});
  }
  async function refreshAll(){
    setRefreshing(true);
    await Promise.allSettled([loadHealth(),tab==="video"?loadModels():Promise.resolve(),tab==="voice"?loadVoices():Promise.resolve()]);
    setRefreshing(false);
  }

  const visibleModels=useMemo(()=>videoModels.filter(m=>{
    if(filter!=="all"&&m.kind!==filter)return false;
    const value=(m.name+" "+(m.maker||"")+" "+(m.provider||"")).toLowerCase();
    return value.includes(search.trim().toLowerCase());
  }).slice(0,35),[videoModels,filter,search]);
  const model=videoModels.find(x=>x.slug===selectedModel);

  const Header=()=> <View style={{paddingHorizontal:21,paddingTop:7,paddingBottom:15,
      flexDirection:"row",alignItems:"center",justifyContent:"space-between",backgroundColor:C.bg}}>
    <View style={{flexDirection:"row",alignItems:"center",gap:9}}>
      <View style={{width:35,height:35,borderRadius:12,backgroundColor:C.ink,alignItems:"center",justifyContent:"center"}}>
        <Text style={{color:"#FFFFFF",fontSize:20,fontWeight:"900"}}>R<Text style={{color:"#C8BEFF"}}>.</Text></Text>
      </View>
      <Text style={{fontSize:19,color:C.heading,fontWeight:"900",letterSpacing:-.9}}>rainy<Text style={{color:C.primary}}>.studio</Text></Text>
    </View>
    <Pressable onPress={()=>setTab("profile")} accessibilityRole="button" accessibilityLabel="Миний профайл"
      style={{width:38,height:38,borderRadius:15,alignItems:"center",justifyContent:"center",backgroundColor:C.white,borderWidth:1,borderColor:C.outline}}>
      <Ionicons name="person-outline" color={C.heading} size={19}/>
    </Pressable>
  </View>;

  function Home(){
    return <>
      <View style={{backgroundColor:"#EFECFF",borderColor:"#E8E3FF",borderWidth:1,borderRadius:28,padding:22,overflow:"hidden",minHeight:272}}>
        <View style={{position:"absolute",right:-60,top:-60,width:185,height:185,borderRadius:110,borderWidth:30,borderColor:"#E3DEFF"}}/>
        <View style={{position:"absolute",right:-49,bottom:-63,width:164,height:164,borderRadius:100,borderWidth:25,borderColor:"#E3DEFF"}}/>
        <MiniPill title="MONGOLIAN AI CREATIVE" color="#6357EB" bg="#E1DBFF"/>
        <Gap n={16}/>
        <Text style={{fontSize:36,lineHeight:42,fontWeight:"900",letterSpacing:-1.5,color:C.heading}}>
          Санаагаа{"\n"}<Text style={{color:C.primary}}>бүтээл</Text> болго.
        </Text>
        <Gap n={11}/>
        <Text style={{fontSize:13,lineHeight:20,color:"#6D6988",maxWidth:240}}>Видео, зураг, сэтгэл хөдлөлтэй Монгол хоолой. Бүгд нэг дор.</Text>
        <Gap n={18}/>
        <Pressable accessibilityRole="button" onPress={()=>setTab("video")}
          style={{alignSelf:"flex-start",paddingHorizontal:17,paddingVertical:13,backgroundColor:C.primary,borderRadius:13,flexDirection:"row",alignItems:"center",gap:10}}>
          <Text style={{color:"#FFFFFF",fontWeight:"800",fontSize:12.5}}>Бүтээж эхлэх</Text>
          <Ionicons name="arrow-forward" color="#FFFFFF" size={16}/>
        </Pressable>
        <View style={{position:"absolute",bottom:32,right:16,width:64,height:64,borderRadius:21,
          backgroundColor:"#FFFFFF",alignItems:"center",justifyContent:"center",
          shadowColor:"#5642C7",shadowOpacity:.16,shadowRadius:17,shadowOffset:{width:0,height:7}}}>
          <Ionicons name="sparkles" size={29} color={C.primary}/>
        </View>
      </View>
      <Gap n={25}/>
      <SectionTitle label="ТАНЫ БҮТЭЭЛЧ ОРОН ЗАЙ" title="Юу бүтээх вэ?"/>
      <View style={{flexDirection:"row",gap:12}}>
        <Pressable accessibilityRole="button" onPress={()=>setTab("video")}
          style={{flex:1,backgroundColor:"#FFF2D8",borderRadius:22,padding:15,minHeight:189}}>
          <IconTile name="videocam-outline" bg="#FFFFFF" color="#A97913"/>
          <Gap n={18}/>
          <Text style={{fontSize:19,fontWeight:"900",color:C.heading}}>Video <Text style={{color:"#B38B34"}}>AI</Text></Text>
          <Gap n={5}/><Text style={{fontSize:11.2,lineHeight:16,color:"#84765E"}}>AI кино, зураг, product ads</Text>
          <Gap n={16}/><View style={{flexDirection:"row",justifyContent:"space-between"}}>
            <Text style={{fontSize:10.5,fontWeight:"900",color:"#9D741B"}}>НЭЭХ</Text>
            <Ionicons name="arrow-up-forward" color="#9D741B" size={17}/>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={()=>setTab("voice")}
          style={{flex:1,backgroundColor:"#E3F7ED",borderRadius:22,padding:15,minHeight:189}}>
          <IconTile name="mic-outline" bg="#FFFFFF" color="#179E79"/>
          <Gap n={18}/>
          <Text style={{fontSize:19,fontWeight:"900",color:C.heading}}>Voice <Text style={{color:"#199E7B"}}>AI</Text></Text>
          <Gap n={5}/><Text style={{fontSize:11.2,lineHeight:16,color:"#658779"}}>Монгол хоолой, эмоц, дубляж</Text>
          <Gap n={16}/><View style={{flexDirection:"row",justifyContent:"space-between"}}>
            <Text style={{fontSize:10.5,fontWeight:"900",color:"#189A79"}}>НЭЭХ</Text>
            <Ionicons name="arrow-up-forward" color="#189A79" size={17}/>
          </View>
        </Pressable>
      </View>
      <Gap n={27}/>
      <SectionTitle label="ХУРДАН ЭХЛЭХ" title="Түгээмэл бүтээлүүд"/>
      {starters.map((item,index)=><Pressable key={item.label}
        accessibilityRole="button" onPress={()=>{setVideoPrompt(item.text);setTab("video");}}
        style={{backgroundColor:C.white,borderRadius:18,borderWidth:1,borderColor:C.outline,
        flexDirection:"row",alignItems:"center",gap:13,padding:13,marginBottom:9}}>
        <IconTile name={index===0?"bag-handle-outline":index===1?"film-outline":"sparkles-outline"}
          bg={index===0?"#FFF2D9":index===1?C.softViolet:C.softMint}
          color={index===0?"#A67B27":index===1?C.primary:"#199E7C"}/>
        <View style={{flex:1}}>
          <Text style={{color:C.subtle,fontSize:10,fontWeight:"800"}}>{item.tag}  ·  0{index+1}</Text>
          <Gap n={3}/><Text style={{color:C.heading,fontSize:13.5,fontWeight:"800"}}>{item.label}</Text>
        </View><Ionicons name="chevron-forward" size={16} color={C.subtle}/>
      </Pressable>)}
      <Gap n={16}/>
      <Card>
        <View style={{flexDirection:"row",alignItems:"center",gap:8,marginBottom:13}}>
          <Ionicons name="cloud-outline" size={19} color={C.primary}/>
          <Text style={{fontWeight:"800",fontSize:13,color:C.heading}}>Студийн холболт</Text>
        </View>
        <View style={{flexDirection:"row",gap:13,flexWrap:"wrap"}}>
          <ServiceIndicator label="Video" ready={health.video}/>
          <ServiceIndicator label="Voice" ready={health.voice}/>
        </View>
        <Gap n={10}/><Copy muted>Онлайн төлөв нь AI generation болон төлбөрийн баталгаа биш.</Copy>
        <Gap n={11}/><Pressable onPress={()=>void loadHealth()} accessibilityRole="button">
          <Text style={{fontSize:11,color:C.primary,fontWeight:"800"}}>{loadingHealth?"Шалгаж байна…":"Холболт шинэчлэх ↻"}</Text>
        </Pressable>
      </Card>
    </>;
  }

  function Video(){
    return <>
      <MiniPill title="01  ·  VIDEO STUDIO" color="#A67918" bg="#FFF1CD"/>
      <Gap n={13}/>
      <Text style={[S.h1,{fontSize:34}]}>Санаагаа{"\n"}<Text style={{color:"#BD8926"}}>хөдөлгөөн</Text> болго.</Text>
      <Gap n={10}/><Copy>Монгол prompt-оос видео, зураг, cinematic бүтээл. Үнэ болон үүсгэлтийг RAVS сервер баталгаажуулна.</Copy>
      <Gap n={20}/>
      <View style={{padding:15,backgroundColor:"#FFF8E9",borderRadius:19,borderWidth:1,borderColor:"#F7ECD3",flexDirection:"row",alignItems:"center",gap:12}}>
        <IconTile name="film-outline" bg="#FFE6B4" color="#A67918"/>
        <View style={{flex:1}}><Text style={{fontSize:13,color:C.heading,fontWeight:"800"}}>AI Video Creator</Text>
          <Gap n={4}/><Copy muted>Video · Image · Cinema · Motion</Copy></View>
        <Ionicons name="sparkles-outline" color="#A67B26" size={20}/>
      </View>
      <Gap n={24}/>
      <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <SectionTitle title="Модель сонгох"/>
        <Text style={[S.caption,{fontWeight:"700"}]}>{videoModels.length} загвар</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingBottom:4}}>
        {([["all","Бүгд"],["video","Видео"],["image","Зураг"],["workflow","Workflow"]] as const).map(([key,label])=>
          <Chip key={key} label={label} active={filter===key} onPress={()=>{setFilter(key);setShowAllModels(false);}}/>)}
      </ScrollView>
      <Gap n={5}/>
      <View style={{flexDirection:"row",alignItems:"center",backgroundColor:C.white,borderWidth:1,borderColor:C.outline,borderRadius:15,
          paddingHorizontal:13,marginBottom:14}}>
        <Ionicons name="search-outline" color={C.subtle} size={19}/>
        <TextInput placeholder="Модель хайх..." placeholderTextColor={C.subtle} value={search} onChangeText={setSearch}
          style={{flex:1,paddingVertical:13,paddingLeft:10,fontSize:13.5,color:C.text}}/>
      </View>
      {modelsLoading?<ActivityIndicator color={C.primary}/>:null}
      {modelError?<Card><Text style={{color:C.danger}}>{modelError}</Text><Gap n={12}/><Button title="Дахин ачаалах" secondary onPress={()=>void loadModels()}/></Card>:null}
      {visibleModels.length===0&&!modelsLoading&&!modelError?<Copy muted>Сонгосон шүүлтүүрт тохирох модель алга.</Copy>:null}
      {(showAllModels?visibleModels:visibleModels.slice(0,5)).map((m,index)=>{
        const active=selectedModel===m.slug;
        return <Pressable accessibilityRole="button" accessibilityState={{selected:active}} onPress={()=>setSelectedModel(m.slug)} key={m.slug}
          style={{backgroundColor:active?"#F8F7FF":C.white,borderWidth:active?1.5:1,
            borderColor:active?C.primary:C.outline,borderRadius:17,padding:13,marginBottom:9,flexDirection:"row",alignItems:"center",gap:12}}>
          <IconTile name={m.kind==="image"?"image-outline":m.kind==="workflow"?"layers-outline":"videocam-outline"}
            bg={index%2===0?"#FFF1D7":C.softViolet}
            color={index%2===0?"#B4811E":C.primary}/>
          <View style={{flex:1}}>
            <Text numberOfLines={1} style={{fontWeight:"800",color:C.heading,fontSize:13.5}}>{m.name}</Text>
            <Gap n={4}/><Text numberOfLines={1} style={S.caption}>{m.maker||m.provider||m.kind}</Text>
            <Gap n={3}/><Text style={{color:m.apiVerified?"#179B75":C.muted,fontSize:10,fontWeight:"700"}}>
              {m.apiVerified?"API каталогт идэвхтэй":"Сайт дээр боломжийг шалгана"}</Text>
          </View>
          <Ionicons name={active?"checkmark-circle":"ellipse-outline"} size={22} color={active?C.primary:"#CBD1DD"}/>
        </Pressable>;
      })}
      {visibleModels.length>5?<Pressable accessibilityRole="button" onPress={()=>setShowAllModels(v=>!v)}
        style={{alignItems:"center",padding:11}}>
        <Text style={{color:C.primary,fontWeight:"800",fontSize:12}}>{showAllModels?"Цөөлөх ↑":"Бусад "+(visibleModels.length-5)+" загварыг үзэх ↓"}</Text>
      </Pressable>:null}
      <Gap n={19}/>
      <SectionTitle title="Санаагаа бичих"/>
      <TextInput accessibilityLabel="Видео prompt" multiline value={videoPrompt} onChangeText={setVideoPrompt}
        maxLength={2400} placeholder="Жишээ: Монгол тал нутагт нар мандах кино кадр..."
        placeholderTextColor={C.subtle} style={[S.input,{minHeight:125}]}/>
      <Gap n={10}/><Copy muted>{videoPrompt.length}/2400 тэмдэгт · {model?.name||"Модель сонгоогүй"}</Copy>
      <Gap n={16}/>
      <Button title="Video Studio-д үргэлжлүүлэх" onPress={()=>openStudio("video",composeVideoUrl(selectedModel,videoPrompt),"RAINY Video Studio")}/>
      <Gap n={12}/><Copy muted>Төлбөртэй видео үүсгэхээс өмнө хэрэглэгч сонгосон тохиргоо болон кредитээ батална.</Copy>
    </>;
  }

  async function openVoiceWithScript(){
    if(voiceScript.trim()){
      const tag=emotion==="neutral"?"":"["+emotion+"] ";
      await Clipboard.setStringAsync(tag+voiceScript.trim());
      setCopied(true);
    }
    openStudio("voice",studioUrl("voice","/"),"RAINY Voice Studio");
  }
  function Voice(){
    return <>
      <Eyebrow>RAINY · AI VOICE STUDIO</Eyebrow>
      <Text style={S.h1}>Монгол дуу <Text style={{color:C.green}}>амьтай</Text> сонсогдоно.</Text>
      <Gap n={10}/><Copy>ElevenLabs-ийн Монгол хэлний TTS, олон хоолой, эмоц, подкаст, STT болон дубляжийн боломж.</Copy>
      <Gap n={22}/><Eyebrow>ХООЛОЙ СОНГОХ</Eyebrow>
      {voicesLoading?<ActivityIndicator color={C.green}/>:null}
      {voiceError?<Card><Text style={{color:C.danger}}>{voiceError}</Text><Gap n={12}/><Button title="Дахин ачаалах" secondary onPress={()=>void loadVoices()}/></Card>:null}
      <View style={{flexDirection:"row",flexWrap:"wrap"}}>
        {voiceOptions.slice(0,24).map(v=><Chip key={v.id} label={v.name} active={voiceName===v.name} onPress={()=>setVoiceName(v.name)}/>)}
      </View>
      {voiceOptions.length===0&&!voicesLoading&&!voiceError?<Copy muted>Серверийн хоолойн жагсаалтыг шалгаж байна.</Copy>:null}
      <Gap n={12}/><Eyebrow>СЭТГЭЛ ХӨДЛӨЛ</Eyebrow>
      <View style={{flexDirection:"row",flexWrap:"wrap"}}>
        {emotions.map(e=><Chip key={e.value} label={e.label} active={emotion===e.value} onPress={()=>setEmotion(e.value)}/>)}
      </View>
      <Gap n={14}/><Eyebrow>УНШУУЛАХ ТЕКСТ</Eyebrow>
      <TextInput accessibilityLabel="Монгол хоолойн текст" value={voiceScript} onChangeText={v=>{setVoiceScript(v);setCopied(false);}}
        placeholder="Энд Монгол текстээ бич..." placeholderTextColor={C.muted} multiline maxLength={12000}
        style={[S.input,{minHeight:145}]}/>
      <Gap n={10}/><Copy muted>Voice Studio-д Eleven v4 загвар сонговол эмоцын tag дэмжигдэнэ. Бодит дууны чанар, дуудлага нь загвар болон эх текстээс хамаарна.</Copy>
      <Gap n={17}/><Button title="Текст хуулаад Voice Studio нээх ↗" color={C.green} onPress={()=>void openVoiceWithScript()}/>
      <Gap n={11}/><Button title={copied?"Текст хуулагдсан ✓":"Зөвхөн текст хуулах"} secondary
        onPress={()=>void Clipboard.setStringAsync((emotion==="neutral"?"":"["+emotion+"] ")+voiceScript).then(()=>setCopied(true))}/>
      <Gap n={12}/><Copy muted>Сонгосон дууны нэр: {voiceName||"Хоолой сонгоогүй"}. Веб студид нээхдээ дууны нэр, эмоцоо дахин сонгоно. Хоёр талын данс/кредит тусдаа хэвээр.</Copy>
    </>;
  }

  function Projects(){
    return <>
      <Eyebrow>МИНИЙ БҮТЭЭЛҮҮД</Eyebrow>
      <Text style={S.h1}>Таны <Text style={{color:C.yellow}}>бүтээлийн</Text> сан.</Text>
      <Gap n={11}/><Copy>Видео болон дууны үүсгэлтийн түүх тусдаа сервер дээр хадгалагддаг. Эндээс бүртгэлдээ нэвтэрч өөрийн ажлуудаа үзнэ.</Copy>
      <Gap n={22}/>
      <Card>
        <Text style={{color:C.yellow,fontSize:24}}>▷</Text><Gap n={8}/>
        <Text style={S.h2}>Video Projects</Text><Copy>Кадрууд, зураг, үүсгэлтийн статус, бэлэн видеонууд.</Copy><Gap n={15}/>
        <Button title="Видео бүтээлүүдээ үзэх ↗" onPress={()=>openStudio("video",studioUrl("video","/studio"),"Видео бүтээлийн түүх")}/>
      </Card>
      <Gap n={12}/>
      <Card><Text style={{color:C.green,fontSize:26}}>♫</Text><Gap n={8}/>
        <Text style={S.h2}>Voice History</Text><Copy>Дуу, подкаст, TTS, дубляжийн үүсгэлт, татах боломж.</Copy><Gap n={15}/>
        <Button title="Voice бүтээлүүдээ үзэх ↗" color={C.green} onPress={()=>openStudio("voice",studioUrl("voice","/"),"Дууны түүх")}/>
      </Card>
      <Gap n={14}/><Copy muted>Нэгдсэн төслийн сан, файлуудын автомат нийлүүлэлт болон нэг MP4 экспорт нь дараагийн хөгжүүлэлтийн ажил.</Copy>
    </>;
  }

  function Profile(){
    return <>
      <Eyebrow>ДАНС БА ХОЛБОЛТ</Eyebrow>
      <Text style={S.h1}>Нэг апп. <Text style={{color:C.yellow}}>Хоёр студи.</Text></Text>
      <Gap n={11}/><Copy>Одоо Video болон Voice хоёр өөрийн нэвтрэх бүртгэлтэй. Аюулгүй нэгдсэн SSO баталгаажаагүй тул тэдгээрийн мэдээлэл, кредитийг нийлүүлсэн мэт харуулахгүй.</Copy>
      <Gap n={22}/>
      <Card><Text style={S.h2}>Video Studio</Text>
        <ServiceIndicator label="RAVS сервер" ready={health.video}/>
        <Gap n={13}/><Button title="RAVS бүртгэлээр нэвтрэх ↗" onPress={()=>openStudio("video",studioUrl("video","/login"),"Video нэвтрэх")}/>
      </Card>
      <Gap n={12}/>
      <Card><Text style={S.h2}>Voice Studio</Text>
        <ServiceIndicator label="Voice сервер" ready={health.voice}/>
        <Gap n={13}/><Button title="Voice бүртгэлээр нэвтрэх ↗" color={C.green} onPress={()=>openStudio("voice",studioUrl("voice","/"),"Voice нэвтрэх")}/>
      </Card>
      <Gap n={21}/>
      <Eyebrow>CHATGPT / CLAUDE MCP</Eyebrow>
      <Copy>ChatGPT/Claude дотор хоёр тусдаа MCP connector-ийг OAuth зөвшөөрлөөр нэмж, нэг ярианаас ажлын урсгалыг удирдах боломжтой. Энэ нь мобайл апп дотор шинэ chatbot үүсгэсэн гэсэн үг биш.</Copy>
      <Gap n={14}/>
      <Button title="Video MCP заавар ↗" secondary onPress={()=>openStudio("video",studioUrl("video","/integrations"),"Video MCP холболт")}/>
      <Gap n={9}/>
      <Button title="Voice MCP заавар ↗" secondary onPress={()=>openStudio("voice",studioUrl("voice","/integrations"),"Voice MCP холболт")}/>
      <Gap n={22}/><Copy muted>© 2026 RAINY Studio. Higgsfield/ElevenLabs-ийн API ашиглалт нь албан ёсны түншийн статус биш.</Copy>
    </>;
  }

  const show=tab==="home"?Home:tab==="video"?Video:tab==="voice"?Voice:tab==="projects"?Projects:Profile;

  return <SafeAreaView style={[S.page,{paddingTop:Platform.OS==="android"?(NativeStatusBar.currentHeight||0):0}]}>
    <StatusBar style="dark"/>
    {browser?<BrowserPane browser={browser} onClose={()=>setBrowser(null)}/>:<>
      <Header/>
      <ScrollView key={tab} style={{flex:1}} keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={C.yellow} onRefresh={()=>void refreshAll()}/>}>
        <View style={S.container}>{show()}</View>
      </ScrollView>
      <View style={{flexDirection:"row",backgroundColor:C.white,borderTopColor:C.outline,
        borderTopWidth:1,paddingBottom:Platform.OS==="ios"?12:5,paddingTop:9,paddingHorizontal:5}}>
        {NAV.map(item=>{
          const active=tab===item.key;
          return <Pressable key={item.key} accessibilityRole="tab" accessibilityState={{selected:active}}
            onPress={()=>setTab(item.key)} style={{flex:1,alignItems:"center",gap:4,paddingVertical:4}}>
            <View style={{width:45,height:29,borderRadius:12,alignItems:"center",justifyContent:"center",
              backgroundColor:active?"#ECEAFF":"transparent"}}>
              <Ionicons name={active?item.active:item.icon} size={21} color={active?C.primary:C.subtle}/>
            </View>
            <Text style={{fontSize:10,fontWeight:active?"800":"600",color:active?C.primary:C.muted}}>{item.title}</Text>
          </Pressable>;
        })}
      </View>
    </>}
  </SafeAreaView>;
}

function BrowserPane({browser,onClose}:{browser:NonNullable<Browser>;onClose:()=>void}){
  const [canGoBack,setCanGoBack]=useState(false);
  const [busy,setBusy]=useState(true);
  const [failed,setFailed]=useState(false);
  const [webKey,setWebKey]=useState(0);
  const ref=React.useRef<WebView>(null);
  return <View style={{flex:1,backgroundColor:C.bg}}>
    <View style={{flexDirection:"row",alignItems:"center",paddingHorizontal:15,paddingVertical:12,gap:13,borderBottomWidth:1,borderColor:C.outline}}>
      <Pressable accessibilityRole="button" accessibilityLabel="Буцах" onPress={()=>{
        if(canGoBack)ref.current?.goBack();else onClose();
      }}><Text style={{color:C.primary,fontSize:26}}>‹</Text></Pressable>
      <View style={{flex:1}}><Text style={{fontSize:16,color:C.text,fontWeight:"800"}}>{browser.title}</Text>
        <Text style={S.caption} numberOfLines={1}>{browser.studio==="video"?"video.rainy.studio":"voice.rainy.studio"}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Эхний хуудас" onPress={onClose}>
        <Text style={{color:C.text,fontSize:22}}>×</Text>
      </Pressable>
    </View>
    {failed?<View style={{padding:22,gap:13}}>
      <Text style={S.h2}>Студийг ачаалж чадсангүй</Text><Copy>Интернэт холболт болон сайтын ажиллагааг шалгана уу.</Copy>
      <Button title="Дахин ачаалах" onPress={()=>{setFailed(false);setWebKey(x=>x+1);}}/>
      <Button title="Аппын нүүр рүү буцах" secondary onPress={onClose}/>
    </View>:<WebView key={browser.url+webKey} ref={ref} source={{uri:browser.url}}
      javaScriptEnabled domStorageEnabled sharedCookiesEnabled thirdPartyCookiesEnabled={false}
      mixedContentMode="never" originWhitelist={["https://*"]}
      onNavigationStateChange={state=>{setCanGoBack(state.canGoBack);setBusy(state.loading);}}
      onShouldStartLoadWithRequest={request=>{
        if(isTrustedStudioUrl(request.url,browser.studio))return true;
        // Unknown links leave the WebView and cannot read its cookies.
        if(request.url.startsWith("https://"))void Linking.openURL(request.url).catch(()=>{});
        return false;
      }}
      onError={()=>setFailed(true)} onHttpError={event=>{if(event.nativeEvent.statusCode>=500)setFailed(true);}}
      startInLoadingState renderLoading={()=><ActivityIndicator style={{flex:1}} size="large" color={C.primary}/>}
      style={{flex:1,backgroundColor:C.bg}}/>}
    {busy&&!failed?<View style={{position:"absolute",right:14,top:60}}><ActivityIndicator size="small" color={C.yellow}/></View>:null}
  </View>;
}
