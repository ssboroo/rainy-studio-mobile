import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, BackHandler, KeyboardAvoidingView, Linking, Platform,
  Pressable, RefreshControl, SafeAreaView, ScrollView, StatusBar as NativeStatusBar,
  Text, TextInput, View
} from "react-native";
import { WebView } from "react-native-webview";
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
const NAV: {key:Tab;symbol:string;title:string}[] = [
  {key:"home",symbol:"⌂",title:"Нүүр"},{key:"video",symbol:"▷",title:"Видео"},
  {key:"voice",symbol:"♫",title:"Хоолой"},{key:"projects",symbol:"▦",title:"Төслүүд"},
  {key:"profile",symbol:"◎",title:"Профайл"}
];
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

  const Header=()=> <View style={{paddingHorizontal:20,paddingTop:6,paddingBottom:14,flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
    <View style={{flexDirection:"row",alignItems:"center",gap:9}}>
      <View style={{width:30,height:30,borderRadius:12,backgroundColor:C.yellow,alignItems:"center",justifyContent:"center"}}>
        <Text style={{fontSize:18,fontWeight:"900",color:C.bg}}>R</Text>
      </View>
      <Text style={{fontSize:18,color:C.text,fontWeight:"900",letterSpacing:1}}>RAINY<Text style={{color:C.yellow}}> STUDIO</Text></Text>
    </View>
    <View style={{backgroundColor:C.panel2,paddingHorizontal:10,paddingVertical:7,borderRadius:10,borderWidth:1,borderColor:C.outline}}>
      <Text style={{color:C.muted,fontSize:10,fontWeight:"800",letterSpacing:1}}>MOBILE BETA</Text>
    </View>
  </View>;

  function Home(){
    return <>
      <View style={{padding:24,borderRadius:28,backgroundColor:"#191E26",borderColor:"#333B45",borderWidth:1,overflow:"hidden"}}>
        <View style={{position:"absolute",width:220,height:220,borderWidth:45,borderColor:"#313624",borderRadius:130,right:-90,top:-110}}/>
        <View style={{position:"absolute",width:165,height:165,borderWidth:28,borderColor:"#3D3918",borderRadius:99,right:-55,top:30}}/>
        <Eyebrow>MONOGOLIAN AI CREATIVE PLATFORM</Eyebrow>
        <Text style={{fontSize:35,lineHeight:41,fontWeight:"900",color:C.text,maxWidth:290}}>Санаанаас{"\n"}<Text style={{color:C.yellow}}>бэлэн бүтээл</Text> хүртэл.</Text>
        <Gap n={12}/>
        <Text style={[S.body,{maxWidth:310}]}>Видео, зураг, сэтгэл хөдлөлтэй Монгол дуу хоолой. Нэг RAINY экосистем.</Text>
        <Gap n={20}/>
        <Button title="Видео бүтээж эхлэх ↗" onPress={()=>setTab("video")}/>
      </View>
      <Gap n={20}/>
      <TwoColumn>
        <View style={{flex:1}}><Card style={{backgroundColor:"#222011",minHeight:134,borderColor:"#534B1E"}}>
          <Text style={{color:C.yellow,fontSize:26}}>▷</Text><Gap n={8}/>
          <Text style={{color:C.text,fontWeight:"800",fontSize:18}}>Video</Text>
          <Copy muted>AI кино, зураг, зар сурталчилгаа</Copy>
          <Gap n={14}/><Button title="Нээх" secondary onPress={()=>setTab("video")}/>
        </Card></View>
        <View style={{flex:1}}><Card style={{backgroundColor:"#1C281B",minHeight:134,borderColor:"#304B2B"}}>
          <Text style={{color:C.green,fontSize:26}}>♫</Text><Gap n={8}/>
          <Text style={{color:C.text,fontWeight:"800",fontSize:18}}>Voice</Text>
          <Copy muted>Монгол хоолой, эмоц, дубляж</Copy>
          <Gap n={14}/><Button title="Нээх" secondary onPress={()=>setTab("voice")}/>
        </Card></View>
      </TwoColumn>
      <Gap n={25}/>
      <Eyebrow>ШУУД БҮТЭЭХ САНААНУУД</Eyebrow>
      {starters.map(x=><Pressable key={x.label} onPress={()=>{setVideoPrompt(x.text);setTab("video");}}
        style={[S.card,{marginBottom:10,flexDirection:"row",alignItems:"center",gap:12}]}>
        <View style={{width:45,height:45,borderRadius:14,backgroundColor:"#363119",alignItems:"center",justifyContent:"center"}}>
          <Text style={{color:C.yellow,fontSize:22}}>✦</Text>
        </View>
        <View style={{flex:1}}><Text style={{color:C.muted,fontSize:10,fontWeight:"800",letterSpacing:1}}>{x.tag}</Text>
          <Gap n={4}/><Text style={{color:C.text,fontWeight:"800",fontSize:15}}>{x.label}</Text></View>
        <Text style={{color:C.yellow,fontSize:20}}>›</Text>
      </Pressable>)}
      <Gap n={18}/>
      <Card><Eyebrow>СЕРВЕРИЙН ХОЛБОЛТ</Eyebrow>
        <ServiceIndicator label="Video Studio" ready={health.video}/>
        <Gap n={10}/><ServiceIndicator label="Voice Studio" ready={health.voice}/>
        <Gap n={12}/><Copy muted>Холболт онлайн байх нь генерац болон төлбөрийн үйлчилгээ амжилттай гэсэн баталгаа биш.</Copy>
        <Gap n={14}/><Button title={loadingHealth?"Шалгаж байна…":"Холболт шинэчлэх"} secondary disabled={loadingHealth} onPress={()=>void loadHealth()}/>
      </Card>
    </>;
  }

  function Video(){
    return <>
      <Eyebrow>RAVS · AI VIDEO STUDIO</Eyebrow>
      <Text style={S.h1}>Санаагаа <Text style={{color:C.yellow}}>хөдөлгөөн</Text> болго.</Text>
      <Gap n={10}/><Copy>Монгол prompt бичээд тохирох модель сонго. Эцсийн үнэ, кредит, үүсгэлтийг RAVS веб студи дээр баталгаажуулна.</Copy>
      <Gap n={22}/>
      <Eyebrow>ЮУ БҮТЭЭХ ВЭ?</Eyebrow>
      <View style={{flexDirection:"row",flexWrap:"wrap"}}>
        {[["all","Бүгд"],["video","Видео"],["image","Зураг"],["workflow","Workflow"]].map(([key,label])=>
          <Chip key={key} label={label} active={filter===key} onPress={()=>setFilter(key as typeof filter)}/>)}
      </View>
      <Gap n={8}/>
      <TextInput placeholder="Модель хайх..." placeholderTextColor={C.muted} value={search} onChangeText={setSearch} style={S.input}/>
      <Gap n={12}/>
      {modelsLoading?<ActivityIndicator color={C.yellow}/>:null}
      {modelError?<Card><Text style={{color:C.danger}}>{modelError}</Text><Gap n={12}/><Button title="Дахин ачаалах" secondary onPress={()=>void loadModels()}/></Card>:null}
      {visibleModels.length===0&&!modelsLoading&&!modelError?<Copy muted>Сонгосон шүүлтүүрт тохирох модель алга.</Copy>:null}
      {visibleModels.map(m=><Pressable onPress={()=>setSelectedModel(m.slug)} key={m.slug}
        style={[S.card,{marginBottom:9,padding:15,borderColor:selectedModel===m.slug?C.yellow:C.outline}]}>
        <View style={{flexDirection:"row",alignItems:"center",gap:10}}>
          <View style={{height:34,width:34,borderRadius:12,backgroundColor:m.kind==="image"?"#273825":"#393117",alignItems:"center",justifyContent:"center"}}>
            <Text style={{color:m.kind==="image"?C.green:C.yellow,fontSize:20}}>{m.kind==="image"?"▣":"▷"}</Text>
          </View>
          <View style={{flex:1}}><Text style={{color:C.text,fontWeight:"800",fontSize:15}} numberOfLines={1}>{m.name}</Text>
            <Text style={S.caption}>{m.maker||m.provider||m.kind} · {m.apiVerified?"API үнэ дэмжигдсэн":"Сайт дээр боломжийг шалгах"}</Text></View>
          {selectedModel===m.slug?<Text style={{color:C.yellow,fontWeight:"900",fontSize:21}}>✓</Text>:null}
        </View>
      </Pressable>)}
      <Gap n={17}/>
      <Eyebrow>САНААГАА БИЧ</Eyebrow>
      <TextInput accessibilityLabel="Видео prompt" multiline value={videoPrompt} onChangeText={setVideoPrompt}
        maxLength={2400} placeholder="Жишээ: Монгол тал нутгийн нар мандах кино кадр..."
        placeholderTextColor={C.muted} style={[S.input,{minHeight:122}]}/>
      <Gap n={10}/><Copy muted>{videoPrompt.length}/2400 тэмдэгт · Модель: {model?.name||"сонгоогүй"}</Copy>
      <Gap n={16}/><Button title="Видео студид үргэлжлүүлэх ↗"
        onPress={()=>openStudio("video",composeVideoUrl(selectedModel,videoPrompt),"RAINY Video Studio")}/>
      <Gap n={12}/><Copy muted>Хэрэглэгч RAVS дансаар нэвтэрч, видео/зургийн төлбөртэй үүсгэлтийг өөрөө баталгаажуулна.</Copy>
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
    <StatusBar style="light" backgroundColor={C.bg}/>
    {browser?<BrowserPane browser={browser} onClose={()=>setBrowser(null)}/>:<>
      <Header/>
      <ScrollView key={tab} style={{flex:1}} keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={C.yellow} onRefresh={()=>void refreshAll()}/>}>
        <View style={S.container}>{React.createElement(show)}</View>
      </ScrollView>
      <View style={{flexDirection:"row",backgroundColor:"#11151B",borderTopColor:C.outline,borderTopWidth:1,paddingBottom:Platform.OS==="ios"?10:4,paddingTop:9}}>
        {NAV.map(item=><Pressable key={item.key} onPress={()=>setTab(item.key)} accessibilityRole="tab"
            accessibilityState={{selected:tab===item.key}}
            style={{flex:1,alignItems:"center",justifyContent:"center",paddingVertical:5}}>
          <Text style={{color:tab===item.key?C.yellow:C.muted,fontSize:23,fontWeight:"600"}}>{item.symbol}</Text>
          <Text style={{color:tab===item.key?C.yellow:C.muted,fontSize:10,fontWeight:tab===item.key?"800":"600"}}>{item.title}</Text>
        </Pressable>)}
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
      }}><Text style={{color:C.yellow,fontSize:26}}>‹</Text></Pressable>
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
      startInLoadingState renderLoading={()=><ActivityIndicator style={{flex:1}} size="large" color={C.yellow}/>}
      style={{flex:1,backgroundColor:C.bg}}/>}
    {busy&&!failed?<View style={{position:"absolute",right:14,top:60}}><ActivityIndicator size="small" color={C.yellow}/></View>:null}
  </View>;
}
