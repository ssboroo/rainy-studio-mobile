import { StyleSheet } from "react-native";
/**
 * RAINY Studio Mobile — daylight design system.
 * Warm-white canvas, ink typography, violet focus, pale-yellow Video and mint Voice.
 * Vendor-specific brands are accent colors, not claims of affiliation.
 */
export const C = {
  bg:"#F7F8FA",panel:"#FFFFFF",panel2:"#F1F3F7",text:"#17212E",
  muted:"#758091",outline:"#E7EAF0",yellow:"#F0C44D",green:"#23B58A",
  teal:"#45CDB5",danger:"#DD5868",primary:"#6357EB",ink:"#192131",
  softViolet:"#EFEDFF",softYellow:"#FFF4D7",softMint:"#EAF8F1",white:"#FFFFFF",
  heading:"#181D2C",subtle:"#A0AAB9",shadow:"#101828"
};
export const S=StyleSheet.create({
  page:{flex:1,backgroundColor:C.bg},
  container:{paddingHorizontal:21,paddingTop:8,paddingBottom:44},
  eyebrow:{color:C.muted,fontSize:10,fontWeight:"800",letterSpacing:1.25,marginBottom:10},
  h1:{color:C.heading,fontSize:33,lineHeight:39,fontWeight:"800",letterSpacing:-1.35},
  h2:{color:C.heading,fontSize:21,fontWeight:"800",letterSpacing:-.45,marginBottom:12},
  body:{color:"#667286",fontSize:13.5,lineHeight:21},
  caption:{color:C.muted,fontSize:11.5,lineHeight:17},
  card:{backgroundColor:C.white,borderWidth:1,borderColor:C.outline,borderRadius:22,padding:18,
    shadowColor:C.shadow,shadowOpacity:.035,shadowRadius:18,shadowOffset:{width:0,height:5},elevation:1},
  input:{backgroundColor:C.white,borderWidth:1,borderColor:C.outline,borderRadius:17,paddingHorizontal:16,
    paddingVertical:14,fontSize:14.5,color:C.text,textAlignVertical:"top",lineHeight:21},
  chip:{borderWidth:1,borderColor:C.outline,backgroundColor:C.white,borderRadius:13,
    paddingHorizontal:14,paddingVertical:10,marginRight:7,marginBottom:8},
  chipActive:{borderColor:C.primary,backgroundColor:C.softViolet},
  chipText:{color:"#7B8494",fontWeight:"700",fontSize:12},
  chipTextActive:{color:C.primary},
  action:{backgroundColor:C.ink,borderRadius:16,minHeight:52,alignItems:"center",justifyContent:"center",
    paddingHorizontal:17,flexDirection:"row",gap:7},
  actionText:{color:C.white,fontWeight:"800",fontSize:13.5},
  secondary:{backgroundColor:C.white,borderRadius:15,minHeight:48,alignItems:"center",justifyContent:"center",
    paddingHorizontal:15,borderWidth:1,borderColor:C.outline,flexDirection:"row",gap:7},
  secondaryText:{color:C.heading,fontWeight:"800",fontSize:13}
});
