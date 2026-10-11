import React from "react";
import { Pressable, StyleProp, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S } from "./styles";

export function Eyebrow({children}:{children:React.ReactNode}) {
  return <Text style={S.eyebrow}>{children}</Text>;
}
export function Copy({children,muted=false}:{children:React.ReactNode;muted?:boolean}) {
  return <Text style={muted?S.caption:S.body}>{children}</Text>;
}
export function Gap({n=16}:{n?:number}){return <View style={{height:n}}/>;}
export function Card({children,style}:{children:React.ReactNode;style?:StyleProp<ViewStyle>}) {
  return <View style={[S.card,style]}>{children}</View>;
}
export function Button({title,onPress,secondary=false,disabled=false,color,style}:{
 title:string;onPress:()=>void;secondary?:boolean;disabled?:boolean;color?:string;style?:StyleProp<ViewStyle>;
}) {
  const dark=Boolean(!secondary && color && !["#F0C44D","#23B58A","#FFE500","#B7FF4A"].includes(color));
  return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress}
    style={({pressed})=>[secondary?S.secondary:S.action,{opacity:disabled?.45:pressed?.8:1},color?{backgroundColor:color}:{},style]}>
    <Text style={[secondary?S.secondaryText:S.actionText, dark?{color:C.white}:null]}>{title}</Text>
    <Ionicons name="arrow-forward" color={secondary?C.text:C.white} size={16}/>
  </Pressable>;
}
export function Chip({label,active,onPress}:{label:string;active:boolean;onPress:()=>void}) {
  return <Pressable accessibilityRole="button" accessibilityState={{selected:active}}
    onPress={onPress} style={[S.chip,active&&S.chipActive]}>
    <Text style={[S.chipText,active&&S.chipTextActive]}>{label}</Text>
  </Pressable>;
}
export function TwoColumn({children}:{children:React.ReactNode}) {
  return <View style={{flexDirection:"row",gap:11}}>{children}</View>;
}
export function ServiceIndicator({label,ready}:{label:string;ready:boolean|null}) {
  const color=ready===null?C.subtle:ready?C.green:C.danger;
  return <View style={{flexDirection:"row",alignItems:"center",gap:8}}>
    <View style={{width:7,height:7,borderRadius:7,backgroundColor:color}}/>
    <Text style={[S.caption,{fontWeight:"700"}]}>{label}{ready===null?" · шалгаж байна":ready?" · холбогдсон":" · холболтгүй"}</Text>
  </View>;
}
